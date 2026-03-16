from extensions import db

class Bilan(db.Model):
    __tablename__ = 'bilans'

    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('children.id'), unique=True, nullable=False)
    
    # Header
    exam_date = db.Column(db.Date, nullable=True)
    orthophonist_name = db.Column(db.String(100), nullable=True)

    # Patient Info (Snapshot/Editable)
    patient_last_name = db.Column(db.String(100), nullable=True)
    patient_first_name = db.Column(db.String(100), nullable=True)
    patient_birth_date = db.Column(db.Date, nullable=True)
    patient_address = db.Column(db.String(255), nullable=True)

    # 1. Description de la deficience auditive
    deficiency_congenital = db.Column(db.Boolean, nullable=True) # True=Congenitale, False=Non
    deficiency_age_appearance = db.Column(db.String(50), nullable=True) # Si non, a quel age
    age_diagnosis = db.Column(db.String(50), nullable=True)
    age_first_fitting = db.Column(db.String(50), nullable=True)

    # a. Modalites de scolarisation
    schooling_type = db.Column(db.String(50), nullable=True) # 'ordinary', 'specialized'
    schooling_specialized_detail = db.Column(db.String(255), nullable=True)

    # b. Degre de surdite (OD/OG)
    # Enum: 'normal', 'leger', 'moyen', 'severe', 'profond'
    deafness_degree_od = db.Column(db.String(20), nullable=True)
    deafness_degree_og = db.Column(db.String(20), nullable=True)
    deafness_evolutionary = db.Column(db.Boolean, nullable=True) # Contexte evolutif

    # c. Appareillage auditif
    equipment_od = db.Column(db.Boolean, default=False)
    equipment_og = db.Column(db.Boolean, default=False)
    equipment_ci = db.Column(db.Boolean, default=False) # Implant cochleaire
    date_equipment_current = db.Column(db.Date, nullable=True)
    date_implantation = db.Column(db.Date, nullable=True)

    # 2. Modes de communication
    # Stored as JSON array: ['oral', 'lpc', 'lsf', 'francais_signe', 'ecrit', 'multimodal']
    communication_modes = db.Column(db.JSON, nullable=True) 
    multimodal_detail = db.Column(db.String(255), nullable=True)

    # Aide humaine
    human_aid_necessity = db.Column(db.Boolean, nullable=True) # Avec appareillage
    human_aid_detail = db.Column(db.String(255), nullable=True)

    # Communication tel
    phone_communication_aided = db.Column(db.Boolean, nullable=False, default=False) # Not explicitly in form but logic implies it might exist? 
    # Actually form says: "Communication orale à l'aide d'un appareil téléphonique sans appareillage : Oui/Non"
    phone_communication_unaided = db.Column(db.Boolean, nullable=True) 

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    child = db.relationship('Child', backref=db.backref('bilan', uselist=False, cascade="all, delete-orphan"))

    def to_dict(self):
        return {
            'id': self.id,
            'child_id': self.child_id,
            'exam_date': self.exam_date.isoformat() if self.exam_date else None,
            'orthophonist_name': self.orthophonist_name,
            'patient_last_name': self.patient_last_name,
            'patient_first_name': self.patient_first_name,
            'patient_birth_date': self.patient_birth_date.isoformat() if self.patient_birth_date else None,
            'patient_address': self.patient_address,
            'deficiency_congenital': self.deficiency_congenital,
            'deficiency_age_appearance': self.deficiency_age_appearance,
            'age_diagnosis': self.age_diagnosis,
            'age_first_fitting': self.age_first_fitting,
            'schooling_type': self.schooling_type,
            'schooling_specialized_detail': self.schooling_specialized_detail,
            'deafness_degree_od': self.deafness_degree_od,
            'deafness_degree_og': self.deafness_degree_og,
            'deafness_evolutionary': self.deafness_evolutionary,
            'equipment_od': self.equipment_od,
            'equipment_og': self.equipment_og,
            'equipment_ci': self.equipment_ci,
            'date_equipment_current': self.date_equipment_current.isoformat() if self.date_equipment_current else None,
            'date_implantation': self.date_implantation.isoformat() if self.date_implantation else None,
            'communication_modes': self.communication_modes,
            'multimodal_detail': self.multimodal_detail,
            'human_aid_necessity': self.human_aid_necessity,
            'human_aid_detail': self.human_aid_detail,
            'phone_communication_unaided': self.phone_communication_unaided
        }
