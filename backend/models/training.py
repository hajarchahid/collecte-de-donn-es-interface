from extensions import db

class TrainingExercise(db.Model):
    __tablename__ = 'training_exercises'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    level = db.Column(db.String(50), nullable=False) # 'classe_1', 'classe_2', 'classe_3'
    model_audio_path = db.Column(db.String(255), nullable=True) # Path to example audio
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'level': self.level,
            'model_audio_path': self.model_audio_path
        }
