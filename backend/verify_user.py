from app import create_app
from models.user import User

app = create_app()
with app.app_context():
    print("--- USER VERIFICATION ---")
    u = User.query.filter_by(email="admin@orthodata.com").first()
    if u:
        print(f"User: {u.email}")
        print(f"Role: {u.role}")
        print(f"Active: {u.is_active}")
        
        try:
            valid = u.check_password("AdminPassword123!")
            print(f"Password 'AdminPassword123!' valid? {valid}")
        except Exception as e:
            print(f"Password check error: {e}")
            
    else:
        print("User 'admin@orthodata.com' NOT FOUND")
    print("-------------------------")
