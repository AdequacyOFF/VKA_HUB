"""Register use case"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.security.password import hash_password


class RegisterUseCase:
    """Handle user registration"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepositoryImpl(db)

    async def execute(self, login: str, password: str) -> dict:
        """
        Register a new user.

        Args:
            login: User login
            password: Plain text password

        Returns:
            Created user data

        Raises:
            HTTPException: If login already exists
        """
        # Check if login already exists
        existing_user = await self.user_repo.get_by_login(login)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Этот логин уже зарегистрирован"
            )

        # Hash password
        password_hash = hash_password(password)

        # Create user
        user = await self.user_repo.create({
            "login": login,
            "password_hash": password_hash
        })

        await self.db.commit()

        return {
            "id": user.id,
            "login": user.login,
            "created_at": user.created_at
        }
