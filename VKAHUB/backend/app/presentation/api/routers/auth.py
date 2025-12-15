"""Authentication router"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.presentation.api.dependencies import get_db
from app.presentation.api.dtos.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    RecoverPasswordRequest,
    GetControlQuestionResponse
)
from app.use_cases.auth.register import RegisterUseCase
from app.use_cases.auth.login import LoginUseCase
from app.use_cases.auth.recover_password import RecoverPasswordUseCase
from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    use_case = RegisterUseCase(db)
    result = await use_case.execute(request.login, request.password)
    return result


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Login and get tokens"""
    use_case = LoginUseCase(db)
    result = await use_case.execute(request.login, request.password)
    return result


@router.get("/control-question/{login}", response_model=GetControlQuestionResponse)
async def get_control_question(
    login: str,
    db: AsyncSession = Depends(get_db)
):
    """Get control question for password recovery"""
    user_repo = UserRepositoryImpl(db)
    user = await user_repo.get_by_login(login)

    if not user or not user.control_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Контрольный вопрос не найден для этого пользователя"
        )

    return {
        "login": user.login,
        "control_question": user.control_question
    }


@router.post("/recover-password")
async def recover_password(
    request: RecoverPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Recover password using control question"""
    use_case = RecoverPasswordUseCase(db)
    result = await use_case.execute(
        request.login,
        request.control_answer,
        request.new_password
    )
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token"""
    from app.infrastructure.security.jwt import decode_token, verify_token_type, create_access_token, create_refresh_token
    from app.domain.models.user import User
    from app.infrastructure.repositories.moderator_repository_impl import ModeratorRepositoryImpl
    from sqlalchemy import select

    # Decode and validate refresh token
    payload = decode_token(request.refresh_token)
    if payload is None or not verify_token_type(payload, "refresh"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен обновления"
        )

    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный токен обновления"
        )

    # Get user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден"
        )

    # Generate new tokens
    token_data = {"user_id": user.id, "login": user.login}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Check if user is moderator
    moder_repo = ModeratorRepositoryImpl(db)
    is_moder = await moder_repo.is_moderator(user_id=user.id)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "login": user.login,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "middle_name": user.middle_name,
            "study_group": user.study_group,
            "position": user.position,
            "rank": user.rank,
            "avatar_url": user.avatar_url,
            "is_moderator": is_moder
        }
    }


@router.post("/logout")
async def logout():
    """Logout (client should discard tokens)"""
    return {"message": "Вы успешно вышли из системы"}
