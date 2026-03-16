from flask import Blueprint, jsonify
from extensions import db
from models.user import User
from models.child import Child
from models.recording import Recording
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from sqlalchemy import func

stats_bp = Blueprint('stats', __name__)

@stats_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary_stats():
    # Only Admin, Encadrant, Doctorante can see global stats
    # For now, open to all authenticated users for simplicity or restrict:
    claims = get_jwt()
    if claims.get("role") not in ['admin', 'encadrant', 'doctorante']:
        return jsonify({"msg": "Unauthorized"}), 403

    total_orthos = User.query.filter_by(role='orthophoniste').count()
    total_researchers = User.query.filter_by(role='doctorante').count()
    total_supervisors = User.query.filter_by(role='encadrant').count()
    total_tutors = User.query.filter_by(role='tutor').count()
    total_children = Child.query.count()
    total_recordings = Recording.query.count()
    
    # Class distribution
    class_stats = db.session.query(
        Recording.classification, func.count(Recording.id)
    ).group_by(Recording.classification).all()
    
    class_dist = {f"Classe {c}": count for c, count in class_stats if c}

    return jsonify({
        "total_ortho": total_orthos,
        "total_researchers": total_researchers,
        "total_supervisors": total_supervisors,
        "total_tutors": total_tutors,
        "total_patients": total_children,
        "total_recordings": total_recordings,
        "class_distribution": class_dist
    }), 200

@stats_bp.route('/researcher', methods=['GET'])
@jwt_required()
def get_researcher_stats():
    claims = get_jwt()
    if claims.get("role") != 'doctorante':
        return jsonify({"msg": "Unauthorized"}), 403

    current_user_id = get_jwt_identity()

    # Basic Counts
    total_audios = Recording.query.count()
    total_children = Child.query.count() # Anonymized count
    total_orthos = User.query.filter_by(role='orthophoniste').count()

    # Calculate "New" Audios (Recordings NOT viewed by this researcher)
    from models.researcher_log import ResearcherLog
    
    # Subquery for viewed recording IDs (cast String target_id to Integer)
    viewed_ids = db.session.query(db.cast(ResearcherLog.target_id, db.Integer))\
        .filter_by(researcher_id=current_user_id, action_type='VIEW_AUDIO')
    
    # Count recordings whose ID is NOT in the viewed list
    new_audios = Recording.query.filter(~Recording.id.in_(viewed_ids)).count()

    # 1. Gender Distribution (Global)
    gender_stats = db.session.query(
        Child.sex, func.count(Child.id)
    ).group_by(Child.sex).all()
    gender_dist = {g: count for g, count in gender_stats if g}

    # 2. Class Distribution (Global)
    class_stats = db.session.query(
        Recording.classification, func.count(Recording.id)
    ).group_by(Recording.classification).all()
    class_dist = {f"Classe {c}": count for c, count in class_stats if c}

    # 3. Age Distribution (Buckets)
    # This is complex in SQL, doing simple python processing for prototype or raw SQL
    patients = Child.query.with_entities(Child.age).all()
    age_dist = {"<5": 0, "5-8": 0, "9-12": 0, "13+": 0}
    for p in patients:
        if p.age is None: continue
        if p.age < 5: age_dist["<5"] += 1
        elif 5 <= p.age <= 8: age_dist["5-8"] += 1
        elif 9 <= p.age <= 12: age_dist["9-12"] += 1
        else: age_dist["13+"] += 1

    # 4. Ortho Activity (Anonymized)
    # Map real IDs to "Ortho 1", "Ortho 2" based on sorted IDs to be deterministic but opaque
    ortho_activity_query = db.session.query(
        Recording.created_by_id, func.count(Recording.id)
    ).group_by(Recording.created_by_id).all()
    
    # Sort by ID to ensure "Ortho 1" is always the same Ortho (consistency)
    ortho_activity_query.sort(key=lambda x: x[0] if x[0] else 0)
    
    ortho_activity = {}
    for idx, (oid, count) in enumerate(ortho_activity_query):
        if oid:
            ortho_activity[f"Ortho {idx + 1}"] = count

    total_tutors = User.query.filter_by(role='tutor').count()

    return jsonify({
        "total_audios": total_audios,
        "new_audios": new_audios,
        "total_patients": total_children,
        "total_orthos": total_orthos,
        "total_tutors": total_tutors,
        "gender_distribution": gender_dist,
        "class_distribution": class_dist,
        "age_distribution": age_dist,
        "ortho_activity": ortho_activity
    }), 200

