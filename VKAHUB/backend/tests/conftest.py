"""Pytest configuration and fixtures"""

import pytest
import asyncio
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient
from fastapi.testclient import TestClient

from app.main import app
from app.infrastructure.db.base import Base
from app.domain.models.user import User
from app.infrastructure.security.password import hash_password


@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for the test session"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_db():
    """Create test database"""
    # Use in-memory SQLite for testing
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(test_db) -> AsyncGenerator[AsyncSession, None]:
    """Create database session for tests"""
    async_session = async_sessionmaker(
        test_db, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session


@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)


@pytest.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Create async test client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user"""
    user = User(
        login="testuser",
        password_hash=hash_password("testpassword"),
        first_name="Test",
        last_name="User",
        middle_name="Middle"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user
