"""Public router - no authentication required"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from app.presentation.api.dependencies import get_db
from app.domain.models.user import User
from app.domain.models.team import Team
from app.domain.models.competition import Competition

router = APIRouter(prefix="/api/public", tags=["Public"])


@router.get("/stats")
async def get_public_stats(db: AsyncSession = Depends(get_db)):
    """Get public platform statistics (no authentication required)"""
    now = datetime.utcnow()

    # Total counts
    total_users = await db.scalar(select(func.count(User.id)))
    total_teams = await db.scalar(select(func.count(Team.id)))
    total_competitions = await db.scalar(select(func.count(Competition.id)))

    # Active competitions (not ended)
    active_competitions = await db.scalar(
        select(func.count(Competition.id))
        .where(Competition.end_date >= now.date())
    )

    return {
        "totalUsers": total_users or 0,
        "totalTeams": total_teams or 0,
        "totalCompetitions": total_competitions or 0,
        "activeCompetitions": active_competitions or 0
    }
