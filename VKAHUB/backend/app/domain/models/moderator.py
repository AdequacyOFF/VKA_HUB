"""Moderator model"""

from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class Moderator(Base):
    """Moderator assignment model"""

    __tablename__ = "moderators"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="moderator")
    assigner = relationship("User", foreign_keys=[assigned_by], overlaps="assigned_moderators")

    def __repr__(self) -> str:
        return f"<Moderator(user_id={self.user_id})>"
