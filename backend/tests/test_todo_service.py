"""Service-layer tests for TodoService."""

from datetime import date
from app.services.todo_service import TodoService
from app.schemas.todo import TodoCreateSchema, TodoUpdateSchema
from app.core.exceptions import NotFoundException
import pytest


class TestTodoService:
    def test_create_todo(self, db, sample_user):
        todo_data = TodoCreateSchema(
            title="Buy groceries",
            description="Milk, eggs, bread",
            priority="high",
            due_date=date(2026, 6, 20),
        )
        todo = TodoService.create_todo(db, sample_user.id, todo_data)

        assert todo.id is not None
        assert todo.title == "Buy groceries"
        assert todo.priority == "high"
        assert todo.completed is False
        assert todo.due_date == date(2026, 6, 20)

    def test_create_todo_without_due_date(self, db, sample_user):
        todo_data = TodoCreateSchema(title="No deadline task")
        todo = TodoService.create_todo(db, sample_user.id, todo_data)

        assert todo.due_date is None
        assert todo.priority == "medium"  # default

    def test_get_todos_by_user(self, db, sample_user):
        for title in ("Todo A", "Todo B", "Todo C"):
            TodoService.create_todo(
                db,
                sample_user.id,
                TodoCreateSchema(title=title),
            )

        todos = TodoService.get_todos_by_user(db, sample_user.id)
        assert len(todos) == 3

    def test_update_todo(self, db, sample_user):
        todo = TodoService.create_todo(
            db,
            sample_user.id,
            TodoCreateSchema(title="Original"),
        )

        updated = TodoService.update_todo(
            db,
            sample_user.id,
            todo.id,
            TodoUpdateSchema(title="Updated", completed=True),
        )
        assert updated.title == "Updated"
        assert updated.completed is True

    def test_update_todo_not_found(self, db, sample_user):
        with pytest.raises(NotFoundException):
            TodoService.update_todo(
                db,
                sample_user.id,
                9999,
                TodoUpdateSchema(title="Nope"),
            )

    def test_delete_todo(self, db, sample_user):
        todo = TodoService.create_todo(
            db,
            sample_user.id,
            TodoCreateSchema(title="Delete Me"),
        )
        TodoService.delete_todo(db, sample_user.id, todo.id)

        remaining = TodoService.get_todos_by_user(db, sample_user.id)
        assert len(remaining) == 0

    def test_delete_todo_not_found(self, db, sample_user):
        with pytest.raises(NotFoundException):
            TodoService.delete_todo(db, sample_user.id, 9999)
