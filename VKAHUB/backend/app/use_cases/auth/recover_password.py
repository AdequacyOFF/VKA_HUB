"""Password recovery use case"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl
from app.infrastructure.security.password import hash_password, verify_password


class RecoverPasswordUseCase:
    """Handle password recovery"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepositoryImpl(db)

    async def execute(self, login: str, control_answer: str, new_password: str) -> dict:
        """
        Recover user password using control question answer.

        Args:
            login: User login
            control_answer: Answer to control question
            new_password: New password

        Returns:
            Success message

        Raises:
            HTTPException: If user not found or answer incorrect
        """
        # Get user by login
        user = await self.user_repo.get_by_login(login)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден"
            )

        # Check if control question is set
        if not user.control_question or not user.control_answer_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Контрольный вопрос не установлен для этого пользователя"
            )

        # Verify control answer
        if not verify_password(control_answer, user.control_answer_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный ответ на контрольный вопрос"
            )

        # Update password
        new_password_hash = hash_password(new_password)
        await self.user_repo.update(user.id, {"password_hash": new_password_hash})
        await self.db.commit()

        return {"message": "Пароль успешно обновлен"}
