"""Report repository implementation"""

from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.repositories.report_repository import ReportRepository
from app.domain.models.competition_report import CompetitionReport
from app.domain.models.moderator_report import ModeratorReport


class ReportRepositoryImpl(ReportRepository):
    """SQLAlchemy implementation of Report repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_captain_report(self, report_data: Dict[str, Any]) -> CompetitionReport:
        """Create a captain report"""
        report = CompetitionReport(**report_data)
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def get_captain_report_by_id(self, report_id: int) -> Optional[CompetitionReport]:
        """Get captain report by ID"""
        result = await self.db.execute(
            select(CompetitionReport).where(CompetitionReport.id == report_id)
        )
        return result.scalar_one_or_none()

    async def list_captain_reports(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[CompetitionReport]:
        """List captain reports"""
        result = await self.db.execute(
            select(CompetitionReport)
            .offset(skip)
            .limit(limit)
            .order_by(CompetitionReport.submitted_at.desc())
        )
        return list(result.scalars().all())

    async def create_moderator_report(self, report_data: Dict[str, Any]) -> ModeratorReport:
        """Create a moderator report"""
        report = ModeratorReport(**report_data)
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def get_moderator_report_by_id(self, report_id: int) -> Optional[ModeratorReport]:
        """Get moderator report by ID"""
        result = await self.db.execute(
            select(ModeratorReport).where(ModeratorReport.id == report_id)
        )
        return result.scalar_one_or_none()

    async def list_moderator_reports(
        self,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModeratorReport]:
        """List moderator reports"""
        result = await self.db.execute(
            select(ModeratorReport)
            .offset(skip)
            .limit(limit)
            .order_by(ModeratorReport.generated_at.desc())
        )
        return list(result.scalars().all())
