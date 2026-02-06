from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.category import CategorySchema, CategoryCreateSchema, CategoryUpdateSchema
from app.models import User
from app.services.category_service import CategoryService
from app.core.exceptions import AppointAIException

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories (shared across users)"""
    categories = CategoryService.get_categories(db)
    return [
        CategorySchema(
            id=c.id,
            name=c.name,
            color=c.color,
            description=c.description,
            created_at=c.created_at.isoformat() if c.created_at else None,
            usage_count=c.usage_count,
        ) for c in categories
    ]

@router.post("/", response_model=CategorySchema)
def create_category(
    category_data: CategoryCreateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new category"""
    category = CategoryService.create_category(db, category_data)
    
    return CategorySchema(
        id=category.id,
        name=category.name,
        color=category.color,
        description=category.description,
        created_at=category.created_at.isoformat(),
        usage_count=category.usage_count,
    )

@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_data: CategoryUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing category"""
    category = CategoryService.update_category(db, category_id, category_data)
    
    return CategorySchema(
        id=category.id,
        name=category.name,
        color=category.color,
        description=category.description,
        created_at=category.created_at.isoformat(),
        usage_count=category.usage_count,
    )

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing category"""
    CategoryService.delete_category(db, category_id)
    return {"message": "Category deleted successfully"}
