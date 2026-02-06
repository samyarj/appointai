from pydantic import BaseModel
from typing import Optional

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
        from_attributes = True

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
