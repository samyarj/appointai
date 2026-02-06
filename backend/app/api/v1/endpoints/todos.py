from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.todo import TodoSchema, TodoCreateSchema, TodoUpdateSchema
from app.models import User
from app.services.todo_service import TodoService
from app.core.exceptions import AppointAIException

router = APIRouter()

@router.get("/", response_model=List[TodoSchema])
def get_todos(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get todos for the current user"""
    todos = TodoService.get_todos_by_user(db, current_user.id)
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

@router.post("/", response_model=TodoSchema)
def create_todo(
    todo_data: TodoCreateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new todo for the current user"""
    todo = TodoService.create_todo(db, current_user.id, todo_data)
    
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

@router.put("/{todo_id}", response_model=TodoSchema)
def update_todo(
    todo_id: int,
    todo_data: TodoUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing todo"""
    todo = TodoService.update_todo(db, current_user.id, todo_id, todo_data)
    
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
        created_at=todo.created_at.isoformat() if todo.created_at else None,
    )

@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing todo"""
    TodoService.delete_todo(db, current_user.id, todo_id)
    return {"message": "Todo deleted successfully"}
