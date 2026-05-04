from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import Category
from app.schemas.category import CategoryCreateSchema, CategoryUpdateSchema
from app.core.exceptions import NotFoundException, BadRequestException, InternalServerException
from datetime import datetime, timezone

class CategoryService:
    @staticmethod
    def get_categories(db: Session) -> List[Category]:
        categories = db.query(Category).all()
        # Dynamically calculate usage count based on relationships
        for category in categories:
            category.usage_count = len(category.events) + len(category.todos)
        return categories

    @staticmethod
    def create_category(db: Session, category_data: CategoryCreateSchema) -> Category:
        try:
            # Check if category with same name already exists
            existing_category = db.query(Category).filter(Category.name == category_data.name).first()
            if existing_category:
                raise BadRequestException(detail="Category with this name already exists")
            
            category = Category(
                name=category_data.name,
                color=category_data.color,
                description=category_data.description,
                created_at=datetime.now(timezone.utc),
                usage_count=0
            )
            db.add(category)
            db.commit()
            db.refresh(category)
            return category
        except BadRequestException:
            raise
        except Exception as e:
            db.rollback()
            print(f"Error creating category: {e}")
            raise InternalServerException(detail="Failed to create category")

    @staticmethod
    def get_category_by_id(db: Session, category_id: int) -> Optional[Category]:
        return db.query(Category).filter(Category.id == category_id).first()

    @staticmethod
    def update_category(db: Session, category_id: int, category_data: CategoryUpdateSchema) -> Category:
        try:
            category = CategoryService.get_category_by_id(db, category_id)
            if not category:
                raise NotFoundException(detail="Category not found")
            
            # Check if name is being updated and if it conflicts with existing categories
            if category_data.name is not None and category_data.name != category.name:
                existing_category = db.query(Category).filter(
                    Category.name == category_data.name,
                    Category.id != category_id
                ).first()
                if existing_category:
                    raise BadRequestException(detail="Category with this name already exists")
            
            # Update fields if provided
            if category_data.name is not None:
                category.name = category_data.name
            if category_data.color is not None:
                category.color = category_data.color
            if category_data.description is not None:
                category.description = category_data.description
                
            db.commit()
            db.refresh(category)
            
            # Update usage count for return value
            category.usage_count = len(category.events) + len(category.todos)
            return category
            
        except (NotFoundException, BadRequestException):
            raise
        except Exception as e:
            db.rollback()
            print(f"Error updating category: {e}")
            raise InternalServerException(detail="Failed to update category")

    @staticmethod
    def delete_category(db: Session, category_id: int) -> None:
        try:
            category = CategoryService.get_category_by_id(db, category_id)
            if not category:
                raise NotFoundException(detail="Category not found")
            
            # Check if category is being used by any events or todos
            # We check the relationships directly instead of the usage_count column
            if len(category.events) > 0 or len(category.todos) > 0:
                raise BadRequestException(
                    detail="Cannot delete category that is being used by events or todos"
                )
            
            db.delete(category)
            db.commit()
        except (NotFoundException, BadRequestException):
            raise
        except Exception as e:
            db.rollback()
            print(f"Error deleting category: {e}")
            raise InternalServerException(detail="Failed to delete category")
