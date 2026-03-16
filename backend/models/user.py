from extensions import db
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=True) # Added for Ortho Profile
    last_name = db.Column(db.String(100), nullable=True) # Added for Ortho Profile
    profile_photo = db.Column(db.String(255), nullable=True) # URL/Path to photo
    phone_number = db.Column(db.String(20), nullable=True) # Mobile/Landline
    role = db.Column(db.String(20), nullable=False, default='pending') # 'admin', 'orthophoniste', 'pending'
    is_active = db.Column(db.Boolean, default=False, nullable=False)
    language = db.Column(db.String(5), default='fr', nullable=False) # 'fr', 'en', 'ar'
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def set_password(self, password):
        self.password_hash = ph.hash(password)

    def check_password(self, password):
        try:
            return ph.verify(self.password_hash, password)
        except VerifyMismatchError:
            return False

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone_number': self.phone_number,
            'profile_photo': self.profile_photo,
            'role': self.role,
            'language': self.language,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None
        }
