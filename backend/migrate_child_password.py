
import sqlite3
import os

# Adjust path to your database
DB_PATH = r'c:\Users\pc\Desktop\collecte de données interface\backend\instance\speech_app.db'

# If using PostgreSQL or another DB, this script needs adaptation. 
# Looking at the file structure, there is an instance folder which suggests SQLite default in Flask.
# But previous context mentioned Postgres migration plan? 
# The user's active document is using `User.query` etc which implies SQLAlchemy.
# I will try to detect if it's SQLite or Postgres from previous conversations or just assume SQLite for this specific 'instance/speech_app.db' pattern usually.
# However, if I can't be sure, I can use a script that uses the app context.

from app import create_app
from extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Check if column exists
        with db.engine.connect() as conn:
            # This works for both SQLite and Postgres usually for raw SQL
            # But syntax for adding column differs slightly or is same (ADD COLUMN)
            
            # Check if column exists (generic way difficult without inspection)
            # Let's just try to add it and catch error
            try:
                conn.execute(text("ALTER TABLE children ADD COLUMN password_hash VARCHAR(255)"))
                conn.commit()
                print("Column password_hash added successfully.")
            except Exception as e:
                print(f"Column might already exist or error: {e}")
                
    except Exception as e:
        print(f"General Error: {e}")
