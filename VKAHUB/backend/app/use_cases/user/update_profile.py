"""Update user profile use case"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.infrastructure.repositories.user_repository_impl import UserRepositoryImpl


class UpdateProfileUseCase:
    """Handle user profile updates"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepositoryImpl(db)

    async def execute(self, user_id: int, profile_data: dict) -> dict:
        """
        Update user profile information.

        Args:
            user_id: ID of user to update
            profile_data: Profile data to update

        Returns:
            Updated user data
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Update user
        updated_user = await self.user_repo.update(user_id, profile_data)
        await self.db.commit()

        return {
            "id": updated_user.id,
            "login": updated_user.login,
            "first_name": updated_user.first_name,
            "last_name": updated_user.last_name,
            "middle_name": updated_user.middle_name,
            "study_group": updated_user.study_group,
            "position": updated_user.position,
            "rank": updated_user.rank,
            "avatar_url": updated_user.avatar_url,
            "created_at": updated_user.created_at,
            "updated_at": updated_user.updated_at
        }
