"""Moderator repository interface"""

from abc import ABC, abstractmethod
from typing import List


class ModeratorRepository(ABC):
    """Abstract moderator repository interface"""

    @abstractmethod
    async def assign(self, user_id: int, assigned_by: int):
        """Assign moderator role to user"""
        pass

    @abstractmethod
    async def remove(self, user_id: int) -> bool:
        """Remove moderator role from user"""
        pass

    @abstractmethod
    async def is_moderator(self, user_id: int) -> bool:
        """Check if user is a moderator"""
        pass

    @abstractmethod
    async def list_all(self) -> List:
        """List all moderators"""
        pass

    @abstractmethod
    async def count(self) -> int:
        """Count total moderators"""
        pass
