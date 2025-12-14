"""Tests for roles and skills endpoints"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user import User
from app.domain.models.role import Role
from app.domain.models.skill import Skill
from app.domain.models.user_role import UserRole
from app.domain.models.user_skill import UserSkill
from app.infrastructure.security.password import hash_password


@pytest.mark.asyncio
async def test_get_roles_skills_empty(async_client: AsyncClient, db_session: AsyncSession, test_user: User):
    """Test getting roles and skills when user has none"""
    # Login to get token
    login_response = await async_client.post(
        "/api/auth/login",
        json={"login": test_user.login, "password": "testpassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Get roles and skills
    response = await async_client.get(
        f"/api/users/{test_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data == {"roles": [], "skills": []}


@pytest.mark.asyncio
async def test_get_roles_skills_with_data(async_client: AsyncClient, db_session: AsyncSession, test_user: User):
    """Test getting roles and skills when user has some"""
    # Get roles and skills from database
    backend_role_result = await db_session.execute(
        select(Role).where(Role.name == "backend")
    )
    backend_role = backend_role_result.scalar_one()

    python_skill_result = await db_session.execute(
        select(Skill).where(Skill.name == "python")
    )
    python_skill = python_skill_result.scalar_one()

    # Assign role and skill to user
    user_role = UserRole(user_id=test_user.id, role_id=backend_role.id)
    user_skill = UserSkill(user_id=test_user.id, skill_id=python_skill.id)
    db_session.add(user_role)
    db_session.add(user_skill)
    await db_session.commit()

    # Login to get token
    login_response = await async_client.post(
        "/api/auth/login",
        json={"login": test_user.login, "password": "testpassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Get roles and skills
    response = await async_client.get(
        f"/api/users/{test_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "backend" in data["roles"]
    assert "python" in data["skills"]


@pytest.mark.asyncio
async def test_update_roles_skills(async_client: AsyncClient, db_session: AsyncSession, test_user: User):
    """Test updating user's roles and skills"""
    # Login to get token
    login_response = await async_client.post(
        "/api/auth/login",
        json={"login": test_user.login, "password": "testpassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Update roles and skills
    update_data = {
        "roles": ["backend", "frontend"],
        "skills": ["python", "javascript", "react"]
    }
    response = await async_client.put(
        f"/api/users/{test_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"},
        json=update_data
    )

    assert response.status_code == 200
    data = response.json()
    assert set(data["roles"]) == {"backend", "frontend"}
    assert set(data["skills"]) == {"python", "javascript", "react"}

    # Verify data persisted in database
    get_response = await async_client.get(
        f"/api/users/{test_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_response.status_code == 200
    get_data = get_response.json()
    assert set(get_data["roles"]) == {"backend", "frontend"}
    assert set(get_data["skills"]) == {"python", "javascript", "react"}


@pytest.mark.asyncio
async def test_update_roles_skills_replaces_existing(async_client: AsyncClient, db_session: AsyncSession, test_user: User):
    """Test that updating roles and skills replaces existing ones"""
    # Get roles and skills from database
    backend_role_result = await db_session.execute(
        select(Role).where(Role.name == "backend")
    )
    backend_role = backend_role_result.scalar_one()

    python_skill_result = await db_session.execute(
        select(Skill).where(Skill.name == "python")
    )
    python_skill = python_skill_result.scalar_one()

    # Assign initial role and skill
    user_role = UserRole(user_id=test_user.id, role_id=backend_role.id)
    user_skill = UserSkill(user_id=test_user.id, skill_id=python_skill.id)
    db_session.add(user_role)
    db_session.add(user_skill)
    await db_session.commit()

    # Login to get token
    login_response = await async_client.post(
        "/api/auth/login",
        json={"login": test_user.login, "password": "testpassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Update with different roles and skills
    update_data = {
        "roles": ["frontend"],
        "skills": ["javascript"]
    }
    response = await async_client.put(
        f"/api/users/{test_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"},
        json=update_data
    )

    assert response.status_code == 200
    data = response.json()
    assert data["roles"] == ["frontend"]
    assert data["skills"] == ["javascript"]
    # Old values should be gone
    assert "backend" not in data["roles"]
    assert "python" not in data["skills"]


@pytest.mark.asyncio
async def test_cannot_view_other_users_roles_skills(async_client: AsyncClient, db_session: AsyncSession, test_user: User):
    """Test that users cannot view other users' roles and skills"""
    # Create another user
    other_user = User(
        login="otheruser",
        password_hash=hash_password("otherpassword"),
        first_name="Other",
        last_name="User"
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    # Login as test_user
    login_response = await async_client.post(
        "/api/auth/login",
        json={"login": test_user.login, "password": "testpassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Try to access other user's roles and skills
    response = await client.get(
        f"/api/users/{other_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_cannot_update_other_users_roles_skills(async_client: AsyncClient, db_session: AsyncSession, test_user: User):
    """Test that users cannot update other users' roles and skills"""
    # Create another user
    other_user = User(
        login="otheruser2",
        password_hash=hash_password("otherpassword"),
        first_name="Other",
        last_name="User"
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    # Login as test_user
    login_response = await async_client.post(
        "/api/auth/login",
        json={"login": test_user.login, "password": "testpassword"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    # Try to update other user's roles and skills
    update_data = {
        "roles": ["backend"],
        "skills": ["python"]
    }
    response = await async_client.put(
        f"/api/users/{other_user.id}/roles-skills",
        headers={"Authorization": f"Bearer {token}"},
        json=update_data
    )

    assert response.status_code == 403
