from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("--- MIGRATION: Making email nullable ---")
    try:
        # Check current state first (optional but good for info)
        res = db.session.execute(text("SELECT is_nullable FROM information_schema.columns WHERE table_name='users' AND column_name='email'")).fetchone()
        print(f"Current nullable state: {res[0] if res else 'Unknown'}")

        # Alter table
        db.session.execute(text("ALTER TABLE users ALTER COLUMN email DROP NOT NULL"))
        db.session.commit()
        
        # Verify
        res_after = db.session.execute(text("SELECT is_nullable FROM information_schema.columns WHERE table_name='users' AND column_name='email'")).fetchone()
        print(f"New nullable state: {res_after[0] if res_after else 'Unknown'}")
        
        print("--- MIGRATION SUCCESS ---")
    except Exception as e:
        print(f"--- MIGRATION FAILED: {e} ---")
        db.session.rollback()
