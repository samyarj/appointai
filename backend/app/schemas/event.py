from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
import re

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
    title: str = Field(..., min_length=1, max_length=255)
    date: date
    startTime: str = Field(..., pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    endTime: str = Field(..., pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    category_id: Optional[int] = None
    duration: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None

class EventUpdateSchema(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[date] = None
    startTime: Optional[str] = Field(None, pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    endTime: Optional[str] = Field(None, pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    category_id: Optional[int] = None
    duration: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
