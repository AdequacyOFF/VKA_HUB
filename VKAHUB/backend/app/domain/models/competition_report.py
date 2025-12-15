"""CompetitionReport model (captain reports)"""

from datetime import datetime
from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, JSON, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionReport(Base):
    """Competition report model (submitted by team captain after competition)"""

    __tablename__ = "competition_reports"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("competition_registrations.id", ondelete="CASCADE"), nullable=False)

    # Report content - Required fields
    git_link = Column(Text, nullable=False)  # Link to git repository
    presentation_url = Column(Text, nullable=False)  # PDF or PowerPoint presentation
    brief_summary = Column(Text, nullable=False)  # Brief summary of what happened
    placement = Column(Integer, nullable=True)  # Competition placement (1st, 2nd, 3rd, etc.) - NULL if no placement

    # Additional optional fields
    technologies_used = Column(Text)
    individual_contributions = Column(Text)
    team_evaluation = Column(Text)
    problems_faced = Column(Text)
    attachments = Column(JSON)  # List of file URLs (certificates, screenshots, archives)

    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    registration = relationship("CompetitionRegistration", back_populates="reports")
    submitter = relationship("User", foreign_keys=[submitted_by], back_populates="submitted_reports")

    def __repr__(self) -> str:
        return f"<CompetitionReport(id={self.id}, registration_id={self.registration_id})>"
