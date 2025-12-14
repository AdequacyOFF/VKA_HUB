"""Log model (activity history)"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class ActivityType(str, PyEnum):
    """Activity type enum"""
    CERTIFICATE_UPLOAD = "certificate_upload"
    CERTIFICATE_UPDATE = "certificate_update"
    CERTIFICATE_DELETE = "certificate_delete"
    TEAM_JOIN = "team_join"
    TEAM_LEAVE = "team_leave"
    TEAM_CREATE = "team_create"
    COMPETITION_APPLY = "competition_apply"
    REPORT_SUBMIT = "report_submit"
    MODERATOR_ACTION = "moderator_action"
    PROFILE_UPDATE = "profile_update"
    ROLE_UPDATE = "role_update"
    SKILL_UPDATE = "skill_update"
    USER_BAN = "user_ban"
    USER_UNBAN = "user_unban"


class Log(Base):
    """Activity log model"""

    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(Enum(ActivityType), nullable=False)
    description = Column(Text, nullable=False)
    action_metadata = Column(JSON)  # Additional data about the action
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="activity_logs")

    def __repr__(self) -> str:
        return f"<Log(id={self.id}, user_id={self.user_id}, action_type={self.action_type})>"
