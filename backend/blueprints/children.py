from flask import Blueprint, request, jsonify
from extensions import db
from models.child import Child
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

children_bp = Blueprint('children', __name__)

@children_bp.route('/', methods=['GET'])
@jwt_required()
def get_children():
    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
        # In case identity is not castable or None (though jwt_required handles authentication)
        pass 

    claims = get_jwt()
    role = claims.get('role')
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)

    query = Child.query.order_by(Child.created_at.desc())

    # Active Filter (Default: True)
    active_param = request.args.get('active', 'true')
    print(f"DEBUG: get_children active_param={active_param}", flush=True)
    if active_param.lower() == 'true':
        query = query.filter(Child.is_active == True)
    elif active_param.lower() == 'false':
         query = query.filter(Child.is_active == False)
    # else: 'all' -> no filter

    # Tutor ID Filter (Optional)
    tutor_id_param = request.args.get('tutor_id')
    if tutor_id_param:
        try:
             query = query.filter(Child.tutor_id == int(tutor_id_param))
        except ValueError:
             pass # Ignore invalid ID


    if role == 'orthophoniste':
        # Orthophoniste sees ONLY their own children
        # Orthophoniste sees children created by them OR assigned to them
        from sqlalchemy import or_
        query = query.filter(or_(Child.created_by_id == current_user_id, Child.ortho_id == current_user_id))
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'children': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    
    elif role == 'tutor':
        # Tutor sees ONLY children they are assigned to
        query = query.filter_by(tutor_id=current_user_id)
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'children': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200

    elif role == 'admin':
        # Admin sees ALL children with FULL details
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        return jsonify({
            'children': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200

    elif role in ['doctorante', 'encadrant']:
        # Research roles see ALL children but ANONYMIZED
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        results = []
        for c in pagination.items:
            c_data = c.to_dict()
            c_data.pop('name', None) # Anonymize
            results.append(c_data)
            
        return jsonify({
            'children': results,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    
    else:
        return jsonify({"msg": "Unauthorized"}), 403

@children_bp.route('/', methods=['POST'])
@jwt_required()
def create_child():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    
    # V3 Constraint: Only Admin creates children
    if role != 'admin':
        return jsonify({"msg": "Unauthorized: Only Administrators can create children."}), 403

    data = request.get_json()
    
    # Validate Orthophonist Assignment
    ortho_id = data.get('ortho_id')
    if not ortho_id:
        return jsonify({"msg": "Orthophonist assignment is required."}), 400
    try:
        ortho_id = int(ortho_id)
    except (ValueError, TypeError):
        return jsonify({"msg": "Invalid Orthophonist ID"}), 400
        
    # Auto-generate code: PAT-YYYY-UUID_SHORT
    import datetime
    import uuid
    year = datetime.datetime.now().year
    short_uuid = str(uuid.uuid4())[:8].upper()
    auto_code = f"PAT-{year}-{short_uuid}"

    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    birth_date_str = data.get('birth_date')
    birth_date = None
    if birth_date_str:
        try:
            birth_date = datetime.datetime.strptime(birth_date_str, '%Y-%m-%d').date()
        except ValueError:
            pass

    # Tutor Handling (Existing or New)
    tutor_data = data.get('tutor')
    tutor_id = None
    
    # Case 1: Existing Tutor Selected (ID provided)
    if tutor_data and tutor_data.get('id'):
        tutor_id = tutor_data.get('id')
    # Case 2: New Tutor Details Provided (Email provided)
    elif tutor_data and tutor_data.get('email'):
        from models.user import User
        # Check if user exists
        tutor_email = tutor_data.get('email').strip().lower()
        existing_tutor = User.query.filter_by(email=tutor_email).first()
        
        if existing_tutor:
            tutor_id = existing_tutor.id
        else:
            # Create NEW Tutor
            import secrets
            import string
            from werkzeug.security import generate_password_hash
            from flask_jwt_extended import create_access_token
            from datetime import timedelta
            from utils.email_sender import send_email
            from utils.email_translator import get_email_content

            alphabet = string.ascii_letters + string.digits
            temp_password = ''.join(secrets.choice(alphabet) for i in range(12))

            base_tutor_name = f"{tutor_data.get('first_name', '').strip()}.{tutor_data.get('last_name', '').strip()}".lower().replace(' ', '')
            if not base_tutor_name or base_tutor_name == '.':
                base_tutor_name = tutor_email.split('@')[0]
            
            tutor_username = base_tutor_name
            counter = 1
            while User.query.filter_by(username=tutor_username).first():
                tutor_username = f"{base_tutor_name}{counter}"
                counter += 1

            new_tutor = User(
                email=tutor_email,
                username=tutor_username,
                first_name=tutor_data.get('first_name', '').strip(),
                last_name=tutor_data.get('last_name', '').strip(),
                phone_number=tutor_data.get('phone', ''),
                role='tutor',
                is_active=False,
                language=tutor_data.get('language', 'fr') 
            )
            new_tutor.set_password(temp_password)
            try:
                db.session.add(new_tutor)
                db.session.commit()
                tutor_id = new_tutor.id
            except Exception as e:
                db.session.rollback()
                return jsonify({"msg": f"Erreur lors de la création du compte Tuteur: {str(e)}"}), 500
            
            # Send Activation Email
            try:
                activation_token = create_access_token(identity=str(new_tutor.id), additional_claims={"type": "activation"}, expires_delta=timedelta(hours=24))
                activation_link = f"http://localhost:5173/activate-account?token={activation_token}"
                
                subject, html_content = get_email_content(
                    'activation',
                    lang=new_tutor.language,
                    name=f"{new_tutor.first_name} {new_tutor.last_name}",
                    email=new_tutor.email,
                    password=temp_password,
                    link=activation_link
                )
                send_email(new_tutor.email, subject, html_content)
            except Exception as e:
                print(f"ERROR: Failed to send Tutor activation: {e}")

    new_child = Child(
        code=auto_code,
        first_name=first_name,
        last_name=last_name,
        name=f"{first_name} {last_name}".strip(),
        birth_date=birth_date,
        sex=data.get('sex'),
        pathology=data.get('pathology'),
        progression_level=data.get('progression_level'),
        comments=data.get('comments'),
        created_by_id=int(str(current_user_id)), # Admin
        tutor_id=tutor_id,
        ortho_id=ortho_id, # Assigned Ortho
        has_initial_test=False
    )
    
    if data.get('password'):
        new_child.set_password(data.get('password'))

    db.session.add(new_child)
    db.session.commit()
    
    # Create Notification for Orthophonist
    from models.notification import Notification
    
    # Get Admin Name for notification message (optional)
    # admin_user = User.query.get(current_user_id) 
    
    notif = Notification(
        user_id=ortho_id,
        title="Nouveau patient affecté",
        message=f"L'administration vous a affecté un nouveau patient : {new_child.first_name} {new_child.last_name}",
        link=f"/dashboard/children/{new_child.id}"
    )
    db.session.add(notif)
    db.session.commit()
    
    return jsonify(new_child.to_dict()), 201

@children_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_child(id):
    current_user_id = get_jwt_identity()
    child = Child.query.get_or_404(id)

    # Check ownership
    try:
         current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
         return jsonify({"msg": "Invalid user identity"}), 401

    claims = get_jwt()
    # Allow if admin OR creator
    if claims.get('role') != 'admin' and child.created_by_id != current_user_id:
        return jsonify({"msg": "Unauthorized: You can only update your own children"}), 403

    data = request.get_json()
    if not data:
        return jsonify({"msg": "Missing JSON"}), 400

    if 'first_name' in data: child.first_name = data['first_name']
    if 'last_name' in data: child.last_name = data['last_name']
    
    if 'birth_date' in data:
        try:
            import datetime
            child.birth_date = datetime.datetime.strptime(data['birth_date'], '%Y-%m-%d').date() if data['birth_date'] else None
        except ValueError:
            pass # Ignore invalid

    # Update legacy name if changed
    if 'first_name' in data or 'last_name' in data:
        child.name = f"{child.first_name or ''} {child.last_name or ''}".strip()

    if 'sex' in data: child.sex = data['sex']
    if 'comments' in data: child.comments = data['comments']
    if 'pathology' in data: child.pathology = data['pathology']
    if 'progression_level' in data: child.progression_level = data['progression_level']
    if 'password' in data and data['password']: child.set_password(data['password'])
    
    # Update Orthophonist
    if 'ortho_id' in data:
        try:
            child.ortho_id = int(data['ortho_id']) if data['ortho_id'] else None
        except (ValueError, TypeError):
            pass 

    # Update Active Status
    if 'is_active' in data:
        new_status = bool(data['is_active'])
        if child.is_active != new_status:
             child.is_active = new_status
             # Notify Orthophonist if assigned
             if child.ortho_id:
                 from models.notification import Notification
                 action = "restauré" if new_status else "archivé"
                 notif = Notification(
                     user_id=child.ortho_id,
                     title=f"Dossier {action}",
                     message=f"Le dossier de l'enfant {child.first_name} {child.last_name} a été {action} par l'administration.",
                     link=f"/dashboard/children/{child.id}" if new_status else None # No link for archived
                 )
                 db.session.add(notif)

    # Handle Tutor Updates
    tutor_data = data.get('tutor')
    if tutor_data:
        # If child already has a tutor, update their name/phone (but likely not email/identity)
        from models.user import User
        if child.tutor:
             # Update editable fields
             if tutor_data.get('first_name'): child.tutor.first_name = tutor_data.get('first_name')
             if tutor_data.get('last_name'): child.tutor.last_name = tutor_data.get('last_name')
             if tutor_data.get('phone'): child.tutor.phone_number = tutor_data.get('phone')
             # Note: Changing email might be dangerous as it changes login. Skipping email update for now unless needed.
        else:
             # Check if we should CREATE/LINK a tutor (if email provided)
             tutor_email = tutor_data.get('email', '').strip().lower()
             if tutor_email:
                 existing_tutor = User.query.filter_by(email=tutor_email).first()
                 if existing_tutor:
                     child.tutor_id = existing_tutor.id
                 else:
                     # Create NEW Tutor (reuse simple creation logic or extract)
                     # For brevity in this fix, we duplicate the essential creation parts
                     import secrets, string
                     from datetime import timedelta
                     from flask_jwt_extended import create_access_token
                     from utils.email_sender import send_email
                     from utils.email_translator import get_email_content
                     
                     alphabet = string.ascii_letters + string.digits
                     temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
                     
                     base_tutor_name = f"{tutor_data.get('first_name', '').strip()}.{tutor_data.get('last_name', '').strip()}".lower().replace(' ', '')
                     if not base_tutor_name or base_tutor_name == '.': base_tutor_name = tutor_email.split('@')[0]
                     
                     tutor_username = base_tutor_name
                     counter = 1
                     while User.query.filter_by(username=tutor_username).first():
                        tutor_username = f"{base_tutor_name}{counter}"
                        counter += 1
                        
                     new_tutor = User(
                        email=tutor_email,
                        username=tutor_username,
                        first_name=tutor_data.get('first_name', '').strip(),
                        last_name=tutor_data.get('last_name', '').strip(),
                        phone_number=tutor_data.get('phone', ''),
                        role='tutor',
                        is_active=False
                     )
                     new_tutor.set_password(temp_password)
                     db.session.add(new_tutor)
                     db.session.commit()
                     child.tutor_id = new_tutor.id
                     
                     # Send Email
                     try:
                        activation_token = create_access_token(identity=str(new_tutor.id), additional_claims={"type": "activation"}, expires_delta=timedelta(hours=24))
                        activation_link = f"http://localhost:5173/activate-account?token={activation_token}"
                        
                        print(f"==================================================", flush=True)
                        print(f"DEBUG: ACTIVATION LINK for {new_tutor.email}: {activation_link}", flush=True)
                        print(f"DEBUG: TEMP PASSWORD for {new_tutor.email}: {temp_password}", flush=True)
                        print(f"==================================================", flush=True)
                        
                        subject, html_content = get_email_content('activation', lang='fr', name=f"{new_tutor.first_name} {new_tutor.last_name}", email=new_tutor.email, password=temp_password, link=activation_link)
                        send_email(new_tutor.email, subject, html_content)
                     except Exception as e:
                        print(f"Failed to send email: {e}")

    db.session.commit()
    return jsonify(child.to_dict()), 200

@children_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_child(id):
    child = Child.query.get_or_404(id)
    # Security: Ensure only creator can view detail (or admin)
    current_user_id = get_jwt_identity()
    try:
         current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
         return jsonify({"msg": "Invalid user identity"}), 401
         
    claims = get_jwt()
    
    if claims.get('role') == 'orthophoniste' and child.created_by_id != current_user_id and child.ortho_id != current_user_id:
        return jsonify({"msg": f"Unauthorized access to this child."}), 403

    if claims.get('role') == 'tutor' and child.tutor_id != current_user_id:
        return jsonify({"msg": "Unauthorized: This child is not assigned to you."}), 403
        
    return jsonify(child.to_dict()), 200

@children_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_child(id):
    current_user_id = get_jwt_identity()
    child = Child.query.get_or_404(id)
    
    claims = get_jwt()
    # Allow if admin OR creator
    if claims.get('role') != 'admin' and child.created_by_id != current_user_id:
        return jsonify({"msg": "Unauthorized: You can only delete your own children"}), 403
    
    # Check for dependencies (Sessions)
    if child.sessions:
        return jsonify({
            "msg": "Suppression impossible : Cet enfant possède des séances enregistrées. Veuillez d'abord supprimer les séances ou archiver le dossier."
        }), 400
        
    try:
        db.session.delete(child)
        db.session.commit()
        return jsonify({"msg": "Enfant supprimé avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"msg": f"Erreur lors de la suppression : {str(e)}"}), 500
