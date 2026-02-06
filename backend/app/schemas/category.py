from pydantic import BaseModel
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
    name: str
    color: Optional[str] = "#3B82F6"
    description: Optional[str] = ""

class CategoryUpdateSchema(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
