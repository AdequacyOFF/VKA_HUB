"""Certificate model"""

from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Date, func
from sqlalchemy.orm import relationship

from app.infrastructure.db.base import Base


class Certificate(Base):
    """User certificate model"""

    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(100))
    date = Column(Date)
    file_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="certificates")

    def __repr__(self) -> str:
        return f"<Certificate(id={self.id}, title='{self.title}')>"
