from app import create_app
from models.user import User

app = create_app()
with app.app_context():
    print("--- ORTHOPHONIST CHECK ---")
    orthos = User.query.filter_by(role="orthophoniste").all()
    print(f"Total found: {len(orthos)}")
    for u in orthos:
        print(f"User: {u.username} | Email: {u.email} | Active: {u.is_active}")
    print("-------------------------")
