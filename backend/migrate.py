from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, User, Category, Event, Todo
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/appointai")

def migrate_database():
    """Migrate the database to add JWT authentication support"""
    engine = create_engine(DATABASE_URL)
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Check if we need to add new columns to existing users table
        inspector = engine.dialect.inspector(engine)
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Add missing columns to users table
        if 'password_hash' not in existing_columns:
            db.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
        
        if 'is_active' not in existing_columns:
            db.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
        
        if 'is_verified' not in existing_columns:
            db.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
        
        if 'created_at' not in existing_columns:
            db.execute(text("ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        
        if 'updated_at' not in existing_columns:
            db.execute(text("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
        
        # Set default values for existing users
        db.execute(text("""
            UPDATE users 
            SET is_active = TRUE, 
                is_verified = TRUE,
                created_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE is_active IS NULL
        """))
        
        # Create default categories if they don't exist
        default_categories = [
            {"name": "Work", "color": "#3B82F6", "description": "Work-related events and tasks"},
            {"name": "Personal", "color": "#10B981", "description": "Personal events and tasks"},
            {"name": "Health", "color": "#EF4444", "description": "Health and fitness related"},
            {"name": "Education", "color": "#8B5CF6", "description": "Learning and educational activities"},
            {"name": "Social", "color": "#F59E0B", "description": "Social events and gatherings"}
        ]
        
        for cat_data in default_categories:
            existing_cat = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing_cat:
                category = Category(
                    name=cat_data["name"],
                    color=cat_data["color"],
                    description=cat_data["description"],
                    usage_count=0
                )
                db.add(category)
        
        db.commit()
        print("Database migration completed successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database() 