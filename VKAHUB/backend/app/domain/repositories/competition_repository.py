"""Competition repository interface"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class CompetitionRepository(ABC):
    """Abstract competition repository interface"""

    @abstractmethod
    async def create(self, competition_data: Dict[str, Any]):
        """Create a new competition"""
        pass

    @abstractmethod
    async def get_by_id(self, competition_id: int):
        """Get competition by ID"""
        pass

    @abstractmethod
    async def update(self, competition_id: int, competition_data: Dict[str, Any]):
        """Update competition"""
        pass

    @abstractmethod
    async def delete(self, competition_id: int) -> bool:
        """Delete competition"""
        pass

    @abstractmethod
    async def list_competitions(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List:
        """List competitions with pagination and filters"""
        pass

    @abstractmethod
    async def get_registrations(self, competition_id: int) -> List:
        """Get all registrations for a competition"""
        pass

    @abstractmethod
    async def create_registration(self, registration_data: Dict[str, Any]):
        """Create a competition registration"""
        pass
