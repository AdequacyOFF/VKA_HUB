"""Login use case"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.repositories.moderator_repository_impl import ModeratorRepositoryImpl
from app.infrastructure.security.password import verify_password
from app.infrastructure.security.jwt import create_access_token, create_refresh_token


class LoginUseCase:
    """Handle user login"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepositoryImpl(db)
        self.moder_repo = ModeratorRepositoryImpl(db)

    async def execute(self, login: str, password: str) -> dict:
        """
        Authenticate user and generate tokens.

        Args:
            login: User login
            password: Plain text password

        Returns:
            Access and refresh tokens

        Raises:
            HTTPException: If credentials are invalid
        """
        # Get user by login
        user = await self.user_repo.get_by_login(login)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        # Verify password
        if not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный логин или пароль"
            )

        # Generate tokens
        token_data = {"user_id": user.id, "login": user.login}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        is_moder = await self.moder_repo.is_moderator(user_id=user.id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "login": user.login,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar_url": user.avatar_url,
                "is_moderator": is_moder
            }
        }
