from flask import Blueprint, jsonify, request
from extensions import db
from models.bilan import Bilan
from models.child import Child
from datetime import datetime
from flask_jwt_extended import jwt_required

bilan_bp = Blueprint('bilan', __name__)

@bilan_bp.route('/children/<int:child_id>/bilan', methods=['GET'])
@jwt_required()
def get_child_bilan(child_id):
    bilan = Bilan.query.filter_by(child_id=child_id).first()
    if not bilan:
        return jsonify(None), 200 # Return null if no bilan exists
    return jsonify(bilan.to_dict()), 200

@bilan_bp.route('/children/<int:child_id>/bilan', methods=['POST', 'PUT'])
@jwt_required()
def upsert_child_bilan(child_id):
    data = request.json
    import sys
    print(f"DEBUG: Received data for child {child_id}: {data}", file=sys.stderr)

    bilan = Bilan.query.filter_by(child_id=child_id).first()

    if not bilan:
        bilan = Bilan(child_id=child_id)
        db.session.add(bilan)

    # Helper to parse date
    def parse_date(d):
        if not d: return None
        try:
            return datetime.strptime(d.split('T')[0], '%Y-%m-%d').date()
        except:
            return None

    # Update fields
    if 'exam_date' in data: bilan.exam_date = parse_date(data['exam_date'])
    if 'orthophonist_name' in data: bilan.orthophonist_name = data['orthophonist_name']
    
    if 'patient_last_name' in data: bilan.patient_last_name = data['patient_last_name']
    if 'patient_first_name' in data: bilan.patient_first_name = data['patient_first_name']
    if 'patient_birth_date' in data: bilan.patient_birth_date = parse_date(data['patient_birth_date'])
    if 'patient_address' in data: bilan.patient_address = data['patient_address']
    
    if 'deficiency_congenital' in data: bilan.deficiency_congenital = data['deficiency_congenital']
    if 'deficiency_age_appearance' in data: bilan.deficiency_age_appearance = data['deficiency_age_appearance']
    if 'age_diagnosis' in data: bilan.age_diagnosis = data['age_diagnosis']
    if 'age_first_fitting' in data: bilan.age_first_fitting = data['age_first_fitting']
    
    if 'schooling_type' in data: bilan.schooling_type = data['schooling_type']
    if 'schooling_specialized_detail' in data: bilan.schooling_specialized_detail = data['schooling_specialized_detail']
    
    if 'deafness_degree_od' in data: bilan.deafness_degree_od = data['deafness_degree_od']
    if 'deafness_degree_og' in data: bilan.deafness_degree_og = data['deafness_degree_og']
    if 'deafness_evolutionary' in data: bilan.deafness_evolutionary = data['deafness_evolutionary']
    
    if 'equipment_od' in data: bilan.equipment_od = data['equipment_od']
    if 'equipment_og' in data: bilan.equipment_og = data['equipment_og']
    if 'equipment_ci' in data: bilan.equipment_ci = data['equipment_ci']
    
    if 'date_equipment_current' in data: bilan.date_equipment_current = parse_date(data['date_equipment_current'])
    if 'date_implantation' in data: bilan.date_implantation = parse_date(data['date_implantation'])
    
    if 'communication_modes' in data: bilan.communication_modes = data['communication_modes']
    if 'multimodal_detail' in data: bilan.multimodal_detail = data['multimodal_detail']
    
    if 'human_aid_necessity' in data: bilan.human_aid_necessity = data['human_aid_necessity']
    if 'human_aid_detail' in data: bilan.human_aid_detail = data['human_aid_detail']
    
    if 'phone_communication_unaided' in data: bilan.phone_communication_unaided = data['phone_communication_unaided']

    print(f"DEBUG: Bilan before commit: exam_date={bilan.exam_date}, birth={bilan.patient_birth_date}, equip={bilan.date_equipment_current}, implant={bilan.date_implantation}", flush=True)
    try:
        db.session.commit()
    except Exception as e:
        print(f"DEBUG: Commit failed: {e}", flush=True)
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    return jsonify(bilan.to_dict()), 200
