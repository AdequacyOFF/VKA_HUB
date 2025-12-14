"""ModeratorReport model (generated reports)"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class ModeratorReport(Base):
    """Moderator-generated report model (exported .docx reports)"""

    __tablename__ = "moderator_reports"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(String(500), nullable=False)
    generated_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    generated_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="moderator_reports")
    generator = relationship("User", foreign_keys=[generated_by], back_populates="generated_reports")

    def __repr__(self) -> str:
        return f"<ModeratorReport(id={self.id}, competition_id={self.competition_id})>"
