import sqlite3
import os

def check_columns():
    db_path = 'instance/app.db'
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check Children Columns
    cursor.execute("PRAGMA table_info(children)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Columns in children: {columns}")
    
    missing = []
    expected = ['tutor_id', 'has_initial_test', 'evaluation_level', 'ortho_id', 'is_active']
    for col in expected:
        if col not in columns:
            missing.append(col)
            
    print(f"Missing columns: {missing}")
    
    # Check if training_exercises exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='training_exercises';")
    table_exists = cursor.fetchone()
    
    if table_exists:
        print("Table 'training_exercises' exists. Dropping it to fix migration...")
        cursor.execute("DROP TABLE training_exercises")
        conn.commit()
        print("Table dropped.")
    else:
        print("Table 'training_exercises' does not exist.")

    conn.close()

if __name__ == "__main__":
    check_columns()
