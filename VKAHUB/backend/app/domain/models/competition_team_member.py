"""CompetitionTeamMember model"""

from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionTeamMember(Base):
    """Competition team member model (specific members participating in a competition)"""

    __tablename__ = "competition_team_members"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("competition_registrations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    registration = relationship("CompetitionRegistration", back_populates="team_members")
    user = relationship("User", back_populates="competition_participations")

    def __repr__(self) -> str:
        return f"<CompetitionTeamMember(registration_id={self.registration_id}, user_id={self.user_id})>"
