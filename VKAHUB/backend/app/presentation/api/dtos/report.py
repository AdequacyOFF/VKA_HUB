"""Report DTOs"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class CreateCaptainReportRequest(BaseModel):
    """Create captain report request"""
    registration_id: int
    summary: str
    technologies_used: Optional[str] = None
    individual_contributions: Optional[str] = None
    team_evaluation: Optional[str] = None
    problems_faced: Optional[str] = None
    attachments: Optional[Dict[str, Any]] = None


class CaptainReportResponse(BaseModel):
    """Captain report response"""
    id: int
    registration_id: int
    summary: str
    technologies_used: Optional[str] = None
    individual_contributions: Optional[str] = None
    team_evaluation: Optional[str] = None
    problems_faced: Optional[str] = None
    attachments: Optional[Dict[str, Any]] = None
    submitted_by: Optional[int] = None
    submitted_at: datetime


class GenerateReportRequest(BaseModel):
    """Generate moderator report request"""
    competition_id: int


class ModeratorReportResponse(BaseModel):
    """Moderator report response"""
    id: int
    competition_id: int
    file_url: str
    generated_by: Optional[int] = None
    generated_at: datetime
