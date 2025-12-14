"""Team model"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class Team(Base):
    """Team model"""

    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    image_url = Column(String(500))
    captain_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    captain = relationship("User", foreign_keys=[captain_id], back_populates="created_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    join_requests = relationship("TeamJoinRequest", back_populates="team", cascade="all, delete-orphan")
    competition_registrations = relationship("CompetitionRegistration", back_populates="team", cascade="all, delete-orphan")
    reports = relationship("TeamReport", back_populates="team", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Team(id={self.id}, name='{self.name}')>"
