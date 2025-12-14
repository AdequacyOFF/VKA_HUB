"""Certificate DTOs"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import date as DateType, datetime as DateTimeType


class CreateCertificateRequest(BaseModel):
    """Create certificate request"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[DateType] = None
    file_url: str


class UpdateCertificateRequest(BaseModel):
    """Update certificate request"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[DateType] = None
    file_url: Optional[str] = None


class CertificateResponse(BaseModel):
    """Certificate response"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[DateType] = None
    file_url: str
    created_at: DateTimeType
    updated_at: DateTimeType
