from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .db import SessionLocal
from .models import User, Category, Event, Todo
from datetime import date
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="AppointAI API",
    description="FastAPI backend for AppointAI appointment scheduling system",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Schemas
class EventSchema(BaseModel):
    id: int
    user_id: Optional[int]
    category_id: Optional[int]
    title: str
    date: str
    startTime: str
    endTime: str
    duration: Optional[str]
    createdAt: Optional[str]
    class Config:
        orm_mode = True

class TodoSchema(BaseModel):
    id: int
    user_id: Optional[int]
    category_id: Optional[int]
    title: str
    description: Optional[str]
    priority: Optional[str]
    estimated_duration: Optional[str]
    due_date: Optional[str]
    completed: bool
    created_at: Optional[str]
    class Config:
        orm_mode = True

class CategorySchema(BaseModel):
    id: int
    name: str
    color: Optional[str]
    description: Optional[str]
    created_at: Optional[str]
    usage_count: int
    class Config:
        orm_mode = True

class UserSchema(BaseModel):
    id: int
    name: str
    email: str
    avatar: Optional[str]
    join_date: Optional[str]
    timezone: Optional[str]
    date_format: Optional[str]
    time_format: Optional[str]
    theme: Optional[str]
    notifications: Optional[dict]
    privacy: Optional[dict]
    class Config:
        orm_mode = True

@app.get("/")
async def root():
    return {"message": "Welcome to AppointAI API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "appointai-backend"}

@app.get("/api/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}!", "service": "appointai"}

# --- EVENTS ---
@app.get("/api/events", response_model=List[EventSchema])
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    return [
        EventSchema(
            id=e.id,
            user_id=e.user_id,
            category_id=e.category_id,
            title=e.title,
            date=e.date.isoformat() if e.date else None,
            startTime=e.start_time.strftime("%H:%M") if e.start_time else None,
            endTime=e.end_time.strftime("%H:%M") if e.end_time else None,
            duration=e.duration,
            createdAt=e.created_at.isoformat() if e.created_at else None,
        ) for e in events
    ]

# --- TODOS ---
@app.get("/api/todos", response_model=List[TodoSchema])
def get_todos(db: Session = Depends(get_db)):
    todos = db.query(Todo).all()
    return [
        TodoSchema(
            id=t.id,
            user_id=t.user_id,
            category_id=t.category_id,
            title=t.title,
            description=t.description,
            priority=t.priority,
            estimated_duration=t.estimated_duration,
            due_date=t.due_date.isoformat() if t.due_date else None,
            completed=t.completed,
            created_at=t.created_at.isoformat() if t.created_at else None,
        ) for t in todos
    ]

# --- CATEGORIES ---
@app.get("/api/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return [
        CategorySchema(
            id=c.id,
            name=c.name,
            color=c.color,
            description=c.description,
            created_at=c.created_at.isoformat() if c.created_at else None,
            usage_count=c.usage_count,
        ) for c in categories
    ]

# --- USER PROFILE (first user for demo) ---
@app.get("/api/profile", response_model=UserSchema)
def get_profile(db: Session = Depends(get_db)):
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserSchema(
        id=user.id,
        name=user.name,
        email=user.email,
        avatar=user.avatar,
        join_date=user.join_date.isoformat() if user.join_date else None,
        timezone=user.timezone,
        date_format=user.date_format,
        time_format=user.time_format,
        theme=user.theme,
        notifications=user.notifications,
        privacy=user.privacy,
    )
