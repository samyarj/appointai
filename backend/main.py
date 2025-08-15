from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from db import SessionLocal
from models import User, Category, Event, Todo
from auth import (
    get_current_active_user, 
    create_access_token, 
    authenticate_user,
    create_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import date, datetime, timedelta
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

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
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    user_name: str
    user_email: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

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
    is_verified: bool
    class Config:
        orm_mode = True

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

@app.get("/")
async def root():
    return {"message": "Welcome to AppointAI API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "appointai-backend"}

@app.get("/api/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}!", "service": "appointai"}

# --- AUTHENTICATION ENDPOINTS ---

@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        user = create_user(
            db=db,
            email=user_data.email,
            password=user_data.password,
            name=user_data.name
        )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id)}, expires_delta=access_token_expires
        )
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            user_name=user.name,
            user_email=user.email
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail="Registration failed")

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = authenticate_user(db, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        user_name=user.name,
        user_email=user.email
    )

@app.get("/api/auth/me", response_model=UserSchema)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserSchema(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=current_user.avatar,
        join_date=current_user.join_date.isoformat() if current_user.join_date else None,
        timezone=current_user.timezone,
        date_format=current_user.date_format,
        time_format=current_user.time_format,
        theme=current_user.theme,
        notifications=current_user.notifications,
        privacy=current_user.privacy,
        is_verified=current_user.is_verified,
    )

# --- EVENTS ---
@app.get("/api/events", response_model=List[EventSchema])
def get_events(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get events for the current user"""
    events = db.query(Event).filter(Event.user_id == current_user.id).all()
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

@app.post("/api/events", response_model=EventSchema)
def create_event(
    event_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new event for the current user"""
    event = Event(
        user_id=current_user.id,
        title=event_data["title"],
        date=datetime.strptime(event_data["date"], "%Y-%m-%d").date(),
        start_time=datetime.strptime(event_data["startTime"], "%H:%M").time(),
        end_time=datetime.strptime(event_data["endTime"], "%H:%M").time(),
        category_id=event_data.get("category_id"),
        duration=event_data.get("duration"),
        created_at=datetime.utcnow()
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    
    return EventSchema(
        id=event.id,
        user_id=event.user_id,
        category_id=event.category_id,
        title=event.title,
        date=event.date.isoformat(),
        startTime=event.start_time.strftime("%H:%M"),
        endTime=event.end_time.strftime("%H:%M"),
        duration=event.duration,
        createdAt=event.created_at.isoformat(),
    )

# --- TODOS ---
@app.get("/api/todos", response_model=List[TodoSchema])
def get_todos(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get todos for the current user"""
    todos = db.query(Todo).filter(Todo.user_id == current_user.id).all()
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

@app.post("/api/todos", response_model=TodoSchema)
def create_todo(
    todo_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new todo for the current user"""
    todo = Todo(
        user_id=current_user.id,
        title=todo_data["title"],
        description=todo_data.get("description"),
        priority=todo_data.get("priority"),
        estimated_duration=todo_data.get("estimated_duration"),
        due_date=datetime.strptime(todo_data["due_date"], "%Y-%m-%d").date() if todo_data.get("due_date") else None,
        category_id=todo_data.get("category_id"),
        completed=False,
        created_at=datetime.utcnow()
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    
    return TodoSchema(
        id=todo.id,
        user_id=todo.user_id,
        category_id=todo.category_id,
        title=todo.title,
        description=todo.description,
        priority=todo.priority,
        estimated_duration=todo.estimated_duration,
        due_date=todo.due_date.isoformat() if todo.due_date else None,
        completed=todo.completed,
        created_at=todo.created_at.isoformat(),
    )

# --- CATEGORIES ---
@app.get("/api/categories", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories (shared across users)"""
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

@app.post("/api/categories", response_model=CategorySchema)
def create_category(
    category_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    category = Category(
        name=category_data["name"],
        color=category_data.get("color"),
        description=category_data.get("description"),
        created_at=datetime.utcnow(),
        usage_count=0
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return CategorySchema(
        id=category.id,
        name=category.name,
        color=category.color,
        description=category.description,
        created_at=category.created_at.isoformat(),
        usage_count=category.usage_count,
    )

# --- USER PROFILE ---
@app.get("/api/profile", response_model=UserSchema)
def get_profile(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return UserSchema(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        avatar=current_user.avatar,
        join_date=current_user.join_date.isoformat() if current_user.join_date else None,
        timezone=current_user.timezone,
        date_format=current_user.date_format,
        time_format=current_user.time_format,
        theme=current_user.theme,
        notifications=current_user.notifications,
        privacy=current_user.privacy,
        is_verified=current_user.is_verified,
    )

class ProfileUpdateSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    timezone: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
    theme: Optional[str] = None
    notifications: Optional[dict] = None
    privacy: Optional[dict] = None

@app.put("/api/profile", response_model=UserSchema)
def update_profile(
    profile_data: ProfileUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # Get the user from the current database session
        user = db.query(User).filter(User.id == current_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Convert Pydantic model to dict and filter out None values
        update_data = profile_data.dict(exclude_unset=True)
        
        if not update_data:
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
                is_verified=user.is_verified,
            )
        
        # Validate email uniqueness if email is being updated
        if "email" in update_data and update_data["email"] != user.email:
            existing_user = db.query(User).filter(User.email == update_data["email"]).first()
            if existing_user and existing_user.id != user.id:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        # Update only the fields that were provided
        for field, value in update_data.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        # Commit the changes
        db.commit()
        db.refresh(user)
        
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
            is_verified=user.is_verified,
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the actual error for debugging
        print(f"Profile update error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")
