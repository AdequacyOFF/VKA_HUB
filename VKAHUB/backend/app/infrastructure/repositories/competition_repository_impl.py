"""Competition repository implementation"""

from typing import Optional, List, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.repositories.competition_repository import CompetitionRepository
from app.domain.models.competition import Competition
from app.domain.models.competition_stage import CompetitionStage
from app.domain.models.competition_case import CompetitionCase
from app.domain.models.competition_registration import CompetitionRegistration
from app.domain.models.competition_team_member import CompetitionTeamMember


class CompetitionRepositoryImpl(CompetitionRepository):
    """SQLAlchemy implementation of Competition repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, competition_data: Dict[str, Any]) -> Competition:
        """Create a new competition with stages and cases"""
        # Extract nested data
        stages_data = competition_data.pop('stages', [])
        cases_data = competition_data.pop('cases', [])

        # Create competition
        competition = Competition(**competition_data)
        self.db.add(competition)
        await self.db.flush()

        # Create stages
        for stage_data in stages_data:
            stage = CompetitionStage(
                competition_id=competition.id,
                **stage_data
            )
            self.db.add(stage)

        # Create cases (for hackathons)
        for case_data in cases_data:
            case = CompetitionCase(
                competition_id=competition.id,
                **case_data
            )
            self.db.add(case)

        await self.db.flush()
        await self.db.refresh(competition, ['stages', 'cases'])
        return competition

    async def get_by_id(self, competition_id: int) -> Optional[Competition]:
        """Get competition by ID with stages and cases"""
        result = await self.db.execute(
            select(Competition)
            .options(
                selectinload(Competition.registrations),
                selectinload(Competition.stages),
                selectinload(Competition.cases)
            )
            .where(Competition.id == competition_id)
        )
        return result.scalar_one_or_none()

    async def update(self, competition_id: int, competition_data: Dict[str, Any]) -> Optional[Competition]:
        """Update competition with stages and cases"""
        competition = await self.get_by_id(competition_id)
        if not competition:
            return None

        # Extract nested data
        stages_data = competition_data.pop('stages', None)
        cases_data = competition_data.pop('cases', None)

        # Update competition fields
        for key, value in competition_data.items():
            setattr(competition, key, value)

        # Update stages if provided
        if stages_data is not None:
            # Delete existing stages
            for stage in competition.stages:
                await self.db.delete(stage)
            await self.db.flush()

            # Create new stages
            for stage_data in stages_data:
                stage = CompetitionStage(
                    competition_id=competition.id,
                    **stage_data
                )
                self.db.add(stage)

        # Update cases if provided
        if cases_data is not None:
            # Delete existing cases
            for case in competition.cases:
                await self.db.delete(case)
            await self.db.flush()

            # Create new cases
            for case_data in cases_data:
                case = CompetitionCase(
                    competition_id=competition.id,
                    **case_data
                )
                self.db.add(case)

        await self.db.flush()
        await self.db.refresh(competition, ['stages', 'cases'])
        return competition

    async def delete(self, competition_id: int) -> bool:
        """Delete competition"""
        competition = await self.get_by_id(competition_id)
        if not competition:
            return False

        await self.db.delete(competition)
        await self.db.flush()
        return True

    async def list_competitions(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Competition]:
        """List competitions with pagination and filters"""
        query = select(Competition).options(
            selectinload(Competition.stages),
            selectinload(Competition.cases)
        )

        if filters:
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                query = query.where(Competition.name.ilike(search_term))

            if "type" in filters and filters["type"]:
                query = query.where(Competition.type == filters["type"])

        query = query.offset(skip).limit(limit).order_by(Competition.start_date.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_registrations(self, competition_id: int) -> List[CompetitionRegistration]:
        """Get all registrations for a competition"""
        result = await self.db.execute(
            select(CompetitionRegistration)
            .options(selectinload(CompetitionRegistration.team))
            .where(CompetitionRegistration.competition_id == competition_id)
        )
        return list(result.scalars().all())

    async def create_registration(self, registration_data: Dict[str, Any]) -> CompetitionRegistration:
        """Create a competition registration with team members"""
        # Extract member IDs
        member_ids = registration_data.pop('member_ids', [])

        # Create registration
        registration = CompetitionRegistration(**registration_data)
        self.db.add(registration)
        await self.db.flush()

        # Add team members
        for user_id in member_ids:
            team_member = CompetitionTeamMember(
                registration_id=registration.id,
                user_id=user_id
            )
            self.db.add(team_member)

        await self.db.flush()
        await self.db.refresh(registration, ['team_members'])
        return registration
