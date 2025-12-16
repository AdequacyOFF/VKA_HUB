"""User model"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, func, Boolean
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class User(Base):
    """User account model"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Personal information
    first_name = Column(String(100))
    last_name = Column(String(100))
    middle_name = Column(String(100))

    # Security question for password recovery
    control_question = Column(String(255))
    control_answer_hash = Column(String(255))

    # User details
    study_group = Column(String(50))
    position = Column(String(100))
    rank = Column(String(100))
    avatar_url = Column(String(500))

    # Account status
    is_banned = Column(Boolean, server_default='false', nullable=False)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    skills = relationship("UserSkill", back_populates="user", cascade="all, delete-orphan")
    moderator = relationship("Moderator", foreign_keys="Moderator.user_id", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assigned_moderators = relationship("Moderator", foreign_keys="Moderator.assigned_by")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    team_memberships = relationship("TeamMember", back_populates="user", cascade="all, delete-orphan")
    created_teams = relationship("Team", foreign_keys="Team.captain_id", back_populates="captain")
    join_requests = relationship("TeamJoinRequest", foreign_keys="TeamJoinRequest.user_id", back_populates="user", cascade="all, delete-orphan")
    sent_invitations = relationship("TeamJoinRequest", foreign_keys="TeamJoinRequest.invited_by")
    competition_participations = relationship("CompetitionTeamMember", back_populates="user", cascade="all, delete-orphan")
    submitted_reports = relationship("CompetitionReport", foreign_keys="CompetitionReport.submitted_by", back_populates="submitter")
    activity_logs = relationship("Log", back_populates="user", cascade="all, delete-orphan")
    created_competitions = relationship("Competition", foreign_keys="Competition.created_by", back_populates="creator")
    generated_reports = relationship("ModeratorReport", foreign_keys="ModeratorReport.generated_by", back_populates="generator")
    authored_reports = relationship("TeamReport", back_populates="author")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, login='{self.login}')>"

    @property
    def full_name(self) -> str:
        """Get full name of the user"""
        parts = [self.last_name, self.first_name, self.middle_name]
        return " ".join(part for part in parts if part)
