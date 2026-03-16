from extensions import db
import uuid
# from models.session import Session # Avoid circular import

class Recording(db.Model):
    __tablename__ = 'recordings'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), unique=True, nullable=False) # UUID.wav
    original_name = db.Column(db.String(255), nullable=True)
    duration = db.Column(db.Float, nullable=True) # In seconds
    classification = db.Column(db.String(50), nullable=True) # Class 1, 2, 3
    
    child_id = db.Column(db.Integer, db.ForeignKey('children.id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('sessions.id'), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    # Relationships
    child = db.relationship('Child', backref=db.backref('recordings', lazy=True, cascade="all, delete-orphan"))
    session = db.relationship('Session', backref=db.backref('recordings', lazy=True))
    creator = db.relationship('User', backref=db.backref('recordings', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'filename': self.filename,
            'original_name': self.original_name,
            'duration': self.duration,
            'classification': self.classification,
            'child_code': self.child.code,
            'created_at': self.created_at.isoformat() + 'Z',
            'creator_role': self.creator.role
        }
