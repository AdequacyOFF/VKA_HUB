"""Skill model"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class Skill(Base):
    """User skill model (programming languages, frameworks, etc.)"""

    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    is_custom = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user_skills = relationship("UserSkill", back_populates="skill", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name='{self.name}')>"
