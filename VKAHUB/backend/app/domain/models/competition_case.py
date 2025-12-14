"""Competition case model for hackathons"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func, ARRAY
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class CompetitionCase(Base):
    """Competition case model - specific cases/challenges for hackathons"""

    __tablename__ = "competition_cases"

    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competitions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)  # Case title
    description = Column(Text, nullable=False)  # Detailed case description
    knowledge_stack = Column(ARRAY(String), nullable=False)  # Required technologies/skills (e.g., ["Python", "React", "PostgreSQL"])
    case_number = Column(Integer, nullable=False)  # Order number of the case
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    competition = relationship("Competition", back_populates="cases")

    def __repr__(self) -> str:
        return f"<CompetitionCase(id={self.id}, competition_id={self.competition_id}, title='{self.title}')>"
