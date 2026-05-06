from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import date

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
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high"]] = "medium"
    estimated_duration: Optional[str] = None
    due_date: Optional[date] = None
    category_id: Optional[int] = None

class TodoUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    estimated_duration: Optional[str] = None
    due_date: Optional[date] = None
    category_id: Optional[int] = None
    completed: Optional[bool] = None
