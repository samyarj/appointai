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

# Import chat router
from app.api.v1.endpoints import chat
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

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
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
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

class CategoryCreateSchema(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"
    description: Optional[str] = ""

class CategoryUpdateSchema(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class TodoCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    estimated_duration: Optional[str] = None
    due_date: Optional[str] = None
    category_id: Optional[int] = None

class TodoUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    estimated_duration: Optional[str] = None
    due_date: Optional[str] = None
    category_id: Optional[int] = None
    completed: Optional[bool] = None

class EventCreateSchema(BaseModel):
    title: str
    date: str
    startTime: str
    endTime: str
    category_id: Optional[int] = None
    duration: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None

class EventUpdateSchema(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    category_id: Optional[int] = None
    duration: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None

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
            is_recurring=e.is_recurring,
            recurrence_rule=e.recurrence_rule,
            createdAt=e.created_at.isoformat() if e.created_at else None,
        ) for e in events
    ]

@app.post("/api/events", response_model=EventSchema)
def create_event(
    event_data: EventCreateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new event for the current user"""
    try:
        event = Event(
            user_id=current_user.id,
            title=event_data.title,
            date=datetime.strptime(event_data.date, "%Y-%m-%d").date(),
            start_time=datetime.strptime(event_data.startTime, "%H:%M").time(),
            end_time=datetime.strptime(event_data.endTime, "%H:%M").time(),
            category_id=event_data.category_id,
            duration=event_data.duration,
            is_recurring=event_data.is_recurring,
            recurrence_rule=event_data.recurrence_rule,
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
            is_recurring=event.is_recurring,
            recurrence_rule=event.recurrence_rule,
            createdAt=event.created_at.isoformat(),
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create event: {str(e)}")

@app.put("/api/events/{event_id}", response_model=EventSchema)
def update_event(
    event_id: int,
    event_data: EventUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing event"""
    try:
        event = db.query(Event).filter(
            Event.id == event_id, 
            Event.user_id == current_user.id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Update fields if provided
        if event_data.title is not None:
            event.title = event_data.title
        if event_data.date is not None:
            event.date = datetime.strptime(event_data.date, "%Y-%m-%d").date()
        if event_data.startTime is not None:
            event.start_time = datetime.strptime(event_data.startTime, "%H:%M").time()
        if event_data.endTime is not None:
            event.end_time = datetime.strptime(event_data.endTime, "%H:%M").time()
        if event_data.category_id is not None:
            event.category_id = event_data.category_id
        if event_data.duration is not None:
            event.duration = event_data.duration
        if event_data.is_recurring is not None:
            event.is_recurring = event_data.is_recurring
        if event_data.recurrence_rule is not None:
            event.recurrence_rule = event_data.recurrence_rule
            
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
            is_recurring=event.is_recurring,
            recurrence_rule=event.recurrence_rule,
            createdAt=event.created_at.isoformat() if event.created_at else None,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update event: {str(e)}")

@app.delete("/api/events/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing event"""
    try:
        event = db.query(Event).filter(
            Event.id == event_id, 
            Event.user_id == current_user.id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        db.delete(event)
        db.commit()
        
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete event: {str(e)}")

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
    todo_data: TodoCreateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new todo for the current user"""
    try:
        todo = Todo(
            user_id=current_user.id,
            title=todo_data.title,
            description=todo_data.description,
            priority=todo_data.priority,
            estimated_duration=todo_data.estimated_duration,
            due_date=datetime.strptime(todo_data.due_date, "%Y-%m-%d").date() if todo_data.due_date else None,
            category_id=todo_data.category_id,
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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create todo: {str(e)}")

@app.put("/api/todos/{todo_id}", response_model=TodoSchema)
def update_todo(
    todo_id: int,
    todo_data: TodoUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing todo"""
    try:
        todo = db.query(Todo).filter(
            Todo.id == todo_id,
            Todo.user_id == current_user.id
        ).first()
        
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        # Convert Pydantic model to dict and filter out None values
        update_data = todo_data.dict(exclude_unset=True)
        
        if not update_data:
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
        
        # Handle due_date conversion
        if "due_date" in update_data and update_data["due_date"]:
            update_data["due_date"] = datetime.strptime(update_data["due_date"], "%Y-%m-%d").date()
        elif "due_date" in update_data and not update_data["due_date"]:
            update_data["due_date"] = None
        
        # Update only the fields that were provided
        for field, value in update_data.items():
            if hasattr(todo, field):
                setattr(todo, field, value)
        
        # Commit the changes
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update todo: {str(e)}")

@app.delete("/api/todos/{todo_id}")
def delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing todo"""
    try:
        todo = db.query(Todo).filter(
            Todo.id == todo_id,
            Todo.user_id == current_user.id
        ).first()
        
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        
        # Delete the todo
        db.delete(todo)
        db.commit()
        
        return {"message": "Todo deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete todo: {str(e)}")

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
    category_data: CategoryCreateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    try:
        # Check if category with same name already exists
        existing_category = db.query(Category).filter(Category.name == category_data.name).first()
        if existing_category:
            raise HTTPException(status_code=400, detail="Category with this name already exists")
        
        category = Category(
            name=category_data.name,
            color=category_data.color,
            description=category_data.description,
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@app.put("/api/categories/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_data: CategoryUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing category"""
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Convert Pydantic model to dict and filter out None values
        update_data = category_data.dict(exclude_unset=True)
        
        if not update_data:
            return CategorySchema(
                id=category.id,
                name=category.name,
                color=category.color,
                description=category.description,
                created_at=category.created_at.isoformat(),
                usage_count=category.usage_count,
            )
        
        # Check if name is being updated and if it conflicts with existing categories
        if "name" in update_data and update_data["name"] != category.name:
            existing_category = db.query(Category).filter(
                Category.name == update_data["name"],
                Category.id != category_id
            ).first()
            if existing_category:
                raise HTTPException(status_code=400, detail="Category with this name already exists")
        
        # Update only the fields that were provided
        for field, value in update_data.items():
            if hasattr(category, field):
                setattr(category, field, value)
        
        # Commit the changes
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
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")

@app.delete("/api/categories/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing category"""
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check if category is being used by any events or todos
        if category.usage_count > 0:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete category that is being used by events or todos"
            )
        
        # Delete the category
        db.delete(category)
        db.commit()
        
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")

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
