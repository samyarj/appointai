from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_active_user
from app.schemas.category import CategorySchema, CategoryCreateSchema, CategoryUpdateSchema
from app.models import User, Category

router = APIRouter()

@router.get("/", response_model=List[CategorySchema])
def get_categories(db: Session = Depends(get_db)):
    """Get all categories (shared across users)"""
    categories = db.query(Category).all()
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
    try:
        # Check if category with same name already exists
        existing_category = db.query(Category).filter(Category.name == category_data.name).first()
        if existing_category:
            raise HTTPException(status_code=400, detail="Category with this name already exists")
        
        category = Category(
            name=category_data.name,
            color=category_data.color,
            description=category_data.description,
            created_at=datetime.utcnow(),
            usage_count=0
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        
        return CategorySchema(
            id=category.id,
            name=category.name,
            color=category.color,
            description=category.description,
            created_at=category.created_at.isoformat(),
            usage_count=category.usage_count,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create category: {str(e)}")

@router.put("/{category_id}", response_model=CategorySchema)
def update_category(
    category_id: int,
    category_data: CategoryUpdateSchema,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing category"""
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Convert Pydantic model to dict and filter out None values
        update_data = category_data.dict(exclude_unset=True)
        
        if not update_data:
            return CategorySchema(
                id=category.id,
                name=category.name,
                color=category.color,
                description=category.description,
                created_at=category.created_at.isoformat(),
                usage_count=category.usage_count,
            )
        
        # Check if name is being updated and if it conflicts with existing categories
        if "name" in update_data and update_data["name"] != category.name:
            existing_category = db.query(Category).filter(
                Category.name == update_data["name"],
                Category.id != category_id
            ).first()
            if existing_category:
                raise HTTPException(status_code=400, detail="Category with this name already exists")
        
        # Update only the fields that were provided
        for field, value in update_data.items():
            if hasattr(category, field):
                setattr(category, field, value)
        
        # Commit the changes
        db.commit()
        db.refresh(category)
        
        return CategorySchema(
            id=category.id,
            name=category.name,
            color=category.color,
            description=category.description,
            created_at=category.created_at.isoformat(),
            usage_count=category.usage_count,
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update category: {str(e)}")

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete an existing category"""
    try:
        category = db.query(Category).filter(Category.id == category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Check if category is being used by any events or todos
        if category.usage_count > 0:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete category that is being used by events or todos"
            )
        
        # Delete the category
        db.delete(category)
        db.commit()
        
        return {"message": "Category deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete category: {str(e)}")
