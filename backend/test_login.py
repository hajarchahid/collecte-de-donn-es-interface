from app import create_app
import json

app = create_app()
client = app.test_client()

print("--- TESTING LOGIN VIA FLASK CLIENT ---")
response = client.post('/auth/login', 
                       json={"email": "admin@orthodata.com", "password": "AdminPassword123!"},
                       content_type='application/json')

print(f"Status: {response.status_code}")
print(f"Data: {response.get_json()}")
print("--------------------------------------")
