from sqlalchemy.orm import Session
from app.db.session import engine, Base
from app.models.all_models import User, Category, Event, Todo

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
