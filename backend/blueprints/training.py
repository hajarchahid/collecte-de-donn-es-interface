from flask import Blueprint, request, jsonify
from extensions import db
from models.training import TrainingExercise
from flask_jwt_extended import jwt_required

training_bp = Blueprint('training', __name__)

@training_bp.route('/', methods=['GET'])
@jwt_required()
def get_exercises():
    level = request.args.get('level') # classe_1, classe_2, classe_3
    
    query = TrainingExercise.query
    if level:
        query = query.filter_by(level=level)
        
    exercises = query.all()
    return jsonify([e.to_dict() for e in exercises]), 200

@training_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_exercise_details(id):
    exercise = TrainingExercise.query.get_or_404(id)
    return jsonify(exercise.to_dict()), 200
