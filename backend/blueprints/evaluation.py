from flask import Blueprint, request, jsonify, current_app
from extensions import db
from models.child import Child
from services.audio_classifier import AudioClassifier
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import uuid
from werkzeug.utils import secure_filename

evaluation_bp = Blueprint('evaluation', __name__)
classifier = AudioClassifier()

@evaluation_bp.route('/test', methods=['POST'])
@jwt_required()
def submit_test():
    if 'file' not in request.files:
         return jsonify({"msg": "No file part"}), 400

    file = request.files['file']
    child_id = request.form.get('child_id')
    
    if not child_id:
        return jsonify({"msg": "Child ID required"}), 400
        
    child = Child.query.get_or_404(child_id)
    
    # Ownership Check
    current_user_id = int(get_jwt_identity())
    if child.tutor_id != current_user_id and child.created_by_id != current_user_id: # Allow Ortho too?
         # Strictly speaking, usually Tutors run this.
         if child.tutor_id != current_user_id:
             return jsonify({"msg": "Unauthorized"}), 403

    if file.filename == '':
        return jsonify({"msg": "No selected file"}), 400

    # Save File
    ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'wav'
    filename = f"EVAL_{child.code}_{uuid.uuid4()}.{ext}"
    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'evaluations')
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # Run Classification
    predicted_class, confidence = classifier.classify(file_path)
    
    # Update Child
    child.has_initial_test = True
    child.evaluation_level = predicted_class
    child.evaluation_score = confidence
    
    db.session.commit()
    
    return jsonify({
        "msg": "Evaluation completed",
        "level": predicted_class,
        "score": confidence,
        "filename": filename
    }), 200
