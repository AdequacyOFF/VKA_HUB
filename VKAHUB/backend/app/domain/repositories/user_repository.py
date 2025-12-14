"""User repository interface"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class UserRepository(ABC):
    """Abstract user repository interface"""

    @abstractmethod
    async def create(self, user_data: Dict[str, Any]):
        """Create a new user"""
        pass

    @abstractmethod
    async def get_by_id(self, user_id: int):
        """Get user by ID"""
        pass

    @abstractmethod
    async def get_by_login(self, login: str):
        """Get user by login"""
        pass

    @abstractmethod
    async def update(self, user_id: int, user_data: Dict[str, Any]):
        """Update user"""
        pass

    @abstractmethod
    async def delete(self, user_id: int) -> bool:
        """Delete user"""
        pass

    @abstractmethod
    async def list_users(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List:
        """List users with pagination and filters"""
        pass

    @abstractmethod
    async def count_users(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count users with filters"""
        pass
