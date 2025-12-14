"""CompetitionRegistration model"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionRegistration(Base):
    """Competition registration model (team application to competition)"""

    __tablename__ = "competition_registrations"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="pending")  # pending, approved, rejected
    result = Column(Text)  # Competition result/placement
    applied_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="registrations")
    team = relationship("Team", back_populates="competition_registrations")
    team_members = relationship("CompetitionTeamMember", back_populates="registration", cascade="all, delete-orphan")
    reports = relationship("CompetitionReport", back_populates="registration", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<CompetitionRegistration(id={self.id}, competition_id={self.competition_id}, team_id={self.team_id})>"
