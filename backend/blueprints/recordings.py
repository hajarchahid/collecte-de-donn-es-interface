from flask import Blueprint, request, jsonify, send_from_directory, current_app
from extensions import db
from models.recording import Recording
from models.child import Child
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import os
import uuid
import werkzeug.utils

recordings_bp = Blueprint('recordings', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'wav'}

@recordings_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    if 'file' not in request.files:
        return jsonify({"msg": "No file part"}), 400
    
    file = request.files['file']
    child_id = request.form.get('child_id')
    classification = request.form.get('classification')
    session_id = request.form.get('session_id')
    
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get("role")
    
    # Tutor Limit Check (20 per day)
    if role == 'tutor':
        from sqlalchemy import func
        from datetime import date
        
        today_count = Recording.query.filter_by(created_by_id=current_user_id).filter(
            func.date(Recording.created_at) == date.today()
        ).count()
        
        if today_count >= 20:
             return jsonify({"msg": "Limite quotidienne atteinte (20 enregistrements maximum par jour)."}), 429

    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        # Secure filename and use UUID
        ext = file.filename.rsplit('.', 1)[1].lower()
        new_filename = f"{uuid.uuid4()}.{ext}"
        
        # Ensure upload directory exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
            
        file.save(os.path.join(upload_folder, new_filename))
        
        # Save to DB
        new_recording = Recording(
            filename=new_filename,
            original_name=werkzeug.utils.secure_filename(file.filename),
            classification=classification,
            child_id=child_id,
            session_id=session_id,
            created_by_id=get_jwt_identity()
        )
        
        db.session.add(new_recording)
        db.session.commit()
        
        return jsonify(new_recording.to_dict()), 201
        
    return jsonify({"msg": "Invalid file type"}), 400

@recordings_bp.route('/child/<int:child_id>', methods=['GET'])
@jwt_required()
def get_child_recordings(child_id):
    recordings = Recording.query.filter_by(child_id=child_id).all()
    return jsonify([r.to_dict() for r in recordings]), 200

@recordings_bp.route('/stream/<filename>', methods=['GET'])
@jwt_required()
def stream_file(filename):
    # Basic permission check could go here
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

@recordings_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_recordings():
    # Filters
    sex = request.args.get('sex')
    classification = request.args.get('classification')
    
    query = Recording.query.join(Child).join(Recording.creator)
    
    if sex:
        query = query.filter(Child.sex == sex)
    if classification:
        query = query.filter(Recording.classification == classification)
        
    # Source Filter (Ortho vs Tutor)
    source = request.args.get('source')
    if source:
        if source == 'tutor':
            query = query.filter(Recording.creator.has(role='tutor'))
        elif source == 'ortho':
            query = query.filter(Recording.creator.has(role='orthophoniste'))

    recordings = query.all()
    
    recordings = query.all()
    
    # Custom serialization for explorer
    data = []
    for r in recordings:
        item = r.to_dict()
        item['child_sex'] = r.child.sex
        item['child_age'] = r.child.age
        
        # Add creator info for display
        item['creator_role'] = r.creator.role
        item['creator_name'] = "Anonyme" # Default for researchers
        
        data.append(item)
        
    return jsonify({
        "recordings": data,
        "total": len(data), # Pagination logic can be added later
        "pages": 1
    }), 200

import zipfile
import io
from flask import send_file

@recordings_bp.route('/export', methods=['GET'])
@jwt_required()
def export_recordings():
    # Re-use similar filter logic or export all
    # For now, simple export all found in query
    sex = request.args.get('sex')
    classification = request.args.get('classification')
    source = request.args.get('source')
    
    query = Recording.query.join(Child).join(Recording.creator)
    if sex: query = query.filter(Child.sex == sex)
    if classification: query = query.filter(Recording.classification == classification)
    if source:
        if source == 'tutor':
             query = query.filter(Recording.creator.has(role='tutor'))
        elif source == 'ortho':
             query = query.filter(Recording.creator.has(role='orthophoniste'))
    
    recordings = query.all()
    
    if not recordings:
        return jsonify({"msg": "No recordings found"}), 404
        
    # Create ZIP in memory
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        for r in recordings:
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], r.filename)
            if os.path.exists(file_path):
                # Name inside zip: /ClassX/ChildCode_Timestamp.wav
                arcname = f"Class{r.classification}/{r.child.code}_{r.filename}"
                zf.write(file_path, arcname)
                
    memory_file.seek(0)
    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name='dataset.zip'
    )
