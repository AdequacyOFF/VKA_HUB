"""Competition model"""

from datetime import datetime, date
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, Enum, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionType(str, PyEnum):
    """Competition type enum"""
    HACKATHON = "hackathon"
    CTF = "CTF"
    OTHER = "other"


class Competition(Base):
    """Competition model"""

    __tablename__ = "competitions"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(CompetitionType, name="competitiontype", native_enum=True), nullable=False)
    name = Column(String(255), nullable=False, index=True)
    link = Column(String(500))
    image_url = Column(String(500))
    start_date = Column(DateTime, nullable=False)  # Changed from Date to DateTime to include time
    end_date = Column(DateTime, nullable=False)  # Changed from Date to DateTime to include time
    registration_deadline = Column(DateTime, nullable=False)
    description = Column(Text)
    other_type_description = Column(String(255))  # Description for "other" type competitions
    organizer = Column(String(500), nullable=True)  # Competition organizer (e.g., "ПАО «ВТБ»")
    min_team_size = Column(Integer, nullable=False, default=2)  # Minimum team members
    max_team_size = Column(Integer, nullable=False, default=5)  # Maximum team members
    case_file_url = Column(String(500))
    tasks_file_url = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_competitions")
    registrations = relationship("CompetitionRegistration", back_populates="competition", cascade="all, delete-orphan")
    moderator_reports = relationship("ModeratorReport", back_populates="competition", cascade="all, delete-orphan")
    stages = relationship("CompetitionStage", back_populates="competition", cascade="all, delete-orphan", order_by="CompetitionStage.stage_number")
    cases = relationship("CompetitionCase", back_populates="competition", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Competition(id={self.id}, name='{self.name}', type={self.type})>"
