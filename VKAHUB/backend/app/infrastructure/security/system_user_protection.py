"""System user protection utilities"""

from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.domain.models.user import User

# Default system user login
SYSTEM_USER_LOGIN = "GeDeKo"


async def is_system_user(user_id: int, db: AsyncSession) -> bool:
    """
    Check if a user ID belongs to the default system user.

    Args:
        user_id: User ID to check
        db: Database session

    Returns:
        True if user is the system user, False otherwise
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user and user.login == SYSTEM_USER_LOGIN:
        return True

    return False


async def is_system_user_by_login(login: str) -> bool:
    """
    Check if a login belongs to the default system user.

    Args:
        login: Login to check

    Returns:
        True if login is the system user, False otherwise
    """
    return login == SYSTEM_USER_LOGIN


def protect_system_user(user_id: int, user_login: Optional[str] = None) -> None:
    """
    Raise an exception if attempting to modify/delete the system user.

    Args:
        user_id: User ID to check
        user_login: Optional user login (to avoid DB query if already known)

    Raises:
        HTTPException: If user is the protected system user
    """
    if user_login and user_login == SYSTEM_USER_LOGIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot modify or delete the default system user ({SYSTEM_USER_LOGIN})"
        )


async def protect_system_user_async(user_id: int, db: AsyncSession) -> None:
    """
    Async version: Raise an exception if attempting to modify/delete the system user.

    Args:
        user_id: User ID to check
        db: Database session

    Raises:
        HTTPException: If user is the protected system user
    """
    if await is_system_user(user_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot modify or delete the default system user ({SYSTEM_USER_LOGIN})"
        )
