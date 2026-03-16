from app import create_app
from flask_jwt_extended import create_access_token

app = create_app()

with app.test_client() as client:
    with app.app_context():
        # 1. Create access token for admin
        # We know admin exists (verified before)
        # We need a user object or identity.
        from models.user import User
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            print("ERROR: No admin found")
            exit(1)
            
        token = create_access_token(identity=str(admin.id), additional_claims={"role": "admin"})
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        # 2. Make request
        print("--- SIMULATING GET /users/?role=orthophoniste ---")
        res = client.get('/users/?role=orthophoniste&per_page=100', headers=headers)
        
        print(f"Status Code: {res.status_code}")
        print(f"Response Data: {res.json}")
        
        if res.status_code == 200:
            users = res.json.get('users', [])
            print(f"Users found in response: {len(users)}")
            for u in users:
                print(f" - {u['username']} ({u['role']})")
        else:
             print("Request failed")
        print("-----------------------------------------------")
