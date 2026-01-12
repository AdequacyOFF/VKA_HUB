"""Team DTOs"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CreateTeamRequest(BaseModel):
    """Create team request"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    image_url: Optional[str] = None
    direction: str = Field(..., min_length=1, max_length=100, description="Team direction: CTF, Hackathon, etc.")


class UpdateTeamRequest(BaseModel):
    """Update team request"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    image_url: Optional[str] = None
    direction: Optional[str] = Field(None, min_length=1, max_length=100, description="Team direction: CTF, Hackathon, etc.")


class TeamMemberResponse(BaseModel):
    """Team member response"""
    id: int
    user_id: int
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    avatar: Optional[str] = None
    position: Optional[str] = None
    joined_at: datetime
    left_at: Optional[datetime] = None


class TeamResponse(BaseModel):
    """Team response"""
    id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    direction: Optional[str] = None
    captain_id: Optional[int] = None
    members: Optional[List['TeamMemberResponse']] = None
    created_at: datetime
    updated_at: datetime


class JoinRequestResponse(BaseModel):
    """Join request response"""
    id: int
    team_id: int
    user_id: int
    status: str
    created_at: datetime
    updated_at: datetime


class JoinTeamRequest(BaseModel):
    """Join team request"""
    team_id: int


class ApproveJoinRequest(BaseModel):
    """Approve join request"""
    approved: bool


class TeamListResponse(BaseModel):
    """Team list response"""
    total: int
    items: List[TeamResponse]

class CreateReportRequest(BaseModel):
    """DTO для создания отчета команды"""
    title: str = Field(..., min_length=1, max_length=255, description="Заголовок отчета")
    content: str = Field(..., min_length=1, description="Содержание отчета")

class UpdateReportRequest(BaseModel):
    """DTO для обновления отчета команды"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)

class ReportResponse(BaseModel):
    """DTO для ответа с отчетом команды"""
    id: int
    team_id: int
    author_id: int
    title: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_name: Optional[str] = None
    
    class Config:
        from_attributes = True