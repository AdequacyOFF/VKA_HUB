"""Create team use case"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.repositories.team_repository_impl import TeamRepositoryImpl


class CreateTeamUseCase:
    """Handle team creation"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.team_repo = TeamRepositoryImpl(db)

    async def execute(self, name: str, description: str, captain_id: int, image_url: str = None) -> dict:
        """
        Create a new team with the creator as captain.

        Args:
            name: Team name
            description: Team description
            captain_id: User ID of team captain
            image_url: Team image URL

        Returns:
            Created team data
        """
        # Create team
        team = await self.team_repo.create({
            "name": name,
            "description": description,
            "captain_id": captain_id,
            "image_url": image_url
        })

        # Add captain as first member
        await self.team_repo.add_member(team.id, captain_id)
        await self.db.commit()

        return {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "image_url": team.image_url,
            "captain_id": team.captain_id,
            "created_at": team.created_at,
            "updated_at": team.updated_at
        }
