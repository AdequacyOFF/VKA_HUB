"""TeamJoinRequest model"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class JoinRequestStatus(str, PyEnum):
    """Join request status enum"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class TeamJoinRequest(Base):
    """Team join request model"""

    __tablename__ = "team_join_requests"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # NULL = user requested, NOT NULL = team invited
    status = Column(
        Enum(JoinRequestStatus, name="joinrequeststatus", native_enum=True, values_callable=lambda x: [e.value for e in x]),
        default=JoinRequestStatus.PENDING,
        nullable=False
    )
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    team = relationship("Team", back_populates="join_requests")
    user = relationship("User", foreign_keys=[user_id], back_populates="join_requests")
    inviter = relationship("User", foreign_keys=[invited_by])

    def __repr__(self) -> str:
        return f"<TeamJoinRequest(id={self.id}, team_id={self.team_id}, user_id={self.user_id}, status={self.status})>"
