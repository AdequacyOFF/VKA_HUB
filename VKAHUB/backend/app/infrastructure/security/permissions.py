"""Authentication and permission dependencies for FastAPI"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.infrastructure.db import get_db
from app.infrastructure.security.jwt import decode_token, verify_token_type

# Will be imported after models are created
# from app.domain.models.user import User
# from app.domain.models.moderator import Moderator

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer credentials containing JWT token
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    from app.domain.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None:
        raise credentials_exception

    if not verify_token_type(payload, "access"):
        raise credentials_exception

    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        raise credentials_exception

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


async def require_moderator(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to ensure the current user is a moderator.

    Args:
        current_user: Current authenticated user
        db: Database session

    Returns:
        User: Current authenticated user (who is a moderator)

    Raises:
        HTTPException: If user is not a moderator
    """
    from app.domain.models.moderator import Moderator

    # Check if user is a moderator
    result = await db.execute(
        select(Moderator).where(Moderator.user_id == current_user.id)
    )
    moderator = result.scalar_one_or_none()

    if moderator is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Это действие требует прав модератора"
        )

    return current_user


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db)
):
    """
    Dependency to get current user if authenticated, None otherwise.

    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session

    Returns:
        Optional[User]: Current user if authenticated, None otherwise
    """
    from app.domain.models.user import User

    if credentials is None:
        return None

    token = credentials.credentials
    payload = decode_token(token)

    if payload is None or not verify_token_type(payload, "access"):
        return None

    user_id: Optional[int] = payload.get("user_id")
    if user_id is None:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    return user
