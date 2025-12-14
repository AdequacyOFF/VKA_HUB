"""UserSkill association model"""

from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class UserSkill(Base):
    """Association between users and skills"""

    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="skills")
    skill = relationship("Skill", back_populates="user_skills")

    def __repr__(self) -> str:
        return f"<UserSkill(user_id={self.user_id}, skill_id={self.skill_id})>"
