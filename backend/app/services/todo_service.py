from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Todo
from app.schemas.todo import TodoCreateSchema, TodoUpdateSchema
from app.core.exceptions import NotFoundException, InternalServerException
from datetime import datetime

class TodoService:
    @staticmethod
    def get_todos_by_user(db: Session, user_id: int) -> List[Todo]:
        return db.query(Todo).filter(Todo.user_id == user_id).all()

    @staticmethod
    def create_todo(db: Session, user_id: int, todo_data: TodoCreateSchema) -> Todo:
        try:
            todo = Todo(
                user_id=user_id,
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
            return todo
        except Exception as e:
            db.rollback()
            raise InternalServerException(detail=f"Failed to create todo: {str(e)}")

    @staticmethod
    def get_todo_by_id(db: Session, todo_id: int, user_id: int) -> Optional[Todo]:
        return db.query(Todo).filter(
            Todo.id == todo_id, 
            Todo.user_id == user_id
        ).first()

    @staticmethod
    def update_todo(db: Session, user_id: int, todo_id: int, todo_data: TodoUpdateSchema) -> Todo:
        try:
            todo = TodoService.get_todo_by_id(db, todo_id, user_id)
            if not todo:
                raise NotFoundException(detail="Todo not found")
            
            # Update fields if provided
            if todo_data.title is not None:
                todo.title = todo_data.title
            if todo_data.description is not None:
                todo.description = todo_data.description
            if todo_data.priority is not None:
                todo.priority = todo_data.priority
            if todo_data.estimated_duration is not None:
                todo.estimated_duration = todo_data.estimated_duration
            if todo_data.due_date is not None:
                todo.due_date = datetime.strptime(todo_data.due_date, "%Y-%m-%d").date()
            if todo_data.category_id is not None:
                todo.category_id = todo_data.category_id
            if todo_data.completed is not None:
                todo.completed = todo_data.completed
                
            db.commit()
            db.refresh(todo)
            return todo
            
        except NotFoundException:
            raise
        except Exception as e:
            db.rollback()
            raise InternalServerException(detail=f"Failed to update todo: {str(e)}")

    @staticmethod
    def delete_todo(db: Session, user_id: int, todo_id: int) -> None:
        try:
            todo = TodoService.get_todo_by_id(db, todo_id, user_id)
            if not todo:
                raise NotFoundException(detail="Todo not found")
            
            db.delete(todo)
            db.commit()
        except NotFoundException:
            raise
        except Exception as e:
            db.rollback()
            raise InternalServerException(detail=f"Failed to delete todo: {str(e)}")
