from flask import Blueprint, request, jsonify, url_for
from extensions import db
from models.user import User
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity, decode_token
from email_validator import validate_email, EmailNotValidError
from utils.email_sender import send_email
from utils.email_translator import get_email_content
from utils.message_translator import get_message
import re
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)

def validate_password_strength(password):
    """
    Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.
    """
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[\W_]", password): # \W matches any non-alphanumeric character
        return False
    return True

@auth_bp.route('/register', methods=['POST'])
def register():
    return jsonify({"msg": "L'inscription publique est désactivée. Contactez l'administrateur."}), 403
    # data = request.get_json()
    # ... (Rest of code commented out or removed) ...


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('email', '').strip()  # Can be email or username
    password = data.get('password', '')

    # Try to find user by email first, then username
    # Try to find user by email, username, or phone number
    user = User.query.filter(
        (User.email == identifier) | 
        (User.username == identifier) | 
        (User.phone_number == identifier)
    ).first()
    if not user or not user.check_password(password):
        # Default to FR or try to guess? For security, generic message.
        return jsonify({"msg": get_message('invalid_credentials', 'fr')}), 401

    if not user.is_active:
        return jsonify({"msg": get_message('account_inactive', user.language)}), 403

    access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify(access_token=access_token, refresh_token=refresh_token, role=user.role), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"msg": get_message('user_not_found', 'fr')}), 404
    return jsonify(user.to_dict()), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    identifier = data.get('email', '').strip() # Frontend sends identifier in 'email' field for now, or we change frontend

    if not identifier:
        return jsonify({"msg": "Email ou téléphone requis"}), 400

    print(f"DEBUG: Forgot password request for {identifier}")

    # Find user by Email OR Phone
    user = User.query.filter((User.email == identifier) | (User.phone_number == identifier)).first()
    
    # Generic success message
    success_msg = "Si ce compte existe, un lien de réinitialisation a été envoyé."

    if user:
        reset_token = create_access_token(identity=str(user.id), additional_claims={"type": "reset"}, expires_delta=timedelta(minutes=15))
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
        
        print(f"DEBUG: Generated Reset Link: {reset_link}", flush=True)

        # V3 Priority: Email > SMS
        if user.email:
            # Send via Email
            subject, html_content = get_email_content(
                'reset_password', 
                lang=user.language, 
                link=reset_link
            )
            try:
                send_email(user.email, subject, html_content)
            except Exception as e:
                print(f"DEBUG: Email failed: {e}")
        
        elif user.phone_number:
            # Send via SMS
            from services.sms_service import sms_service
            sms_message = f"Reinitialisation mot de passe OrthoData. Cliquez ici: {reset_link}"
            try:
                sms_service.send_sms(user.phone_number, sms_message)
            except Exception as e:
                print(f"DEBUG: SMS failed: {e}")

    return jsonify({"msg": success_msg}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({"msg": "Token et nouveau mot de passe requis."}), 400

    try:
        # Decode and verify token
        decoded_token = decode_token(token)
        if decoded_token.get("type") != "reset":
            return jsonify({"msg": "Token invalide."}), 400
        
        user_id = decoded_token["sub"]
        user = User.query.get(user_id)
        
        if not user:
             return jsonify({"msg": "Utilisateur introuvable."}), 404

        if not validate_password_strength(new_password):
             return jsonify({"msg": "Mot de passe trop simple."}), 400

        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({"msg": "Mot de passe mis à jour avec succès."}), 200

    except Exception as e:
        print(f"DEBUG: Reset Password Error: {e}", flush=True)
        return jsonify({"msg": "Token invalide ou expiré.", "error": str(e)}), 400

@auth_bp.route('/activate-account', methods=['POST'])
def activate_account():
    data = request.get_json()
    token = data.get('token')
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    if not token or not new_password or not old_password:
        return jsonify({"msg": "Token, ancien mot de passe et nouveau mot de passe requis."}), 400

    try:
        # Decode and verify token
        decoded_token = decode_token(token)
        if decoded_token.get("type") != "activation":
            return jsonify({"msg": "Token invalide (pas un token d'activation)."}), 400
        
        user_id = decoded_token["sub"]
        user = User.query.get(user_id)
        
        if not user:
             return jsonify({"msg": "Utilisateur introuvable."}), 404

        # Verify Old Password (Temporary Password)
        if not user.check_password(old_password):
            return jsonify({"msg": "Le mot de passe actuel est incorrect."}), 400

        # Validate New Password Strength
        if not validate_password_strength(new_password):
             return jsonify({"msg": "Le nouveau mot de passe est trop simple (8+ car, maj, min, chiffre, spécial)."}), 400

        # Ensure new password is NOT the same as old one (Optional security practice, but good)
        if old_password == new_password:
             return jsonify({"msg": "Le nouveau mot de passe doit être différent de l'actuel."}), 400

        user.set_password(new_password)
        user.is_active = True
        db.session.commit()
        
        return jsonify({"msg": "Compte activé avec succès. Vous pouvez maintenant vous connecter."}), 200

    except Exception as e:
        print(f"DEBUG: Activation Error: {e}", flush=True)
        return jsonify({"msg": "Lien d'activation invalide ou expiré.", "error": str(e)}), 400
