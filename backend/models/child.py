from extensions import db

class Child(db.Model):
    __tablename__ = 'children'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False) # Ex: PAT-2024-001 (Keep prefix or change to CHD?) -> Let's keep PAT for continuity or change to ENF? User said "Enfant". Let's stick to PAT to minimally disrupt existing codes logic or change to ENF? The user hasn't specified code format change. I'll genericize or keep PAT. Let's keep PAT for now.
    name = db.Column(db.String(100), nullable=True) # Legacy/Full Name
    first_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    
    age = db.Column(db.Integer, nullable=True) # Stored age
    sex = db.Column(db.String(10), nullable=True) # M/F
    pathology = db.Column(db.String(255), nullable=True)
    progression_level = db.Column(db.String(50), nullable=True)
    comments = db.Column(db.Text, nullable=True)
    
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tutor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Parent/Tutor
    ortho_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True) # Assigned Orthophonist
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    
    # Evaluation / Classification
    has_initial_test = db.Column(db.Boolean, default=False, nullable=False)
    evaluation_level = db.Column(db.String(50), nullable=True) # Classe 1, Classe 2, Classe 3
    course_level = db.Column(db.String(50), nullable=True) # Classe 1, Classe 2, Classe 3
    evaluation_score = db.Column(db.Float, nullable=True) 

    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Auth
    password_hash = db.Column(db.String(255), nullable=True)

    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by_id], backref=db.backref('children_created', lazy=True, cascade="all, delete-orphan"))
    tutor = db.relationship('User', foreign_keys=[tutor_id], backref=db.backref('children_tutored', lazy=True))
    ortho = db.relationship('User', foreign_keys=[ortho_id], backref=db.backref('children_assigned', lazy=True))

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

    def calculate_age(self):
        if self.birth_date:
            from datetime import date
            today = date.today()
            return today.year - self.birth_date.year - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        return self.age

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name or f"{self.first_name or ''} {self.last_name or ''}".strip(),
            'first_name': self.first_name,
            'last_name': self.last_name,
            'birth_date': self.birth_date.isoformat() if self.birth_date else None,
            'age': self.calculate_age(),
            'sex': self.sex,
            'pathology': self.pathology,
            'progression_level': self.progression_level,
            'comments': self.comments,
            'created_at': self.created_at.isoformat() + 'Z',
            'created_by': self.creator.username,
            'ortho_id': self.ortho_id,
            'ortho_name': f"{self.ortho.first_name} {self.ortho.last_name}" if self.ortho else None,
            'tutor_id': self.tutor_id,
            'tutor_name': f"{self.tutor.first_name} {self.tutor.last_name}" if self.tutor else None,
            'tutor_first_name': self.tutor.first_name if self.tutor else None,
            'tutor_last_name': self.tutor.last_name if self.tutor else None,
            'tutor_email': self.tutor.email if self.tutor else None,
            'tutor_phone': self.tutor.phone_number if self.tutor else None,
            'has_initial_test': self.has_initial_test,
            'evaluation_level': self.evaluation_level,
            'evaluation_score': self.evaluation_score,
            'is_active': self.is_active
        }
