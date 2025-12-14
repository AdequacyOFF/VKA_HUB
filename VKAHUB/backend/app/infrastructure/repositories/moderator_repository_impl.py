"""Moderator repository implementation"""

from typing import List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.moderator_repository import ModeratorRepository
from app.domain.models.moderator import Moderator


class ModeratorRepositoryImpl(ModeratorRepository):
    """SQLAlchemy implementation of Moderator repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def assign(self, user_id: int, assigned_by: int) -> Moderator:
        """Assign moderator role to user"""
        moderator = Moderator(user_id=user_id, assigned_by=assigned_by)
        self.db.add(moderator)
        await self.db.flush()
        await self.db.refresh(moderator)
        return moderator

    async def remove(self, user_id: int) -> bool:
        """Remove moderator role from user"""
        result = await self.db.execute(
            select(Moderator).where(Moderator.user_id == user_id)
        )
        moderator = result.scalar_one_or_none()

        if not moderator:
            return False

        await self.db.delete(moderator)
        await self.db.flush()
        return True

    async def is_moderator(self, user_id: int) -> bool:
        """Check if user is a moderator"""
        result = await self.db.execute(
            select(Moderator).where(Moderator.user_id == user_id)
        )
        return result.scalar_one_or_none() is not None

    async def list_all(self) -> List[Moderator]:
        """List all moderators"""
        result = await self.db.execute(select(Moderator))
        return list(result.scalars().all())

    async def count(self) -> int:
        """Count total moderators"""
        result = await self.db.execute(select(func.count(Moderator.id)))
        return result.scalar()
