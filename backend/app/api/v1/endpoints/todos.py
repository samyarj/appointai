from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.todo import TodoSchema, TodoCreateSchema, TodoUpdateSchema
from app.models import User, Todo

router = APIRouter()

@router.get("/", response_model=List[TodoSchema])
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

@router.post("/", response_model=TodoSchema)
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

@router.put("/{todo_id}", response_model=TodoSchema)
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

@router.delete("/{todo_id}")
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
