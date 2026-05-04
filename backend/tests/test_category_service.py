"""Service-layer tests for CategoryService."""

from app.services.category_service import CategoryService
from app.schemas.category import CategoryCreateSchema, CategoryUpdateSchema
from app.core.exceptions import NotFoundException, BadRequestException
import pytest


class TestCategoryService:
    def test_create_category(self, db):
        cat_data = CategoryCreateSchema(
            name="Work",
            color="#3B82F6",
            description="Work items",
        )
        category = CategoryService.create_category(db, cat_data)

        assert category.id is not None
        assert category.name == "Work"
        assert category.color == "#3B82F6"

    def test_create_duplicate_category_raises(self, db):
        cat_data = CategoryCreateSchema(name="Duplicate")
        CategoryService.create_category(db, cat_data)

        with pytest.raises(BadRequestException):
            CategoryService.create_category(db, cat_data)

    def test_get_categories(self, db):
        for name in ("A", "B"):
            CategoryService.create_category(
                db, CategoryCreateSchema(name=name)
            )

        categories = CategoryService.get_categories(db)
        assert len(categories) == 2

    def test_update_category(self, db):
        category = CategoryService.create_category(
            db, CategoryCreateSchema(name="Old Name")
        )

        updated = CategoryService.update_category(
            db,
            category.id,
            CategoryUpdateSchema(name="New Name", color="#EF4444"),
        )
        assert updated.name == "New Name"
        assert updated.color == "#EF4444"

    def test_update_category_not_found(self, db):
        with pytest.raises(NotFoundException):
            CategoryService.update_category(
                db, 9999, CategoryUpdateSchema(name="Nope")
            )

    def test_update_category_name_conflict(self, db):
        CategoryService.create_category(db, CategoryCreateSchema(name="Existing"))
        cat2 = CategoryService.create_category(db, CategoryCreateSchema(name="Other"))

        with pytest.raises(BadRequestException):
            CategoryService.update_category(
                db, cat2.id, CategoryUpdateSchema(name="Existing")
            )

    def test_delete_category(self, db):
        category = CategoryService.create_category(
            db, CategoryCreateSchema(name="Delete Me")
        )
        CategoryService.delete_category(db, category.id)

        categories = CategoryService.get_categories(db)
        assert len(categories) == 0

    def test_delete_category_not_found(self, db):
        with pytest.raises(NotFoundException):
            CategoryService.delete_category(db, 9999)
