"""Report repository interface"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any


class ReportRepository(ABC):
    """Abstract report repository interface"""

    @abstractmethod
    async def create_captain_report(self, report_data: Dict[str, Any]):
        """Create a captain report"""
        pass

    @abstractmethod
    async def get_captain_report_by_id(self, report_id: int):
        """Get captain report by ID"""
        pass

    @abstractmethod
    async def list_captain_reports(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List:
        """List captain reports"""
        pass

    @abstractmethod
    async def create_moderator_report(self, report_data: Dict[str, Any]):
        """Create a moderator report"""
        pass

    @abstractmethod
    async def get_moderator_report_by_id(self, report_id: int):
        """Get moderator report by ID"""
        pass

    @abstractmethod
    async def list_moderator_reports(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List:
        """List moderator reports"""
        pass
