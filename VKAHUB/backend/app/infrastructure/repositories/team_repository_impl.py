"""Team repository implementation"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.repositories.team_repository import TeamRepository
from app.domain.models.team import Team
from app.domain.models.team_member import TeamMember


class TeamRepositoryImpl(TeamRepository):
    """SQLAlchemy implementation of Team repository"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, team_data: Dict[str, Any]) -> Team:
        """Create a new team"""
        team = Team(**team_data)
        self.db.add(team)
        await self.db.flush()
        await self.db.refresh(team)
        return team

    async def get_by_id(self, team_id: int) -> Optional[Team]:
        """Get team by ID"""
        result = await self.db.execute(
            select(Team)
            .options(
                selectinload(Team.members),
                selectinload(Team.captain)
            )
            .where(Team.id == team_id)
        )
        return result.scalar_one_or_none()

    async def update(self, team_id: int, team_data: Dict[str, Any]) -> Optional[Team]:
        """Update team"""
        team = await self.get_by_id(team_id)
        if not team:
            return None

        for key, value in team_data.items():
            setattr(team, key, value)

        await self.db.flush()
        await self.db.refresh(team)
        return team

    async def delete(self, team_id: int) -> bool:
        """Delete team"""
        team = await self.get_by_id(team_id)
        if not team:
            return False

        await self.db.delete(team)
        await self.db.flush()
        return True

    async def list_teams(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Team]:
        """List teams with pagination and filters"""
        query = select(Team).options(selectinload(Team.captain))

        if filters:
            if "search" in filters and filters["search"]:
                search_term = f"%{filters['search']}%"
                query = query.where(Team.name.ilike(search_term))

        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_team_members(self, team_id: int) -> List[TeamMember]:
        """Get all members of a team"""
        result = await self.db.execute(
            select(TeamMember)
            .where(TeamMember.team_id == team_id, TeamMember.left_at.is_(None))
        )
        return list(result.scalars().all())

    async def add_member(self, team_id: int, user_id: int) -> TeamMember:
        """Add a member to team"""
        member = TeamMember(team_id=team_id, user_id=user_id)
        self.db.add(member)
        await self.db.flush()
        await self.db.refresh(member)
        return member

    async def remove_member(self, team_id: int, user_id: int) -> bool:
        """Remove a member from team"""
        result = await self.db.execute(
            select(TeamMember)
            .where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
                TeamMember.left_at.is_(None)
            )
        )
        member = result.scalar_one_or_none()

        if not member:
            return False

        member.left_at = datetime.utcnow()
        await self.db.flush()
        return True

    async def get_user_current_team(self, user_id: int) -> Optional[Team]:
        """Get user's current team (returns first team only - deprecated, use get_user_teams)"""
        result = await self.db.execute(
            select(Team)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .options(
                selectinload(Team.members),
                selectinload(Team.captain)
            )
            .where(
                TeamMember.user_id == user_id,
                TeamMember.left_at.is_(None)
            )
        )
        return result.scalar_one_or_none()

    async def get_user_teams(self, user_id: int) -> List[Team]:
        """Get all teams that user is a member of"""
        result = await self.db.execute(
            select(Team)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .options(
                selectinload(Team.members),
                selectinload(Team.captain)
            )
            .where(
                TeamMember.user_id == user_id,
                TeamMember.left_at.is_(None)
            )
        )
        return list(result.scalars().all())
