from pydantic import BaseModel, Field
from typing import Optional

class CategorySchema(BaseModel):
    id: int
    name: str
    color: Optional[str]
    description: Optional[str]
    created_at: Optional[str]
    usage_count: int
    class Config:
        from_attributes = True

class CategoryCreateSchema(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = Field("#3B82F6", pattern=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    description: Optional[str] = ""

class CategoryUpdateSchema(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r'^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
    description: Optional[str] = None
