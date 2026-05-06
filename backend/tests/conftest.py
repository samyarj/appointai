"""
Shared fixtures for the service-layer unit tests.

Uses an in-memory SQLite database so tests are fast, isolated,
and don't need a running PostgreSQL instance.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app import models  # Import models to register them

from sqlalchemy.pool import StaticPool

# ---- In-memory SQLite for isolation ----
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def db():
    """
    Provide a clean database session per test.
    Creates all tables before each test and drops them after.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def sample_user(db):
    """Create and return a sample user for tests."""
    from app.models import User
    from app.core.security import get_password_hash

    user = User(
        name="Test User",
        email="test@example.com",
        password_hash=get_password_hash("password123"),
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def sample_category(db):
    """Create and return a sample category for tests."""
    from app.models import Category
    from datetime import datetime, timezone

    category = Category(
        name="Work",
        color="#3B82F6",
        description="Work related items",
        created_at=datetime.now(timezone.utc),
        usage_count=0,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category

@pytest.fixture
def client(db):
    """Provide a TestClient with the database dependency overridden."""
    from fastapi.testclient import TestClient
    from app.main import app
    from app.db.session import get_db

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
