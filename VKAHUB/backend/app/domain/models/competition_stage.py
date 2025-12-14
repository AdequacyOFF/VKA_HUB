"""Competition stage model"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionStage(Base):
    """Competition stage model - represents different phases of a competition"""

    __tablename__ = "competition_stages"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    stage_number = Column(Integer, nullable=False)  # Order of the stage (1, 2, 3, etc.)
    name = Column(String(255), nullable=False)  # e.g., "Registration", "Qualification", "Finals"
    description = Column(Text)  # Detailed description of what happens in this stage
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="stages")

    def __repr__(self) -> str:
        return f"<CompetitionStage(id={self.id}, competition_id={self.competition_id}, stage_number={self.stage_number}, name='{self.name}')>"
