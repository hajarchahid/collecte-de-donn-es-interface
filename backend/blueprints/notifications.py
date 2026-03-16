from flask import Blueprint, jsonify, request
from extensions import db
from models.notification import Notification
from flask_jwt_extended import jwt_required, get_jwt_identity

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(str(current_user_id))
    except:
        return jsonify({"msg": "Invalid user"}), 401

    # Fetch unread first, then read, limit 50
    notifications = Notification.query.filter_by(user_id=current_user_id)\
        .order_by(Notification.is_read.asc(), Notification.created_at.desc())\
        .limit(50).all()
        
    return jsonify([n.to_dict() for n in notifications]), 200

@notifications_bp.route('/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_read(id):
    current_user_id = get_jwt_identity()
    notification = Notification.query.get_or_404(id)
    
    if notification.user_id != int(str(current_user_id)):
        return jsonify({"msg": "Unauthorized"}), 403
        
    notification.is_read = True
    db.session.commit()
    return jsonify(notification.to_dict()), 200

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    current_user_id = get_jwt_identity()
    try:
        current_user_id = int(str(current_user_id))
    except:
        return jsonify({"msg": "Invalid user"}), 401
        
    Notification.query.filter_by(user_id=current_user_id, is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return jsonify({"msg": "All marked as read"}), 200