@stats_bp.route('/ortho', methods=['GET'])
@jwt_required()
def get_ortho_stats():
    current_user_id = get_jwt()['sub']
    
    # 1. My Patients
    my_children_count = Child.query.filter_by(created_by_id=current_user_id).count()
    
    # 2. My Sessions (Using Session model)
    from models.session import Session
    my_sessions_count = Session.query.filter_by(created_by_id=current_user_id).count()
    
    # 3. My Recordings
    my_recordings_count = Recording.query.filter_by(created_by_id=current_user_id).count()
    
    # 4. Gender Split (My Patients)
    gender_stats = db.session.query(
        Child.sex, func.count(Child.id)
    ).filter_by(created_by_id=current_user_id).group_by(Child.sex).all()
    
    gender_dist = {g: count for g, count in gender_stats if g}
    
    # 5. Class Distribution (My Recordings)
    class_stats = db.session.query(
        Recording.classification, func.count(Recording.id)
    ).filter_by(created_by_id=current_user_id).group_by(Recording.classification).all()
    
    class_dist = {f"Classe {c}": count for c, count in class_stats if c}
    
    return jsonify({
        "patients_count": my_children_count,
        "sessions_count": my_sessions_count,
        "recordings_count": my_recordings_count,
        "gender_distribution": gender_dist,
        "class_distribution": class_dist
    }), 200

@stats_bp.route('/public', methods=['GET'])
def get_public_stats():
    # Public endpoint without JWT
    total_recordings = Recording.query.count()
    
    # Global class distribution (Anonymous)
    class_stats = db.session.query(
        Recording.classification, func.count(Recording.id)
    ).group_by(Recording.classification).all()
    
    class_dist = {f"Classe {c}": count for c, count in class_stats if c}

    return jsonify({
        "total_recordings": total_recordings,
        "class_distribution": class_dist
    }), 200

@stats_bp.route('/temporal', methods=['GET'])
@jwt_required()
def get_temporal_stats():
    # Restricted to Supervisor (Encadrant) and Admin
    claims = get_jwt()
    if claims.get("role") not in ['admin', 'encadrant']:
        return jsonify({"msg": "Unauthorized"}), 403

    # Group by Month using Python for simplicity/compatibility
    recordings = db.session.query(Recording.created_at).all()
    
    from collections import defaultdict
    monthly_counts = defaultdict(int)
    
    for r in recordings:
        if r.created_at:
            month_key = r.created_at.strftime("%Y-%m")
            monthly_counts[month_key] += 1
        
    # Sort by date
    sorted_stats = [{"month": k, "count": v} for k, v in sorted(monthly_counts.items())]
    
    # Cumulative Sum for "Evolution"
    cumulative = []
    total = 0
    for item in sorted_stats:
        total += item['count']
        cumulative.append({
            "month": item['month'],
            "count": item['count'],
            "total": total
        })

    return jsonify(cumulative), 200

@stats_bp.route('/sample', methods=['GET'])
@jwt_required()
def get_sample_recordings():
    # Restricted to Supervisor
    claims = get_jwt()
    if claims.get("role") not in ['admin', 'encadrant']:
        return jsonify({"msg": "Unauthorized"}), 403
        
    # Get 5 random recordings
    # Using func.random() for Postgres
    recordings = Recording.query.order_by(func.random()).limit(5).all()
    
    results = []
    for r in recordings:
        results.append({
            "id": r.id,
            "classification": r.classification,
            "duration": r.duration,
            "created_at": r.created_at.isoformat()
        })
        
    return jsonify(results), 200

@stats_bp.route('/listen/<int:recording_id>', methods=['GET'])
@jwt_required()
def listen_sample(recording_id):
    claims = get_jwt()
    if claims.get("role") not in ['admin', 'encadrant']:
        return jsonify({"msg": "Unauthorized"}), 403

    import os
    from flask import send_file, current_app
    
    recording = Recording.query.get_or_404(recording_id)
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], recording.filename)
    
    if not os.path.exists(file_path):
        return jsonify({"msg": "File not found"}), 404

    return send_file(file_path, mimetype='audio/wav')
