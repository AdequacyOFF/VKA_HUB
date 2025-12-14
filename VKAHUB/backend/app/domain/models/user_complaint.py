"""UserComplaint model (user complaints/reports for moderation)"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class ComplaintStatus(str, PyEnum):
    """Complaint status enum"""
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class UserComplaint(Base):
    """User complaint model for moderator review"""

    __tablename__ = "user_complaints"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING, nullable=False, index=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], backref="complaints_filed")
    target = relationship("User", foreign_keys=[target_id], backref="complaints_received")
    resolver = relationship("User", foreign_keys=[resolved_by], backref="complaints_resolved")

    def __repr__(self) -> str:
        return f"<UserComplaint(id={self.id}, reporter_id={self.reporter_id}, target_id={self.target_id}, status={self.status})>"
