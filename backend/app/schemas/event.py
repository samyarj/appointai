from pydantic import BaseModel
from typing import Optional

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
        from_attributes = True

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
