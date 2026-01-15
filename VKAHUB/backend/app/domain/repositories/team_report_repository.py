# app/domain/repositories/team_report_repository.py
from abc import ABC, abstractmethod
from typing import Optional, List
from app.domain.models.team_report import TeamReport


class TeamReportRepository(ABC):
    """Repository interface for team reports (internal team reports)"""
    
    @abstractmethod
    async def create(self, team_report: TeamReport) -> TeamReport:
        """Create a new team report"""
        pass
    
    @abstractmethod
    async def get_by_id(self, report_id: int) -> Optional[TeamReport]:
        """Get team report by ID"""
        pass
    
    @abstractmethod
    async def get_by_team_id(self, team_id: int) -> List[TeamReport]:
        """Get all reports for a specific team"""
        pass
    
    @abstractmethod
    async def update(self, report_id: int, update_data: dict) -> Optional[TeamReport]:
        """Update team report by ID with update data dict"""
        pass
    
    @abstractmethod
    async def delete(self, report_id: int) -> bool:
        """Delete team report"""
        pass