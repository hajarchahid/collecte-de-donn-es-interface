from extensions import db

class Session(db.Model):
    __tablename__ = 'sessions'

    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    notes = db.Column(db.Text, nullable=True)

    # Relationships
    child = db.relationship('Child', backref=db.backref('sessions', lazy=True, cascade="all, delete-orphan"))
    creator = db.relationship('User', backref=db.backref('sessions', lazy=True, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'child_id': self.child_id,
            'created_at': self.created_at.isoformat() + 'Z',
            'notes': self.notes
        }
