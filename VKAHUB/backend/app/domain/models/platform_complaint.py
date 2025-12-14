"""PlatformComplaint model (complaints about the platform/site itself)"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class PlatformComplaintCategory(str, PyEnum):
    """Platform complaint category enum"""
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    PERFORMANCE = "performance"
    UI_UX = "ui_ux"
    SECURITY = "security"
    OTHER = "other"


class ComplaintStatus(str, PyEnum):
    """Complaint status enum"""
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class PlatformComplaint(Base):
    """Platform complaint model for user feedback about the site"""

    __tablename__ = "platform_complaints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(Enum(PlatformComplaintCategory), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING, nullable=False, index=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", foreign_keys=[user_id], backref="platform_complaints_filed")
    resolver = relationship("User", foreign_keys=[resolved_by], backref="platform_complaints_resolved")

    def __repr__(self) -> str:
        return f"<PlatformComplaint(id={self.id}, user_id={self.user_id}, category={self.category}, status={self.status})>"
