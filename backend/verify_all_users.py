from app import create_app
from models.user import User

app = create_app()
with app.app_context():
    print("--- ALL USERS CHECK ---")
    users = User.query.all()
    print(f"Total found: {len(users)}")
    for u in users:
        print(f"Role: {u.role} | Email: {u.email}")
    print("-------------------------")
