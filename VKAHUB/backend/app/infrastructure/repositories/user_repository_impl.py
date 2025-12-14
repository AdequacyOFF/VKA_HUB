"""User repository implementation"""

from typing import Optional, List, Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.repositories.user_repository import UserRepository
from app.domain.models.user import User


class UserRepositoryImpl(UserRepository):
    """SQLAlchemy implementation of User repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_data: Dict[str, Any]) -> User:
        """Create a new user"""
        user = User(**user_data)
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles), selectinload(User.skills))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_login(self, login: str) -> Optional[User]:
        """Get user by login"""
        result = await self.db.execute(
            select(User).where(User.login == login)
        )
        return result.scalar_one_or_none()

    async def update(self, user_id: int, user_data: Dict[str, Any]) -> Optional[User]:
        """Update user"""
        user = await self.get_by_id(user_id)
        if not user:
            return None

        for key, value in user_data.items():
            setattr(user, key, value)

        await self.db.flush()
        await self.db.refresh(user)
        return user

    async def delete(self, user_id: int) -> bool:
        """Delete user"""
        from app.infrastructure.security.system_user_protection import protect_system_user_async

        user = await self.get_by_id(user_id)
        if not user:
            return False

        # Protect system user from deletion
        await protect_system_user_async(user_id, self.db)

        await self.db.delete(user)
        await self.db.flush()
        return True

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[User]:
        """List users with pagination and filters"""
        query = select(User).options(selectinload(User.roles), selectinload(User.skills))

        if filters:
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                query = query.where(
                    (User.first_name.ilike(search_term)) |
                    (User.last_name.ilike(search_term)) |
                    (User.login.ilike(search_term))
                )

            if "study_group" in filters and filters["study_group"]:
                query = query.where(User.study_group == filters["study_group"])

            if "rank" in filters and filters["rank"]:
                query = query.where(User.rank == filters["rank"])

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_users(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count users with filters"""
        query = select(func.count(User.id))

        if filters:
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                query = query.where(
                    (User.first_name.ilike(search_term)) |
                    (User.last_name.ilike(search_term)) |
                    (User.login.ilike(search_term))
                )

        result = await self.db.execute(query)
        
        return result.scalar()
    
   