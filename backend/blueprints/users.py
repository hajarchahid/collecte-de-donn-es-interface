from flask import Blueprint, request, jsonify, current_app, url_for
from extensions import db
from models.user import User
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from werkzeug.utils import secure_filename
import os
import time

users_bp = Blueprint('users', __name__)

def admin_required():
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") != "admin":
                return jsonify(msg="Admins only!"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

@users_bp.route('/', methods=['GET'])
@admin_required()
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    role_filter = request.args.get('role')
    exclude_role = request.args.get('exclude_role') # Support excluding a specific role
    search_query = request.args.get('search')
    status_filter = request.args.get('status')
    date_filter = request.args.get('date')

    query = User.query

    # 1. Role Filter
    if role_filter:
        query = query.filter_by(role=role_filter)
    elif exclude_role:
        query = query.filter(User.role != exclude_role)

    # 2. Search (Name, Email, Username)
    if search_query:
        term = f"%{search_query}%"
        query = query.filter(
            db.or_(
                User.username.ilike(term),
                User.email.ilike(term),
                User.first_name.ilike(term),
                User.last_name.ilike(term)
            )
        )

    # 3. Status Filter
    if status_filter:
        if status_filter == 'active':
            query = query.filter(User.is_active.is_(True))
        elif status_filter == 'inactive':
            query = query.filter(User.is_active.is_(False))

    # 4. Date Filter (YYYY-MM-DD)
    if date_filter:
        try:
            # Cast created_at to date for comparison
            query = query.filter(db.func.date(User.created_at) == date_filter)
        except Exception:
            pass # Ignore invalid dates

    pagination = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [user.to_dict() for user in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@users_bp.route('/', methods=['POST'])
@admin_required()
def create_user():
    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON"}), 400

    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = (data.get('email') or '').strip() or None
    phone_number = (data.get('phone_number') or '').strip() or None

    # V3: Must have Email OR Phone
    if not email and not phone_number:
        return jsonify({"msg": "Email ou Numéro de téléphone requis"}), 400

    if email and User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email déjà utilisé"}), 409
    
    # Auto-generate username from Name
    base_username = f"{first_name}.{last_name}".lower().replace(' ', '')
    if not base_username or base_username == '.':
        base_username = email.split('@')[0]
    
    # Ensure unique username
    username = base_username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username}{counter}"
        counter += 1

    # Use provided password or generate a random temp one
    temp_password = data.get('password')
    if not temp_password:
        import secrets
        import string
        alphabet = string.ascii_letters + string.digits
        temp_password = ''.join(secrets.choice(alphabet) for i in range(12))

    new_user = User(
        email=email,
        username=username, # Auto-generated
        first_name=first_name,
        last_name=last_name,
        phone_number=data.get('phone_number'),
        role=data.get('role', 'orthophoniste'),
        is_active=True, # Admin-created users are active immediately
        language=data.get('language', 'fr')
    )
    new_user.set_password(temp_password)
    
    db.session.add(new_user)
    db.session.commit()

    # Generate Activation Token (same mechanism as reset password)
    from flask_jwt_extended import create_access_token
    from datetime import timedelta
    from utils.email_sender import send_email
    from utils.email_translator import get_email_content

    activation_token = create_access_token(identity=str(new_user.id), additional_claims={"type": "activation"}, expires_delta=timedelta(hours=24))
    
    # Activation Link
    activation_link = f"https://www.speechai.fsac.ac.ma/activate-account?token={activation_token}"
    
    print(f"DEBUG: ACTIVATION LINK for {new_user.email}: {activation_link}", flush=True)

    # Use localized email content
    # For activation, we need: name, email, password, link
    subject, html_content = get_email_content(
        'activation',
        lang=new_user.language,
        name=f"{new_user.first_name} {new_user.last_name}",
        email=new_user.email,
        password=temp_password,
        link=activation_link
    )
    
    if email:
        try:
            send_email(new_user.email, subject, html_content)
        except Exception as e:
            print(f"Failed to send activation email: {e}")
            # Fallback to SMS if email fails? No, requirement says "Email OR Phone". 
            # If they have email, we assume it works.
    
    # SMS Logic (V3 Requirement: Fallback if NO email)
    elif new_user.phone_number:
        from services.sms_service import sms_service
        sms_message = f"Bonjour {new_user.first_name}, votre compte OrthoData est créé. Login: {new_user.email or new_user.phone_number}. MDP: {temp_password}. Activez ici: {activation_link}"
        try:
            sms_service.send_sms(new_user.phone_number, sms_message)
        except Exception as e:
             print(f"Failed to send activation SMS: {e}")

    return jsonify(new_user.to_dict()), 201

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    current_user_id = get_jwt()['sub'] 
    claims = get_jwt()
    is_admin = claims.get("role") == "admin"
    
    # Allow if admin or self
    if not is_admin and str(current_user_id) != str(user_id):
         return jsonify(msg="Unauthorized"), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'email' in data: user.email = data['email'] # Consider if email should be immutable too? User didn't say.
    
    # Block name changes for non-admins
    if is_admin:
        if 'username' in data: user.username = data['username']
        if 'first_name' in data: user.first_name = data['first_name']
        if 'last_name' in data: user.last_name = data['last_name']
    else:
        # Non-admins cannot change name/username
        # But we might want to check if they are trying to? 
        # For compatibility, just ignoring is safest for now to avoid 403s on "Enregistrer" of valid photo.
        pass

    if 'profile_photo' in data: user.profile_photo = data['profile_photo']
    if 'language' in data: user.language = data['language']

    if 'role' in data and is_admin: 
        user.role = data['role']
        if user.role != 'pending':
            user.is_active = True
            
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify(user.to_dict()), 200

@users_bp.route('/<int:user_id>/approve', methods=['PUT'])
@admin_required()
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    new_role = data.get('role')
    if not new_role or new_role not in ['orthophoniste', 'doctorante', 'encadrant', 'admin', 'tutor', 'tuteur']:
         return jsonify({"msg": "Rôle invalide"}), 400

    user.role = new_role
    user.is_active = True
    db.session.commit()
    
    return jsonify({"msg": f"Utilisateur validé avec le rôle {new_role}", "user": user.to_dict()}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@admin_required()
def delete_user(user_id):
    try:
        user = User.query.get_or_404(user_id)
        print(f"DEBUG: Attempting to delete user {user.username} (ID: {user_id})", flush=True)

        # Manually delete dependencies (logs) to avoid FK violation
        from models.researcher_log import ResearcherLog
        ResearcherLog.query.filter_by(researcher_id=user_id).delete()
        
        db.session.delete(user)
        db.session.commit()
        print(f"DEBUG: Successfully deleted user {user_id}", flush=True)
        return jsonify({"msg": "User deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"ERROR: Failed to delete user {user_id}: {e}", flush=True)
        return jsonify({"msg": f"Delete failed: {str(e)}"}), 500

@users_bp.route('/upload-photo', methods=['POST'])
@jwt_required()
def upload_photo():
    if 'file' not in request.files:
         return jsonify({"msg": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file:
        filename = secure_filename(file.filename)
        # Unique filename
        filename = f"{int(time.time())}_{filename}"
        
        # Save to static/uploads/profile_photos
        # Ensure 'static' exists in root
        upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'profile_photos')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Return relative path so it works regardless of domain/port
        photo_url = f"/static/uploads/profile_photos/{filename}"
        
        return jsonify({"url": photo_url}), 200
