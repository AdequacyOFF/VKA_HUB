"""CompetitionReport model (captain reports)"""

from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionResult(str, PyEnum):
    """Competition result enum"""
    FIRST_PLACE = "1st_place"
    SECOND_PLACE = "2nd_place"
    THIRD_PLACE = "3rd_place"
    FINALIST = "finalist"
    SEMI_FINALIST = "semi_finalist"
    DID_NOT_PASS = "did_not_pass"


class CompetitionReport(Base):
    """Competition report model (submitted by team captain after competition)"""

    __tablename__ = "competition_reports"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("competition_registrations.id", ondelete="CASCADE"), nullable=False)

    # Report content - Required fields
    result = Column(Enum(CompetitionResult, name="competitionresult", native_enum=True), nullable=False)  # Competition result
    git_link = Column(Text, nullable=False)  # Link to git repository
    project_url = Column(Text, nullable=True)  # Link to deployed project (optional)
    presentation_url = Column(Text, nullable=False)  # PDF or PowerPoint presentation
    brief_summary = Column(Text, nullable=False)  # Brief summary of what happened
    placement = Column(Integer, nullable=True)  # Competition placement (1st, 2nd, 3rd, etc.) - NULL if no placement (deprecated, use result instead)

    # Additional optional fields
    technologies_used = Column(Text)
    individual_contributions = Column(Text)
    team_evaluation = Column(Text)
    problems_faced = Column(Text)
    screenshot_url = Column(Text, nullable=True)  # Screenshot of the competition result
    attachments = Column(JSON)  # List of file URLs (certificates, screenshots, archives)

    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    submitted_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    registration = relationship("CompetitionRegistration", back_populates="reports")
    submitter = relationship("User", foreign_keys=[submitted_by], back_populates="submitted_reports")

    def __repr__(self) -> str:
        return f"<CompetitionReport(id={self.id}, registration_id={self.registration_id})>"
