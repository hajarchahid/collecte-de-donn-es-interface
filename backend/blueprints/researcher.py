from flask import Blueprint, jsonify, request, send_file, current_app, Response
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models.recording import Recording
from models.child import Child
from models.researcher_log import ResearcherLog
from models.user import User
from extensions import db
import os
import io
import zipfile
from datetime import datetime
from sqlalchemy import or_, func

researcher_bp = Blueprint('researcher', __name__)

def log_action(action_type, target_id=None):
    current_user_id = get_jwt_identity()
    log = ResearcherLog(
        researcher_id=current_user_id,
        action_type=action_type,
        target_id=str(target_id) if target_id else None
    )
    db.session.add(log)
    db.session.commit()

@researcher_bp.route('/recordings', methods=['GET'])
@jwt_required()
def get_recordings():
    claims = get_jwt()
    if claims.get("role") != 'doctorante':
        return jsonify({"msg": "Unauthorized"}), 403

    # Pagination parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    sort_by = request.args.get('sort_by', 'created_at') # created_at, classification, age
    order = request.args.get('order', 'desc') # Default to Anti-Chronological (Newest first)

    # Filters
    search = request.args.get('search')
    sex_filter = request.args.get('sex')
    class_filter = request.args.get('classification')
    date_filter = request.args.get('date') # YYYY-MM-DD
    status_filter = request.args.get('status') # 'new' or 'viewed'

    current_user_id = get_jwt_identity()
    
    # Get IDs of recordings already viewed by this researcher
    viewed_logs = db.session.query(ResearcherLog.target_id).filter_by(
        researcher_id=current_user_id, 
        action_type='VIEW_AUDIO'
    ).distinct().all()
    
    viewed_ids = []
    for r in viewed_logs:
        if r[0] and r[0].isdigit():
            viewed_ids.append(int(r[0]))
    
    viewed_ids_set = set(viewed_ids)

    # Query Builder: Join Patient AND User (Creator/Orthophonist)
    # Use outerjoin for User to ensure recordings with deleted creators still appear
    # Use outerjoin for Patient to ensure recordings with deleted patients still appear (orphans)
    query = db.session.query(Recording, Child, User)\
        .outerjoin(Child, Recording.child_id == Child.id)\
        .outerjoin(User, Recording.created_by_id == User.id)

    # Search Filter (Multi-field)
    if search:
        search_term = f"%{search}%"
        # Search in Patient Name (First/Last), Patient Code, Ortho Name (First/Last), Recording ID
        # Must handle if Patient or User is None (though query will just filter if join exists or check fields)
        # SQLAlchemy ilike on None fields is fine? No, accessing Patient.first_name if Patient is None is tricky.
        # Actually in SQLAlchemy, if outerjoined row is missing, the columns are NULL. `ilike` on NULL results in NULL (False).
        # So it should be safe.
        query = query.filter(or_(
            Child.first_name.ilike(search_term),
            Child.last_name.ilike(search_term),
            Child.name.ilike(search_term), # Legacy
            Child.code.ilike(search_term),
            User.first_name.ilike(search_term),
            User.last_name.ilike(search_term),
            db.cast(Recording.id, db.String).ilike(search_term)
        ))

    if sex_filter:
        query = query.filter(Child.sex == sex_filter)
    # Status filter logic ... (skipped unchanged lines)

    # Date Filter (Exact Day)
    if date_filter:
        try:
            # Assumes date_filter is YYYY-MM-DD
            query = query.filter(func.date(Recording.created_at) == date_filter)
        except:
            pass # Ignore invalid date

    # Apply Status Filter
    if status_filter == 'new':
        if viewed_ids:
            query = query.filter(~Recording.id.in_(viewed_ids))
    elif status_filter == 'viewed':
        if viewed_ids:
            query = query.filter(Recording.id.in_(viewed_ids))
        else:
            from sqlalchemy import false
            query = query.filter(false())

    # Source Filter (Ortho vs Tutor)
    source_filter = request.args.get('source')
    if source_filter:
        if source_filter == 'tutor':
            query = query.filter(User.role == 'tutor')
        elif source_filter == 'orthophoniste':
            # Include both ortho and potentially other professionals if needed, but strictly ortho for now
            query = query.filter(User.role == 'orthophoniste')

    # Sorting
    if sort_by == 'age':
        sort_column = Child.age
    elif sort_by == 'classification':
        sort_column = Recording.classification
    else:
        sort_column = Recording.created_at

    if order == 'asc':
        # nullsfirst/nullslast might be needed if sorting by missing patient age
        query = query.order_by(sort_column.asc().nulls_last())
    else:
        query = query.order_by(sort_column.desc().nulls_last())

    # Execute Pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    results = []
    for recording, child, user in pagination.items:
        is_viewed = recording.id in viewed_ids_set
        
        # Format Orthophonist Name / Source
        ortho_name = "Inconnu"
        source_type = "unknown"

        if user:
            source_type = user.role
            if user.role == 'tutor':
                # STRICT ANONYMIZATION for Tutors
                ortho_name = "Tuteur (Anonyme)"
            else:
                # Standard display for Orthophonists
                if user.last_name and user.first_name:
                    ortho_name = f"{user.last_name.upper()} {user.first_name}"
                elif user.username:
                    ortho_name = user.username.capitalize()
                else:
                    ortho_name = f"Ortho #{user.id}"
        else:
            ortho_name = "Compte Supprimé"

        # Format Child Data safely
        pat_code = "Inconnu"
        pat_age = "-"
        pat_sex = "-"
        
        if child:
            pat_code = child.code
            pat_age = child.calculate_age()
            pat_sex = child.sex

        results.append({
            "id": recording.id,
            "child_code": pat_code,
            "age": pat_age,
            "sex": pat_sex,
            "classification": recording.classification,
            "date": recording.created_at.isoformat() + 'Z', # Ensure UTC Z
            "duration": recording.duration,
            "status": "viewed" if is_viewed else "new",
            "orthophonist": ortho_name,
            "source_type": source_type
        })

    return jsonify({
        "recordings": results,
        "total": pagination.total,
        "pages": pagination.pages,
        "current_page": page
    }), 200

