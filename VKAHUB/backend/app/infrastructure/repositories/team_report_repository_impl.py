# app/infrastructure/repositories/team_report_repository_impl.py
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from app.domain.repositories.team_report_repository import TeamReportRepository
from app.domain.models.team_report import TeamReport


class TeamReportRepositoryImpl(TeamReportRepository):
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, team_report: TeamReport) -> TeamReport:
        self.db.add(team_report)
        await self.db.commit()
        await self.db.refresh(team_report)
        return team_report
    
    async def get_by_id(self, report_id: int) -> Optional[TeamReport]:
        result = await self.db.execute(
            select(TeamReport).where(TeamReport.id == report_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_team_id(self, team_id: int) -> List[TeamReport]:
        result = await self.db.execute(
            select(TeamReport)
            .where(TeamReport.team_id == team_id)
            .order_by(TeamReport.created_at.desc())
        )
        return result.scalars().all()
    
    async def update(self, report_id: int, update_data: dict) -> Optional[TeamReport]:
        report = await self.get_by_id(report_id)
        if not report:
            return None

        for key, value in update_data.items():
            if hasattr(report, key):
                setattr(report, key, value)

        await self.db.flush()
        await self.db.refresh(report)
        return report
    
    async def delete(self, report_id: int) -> bool:
        report = await self.get_by_id(report_id)
        if not report:
            return False
        
        await self.db.delete(report)
        await self.db.commit()
        return True