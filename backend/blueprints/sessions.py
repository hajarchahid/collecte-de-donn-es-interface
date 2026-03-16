from flask import Blueprint, request, jsonify
from extensions import db
from models.session import Session
from models.child import Child
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.route('/child/<int:child_id>', methods=['GET'])
@jwt_required()
def get_child_sessions(child_id):
    # Security: Check if user owns patient or is generic role
    current_user_id = get_jwt_identity()
    try:
         current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
         return jsonify({"msg": "Invalid user identity"}), 401
         
    claims = get_jwt()
    role = claims.get('role')
    
    child = Child.query.get_or_404(child_id)
    
    # Isolation check
    if role == 'orthophoniste' and child.created_by_id != current_user_id:
        return jsonify({"msg": "Unauthorized"}), 403
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 5, type=int)
    
    pagination = Session.query.filter_by(child_id=child_id).order_by(Session.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    
    results = []
    for s in pagination.items:
        s_dict = s.to_dict()
        s_dict['recordings_count'] = len(s.recordings)
        results.append(s_dict)
        
    return jsonify({
        'sessions': results,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@sessions_bp.route('/', methods=['POST'])
@jwt_required()
def create_session():
    data = request.get_json()
    child_id = data.get('child_id')
    current_user_id = get_jwt_identity()
    try:
         current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
         return jsonify({"msg": "Invalid user identity"}), 401
    
    child = Child.query.get_or_404(child_id)
    # Check ownership
    claims = get_jwt()
    if claims.get('role') == 'orthophoniste' and child.created_by_id != current_user_id:
         return jsonify({"msg": "Unauthorized"}), 403

    new_session = Session(
        child_id=child_id,
        created_by_id=current_user_id,
        notes=data.get('notes', '')
    )
    
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify(new_session.to_dict()), 201

@sessions_bp.route('/<int:session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    current_user_id = get_jwt_identity()
    try:
         current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
         return jsonify({"msg": "Invalid user identity"}), 401
         
    claims = get_jwt()
    
    session = Session.query.get_or_404(session_id)
    
    # Ownership Check
    if claims.get('role') == 'orthophoniste' and session.created_by_id != current_user_id:
         return jsonify({"msg": "Unauthorized"}), 403
         
    s_dict = session.to_dict()
    # Embed detailed recordings
    s_dict['recordings'] = [r.to_dict() for r in session.recordings]
    return jsonify(s_dict), 200

@sessions_bp.route('/<int:session_id>', methods=['PUT'])
@jwt_required()
def update_session(session_id):
    current_user_id = get_jwt_identity()
    try:
         current_user_id = int(str(current_user_id))
    except (ValueError, TypeError):
         return jsonify({"msg": "Invalid user identity"}), 401
         
    session = Session.query.get_or_404(session_id)
    
    # Ownership Check
    claims = get_jwt()
    if claims.get('role') == 'orthophoniste' and session.created_by_id != current_user_id:
         return jsonify({"msg": "Unauthorized"}), 403
         
    data = request.get_json()
    if 'notes' in data:
        session.notes = data['notes']
        
    db.session.commit()
    return jsonify(session.to_dict()), 200