@researcher_bp.route('/recordings/<int:id>/listen', methods=['GET'])
@jwt_required()
def listen_recording(id):
    claims = get_jwt()
    if claims.get("role") != 'doctorante':
        return jsonify({"msg": "Unauthorized"}), 403

    recording = Recording.query.get_or_404(id)
    
    # Log Action
    log_action('VIEW_AUDIO', target_id=recording.id)

    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], recording.filename)
    
    if not os.path.exists(file_path):
        return jsonify({"msg": "File not found"}), 404

    return send_file(file_path, mimetype='audio/wav')

@researcher_bp.route('/export', methods=['GET'])
@jwt_required()
def export_dataset():
    claims = get_jwt()
    if claims.get("role") != 'doctorante':
        return jsonify({"msg": "Unauthorized"}), 403

    sex_filter = request.args.get('sex')
    class_filter = request.args.get('classification')
    source_filter = request.args.get('source')
    
    query = db.session.query(Recording, Child, User)\
        .join(Child, Recording.child_id == Child.id)\
        .join(User, Recording.created_by_id == User.id)

    if sex_filter: query = query.filter(Child.sex == sex_filter)
    if class_filter: query = query.filter(Recording.classification == class_filter)
    
    if source_filter:
        if source_filter == 'tutor':
            query = query.filter(User.role == 'tutor')
        elif source_filter == 'orthophoniste':
            query = query.filter(User.role == 'orthophoniste')
    
    # Sort by Class (Primary) then Date
    query = query.order_by(Recording.classification.asc(), Recording.created_at.asc())
    
    # Query returns tuples (Recording, Child, User)
    results = query.all()
    
    # Log Action
    for rec, _, _ in results:
        log_action('VIEW_AUDIO', target_id=rec.id)

    log_action('EXPORT_DATASET', target_id=f"Count: {len(results)}")

    # Create ZIP
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        csv_lines = ["filename,child_code,age,sex,classification,date,source_type,orthophonist_id"]
        
        for rec, pat, user in results:
            # Source Type
            source_type = user.role if user else "unknown"
            
            # Rigid Structure: dataset_root/{source_type}/{classification_level}/{filename}.wav
            
            # Classification Folder
            cls_name = rec.classification if rec.classification else "non_classe"
            if cls_name in ['1', '2', '3']:
                cls_name = f"classe_{cls_name}"
            else:
                cls_name = cls_name.lower().replace(' ', '_')
            
            # Source Folder (normalize)
            src_folder = source_type.lower()
            
            # Filename in Zip
            zip_filename = f"dataset/{src_folder}/{cls_name}/{rec.filename}"
            
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], rec.filename)
            if os.path.exists(file_path):
                zf.write(file_path, zip_filename)
                
                # Update CSV (Include source_type)
                # Note: orthophonist_id corresponds to user_id (whether ortho or tutor)
                csv_lines.append(f"{zip_filename},{pat.code},{pat.age},{pat.sex},{rec.classification},{rec.created_at.isoformat()},{source_type},{rec.created_by_id}")
        
        zf.writestr("dataset/metadata.csv", "\n".join(csv_lines))
    
    memory_file.seek(0)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename_prefix = "dataset_anonymized"
    
    if source_filter:
        filename_prefix += f"_{source_filter}"
    
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f'{filename_prefix}_{timestamp}.zip'
    )
