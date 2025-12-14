"""Team repository interface"""

from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any


class TeamRepository(ABC):
    """Abstract team repository interface"""

    @abstractmethod
    async def create(self, team_data: Dict[str, Any]):
        """Create a new team"""
        pass

    @abstractmethod
    async def get_by_id(self, team_id: int):
        """Get team by ID"""
        pass

    @abstractmethod
    async def update(self, team_id: int, team_data: Dict[str, Any]):
        """Update team"""
        pass

    @abstractmethod
    async def delete(self, team_id: int) -> bool:
        """Delete team"""
        pass

    @abstractmethod
    async def list_teams(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List:
        """List teams with pagination and filters"""
        pass

    @abstractmethod
    async def get_team_members(self, team_id: int) -> List:
        """Get all members of a team"""
        pass

    @abstractmethod
    async def add_member(self, team_id: int, user_id: int):
        """Add a member to team"""
        pass

    @abstractmethod
    async def remove_member(self, team_id: int, user_id: int) -> bool:
        """Remove a member from team"""
        pass

    @abstractmethod
    async def get_user_current_team(self, user_id: int):
        """Get user's current team (returns first team only)"""
        pass

    @abstractmethod
    async def get_user_teams(self, user_id: int) -> List:
        """Get all teams that user is a member of"""
        pass
