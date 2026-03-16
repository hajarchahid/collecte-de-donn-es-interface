from extensions import db
from datetime import datetime

class ResearcherLog(db.Model):
    __tablename__ = 'researcher_logs'

    id = db.Column(db.Integer, primary_key=True)
    researcher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)  # 'VIEW_AUDIO', 'EXPORT_DATASET'
    target_id = db.Column(db.String(100), nullable=True)    # e.g., recording_id or 'ALL'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'researcher_id': self.researcher_id,
            'action_type': self.action_type,
            'target_id': self.target_id,
            'timestamp': self.timestamp.isoformat()
        }
