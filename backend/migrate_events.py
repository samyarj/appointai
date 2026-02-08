
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from models import Event

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/appointai")

def migrate_events_table():
    """Migrate the database to add recurrence support to events"""
    engine = create_engine(DATABASE_URL)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if we need to add new columns to events table
        inspector = engine.dialect.inspector(engine)
        existing_columns = [col['name'] for col in inspector.get_columns('events')]
        
        # Add is_recurring column
        if 'is_recurring' not in existing_columns:
            print("Adding is_recurring column...")
            db.execute(text("ALTER TABLE events ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE"))
        
        # Add recurrence_rule column
        if 'recurrence_rule' not in existing_columns:
            print("Adding recurrence_rule column...")
            db.execute(text("ALTER TABLE events ADD COLUMN recurrence_rule VARCHAR(255)"))
        
        db.commit()
        print("Events table migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_events_table()
