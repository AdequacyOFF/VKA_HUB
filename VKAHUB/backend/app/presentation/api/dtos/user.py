"""User DTOs"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RoleResponse(BaseModel):
    """Role response"""
    id: int
    name: str
    is_custom: bool


class SkillResponse(BaseModel):
    """Skill response"""
    id: int
    name: str
    is_custom: bool


class CertificateInfo(BaseModel):
    """Certificate information for user response"""
    id: int
    title: str
    category: Optional[str] = None
    issued_date: Optional[str] = None


class TeamInfo(BaseModel):
    """Team information for user response"""
    id: int
    name: str


class CompetitionInfo(BaseModel):
    """Competition information for user response"""
    id: int
    name: str


class UserResponse(BaseModel):
    """User response"""
    id: int
    login: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    study_group: Optional[str] = None
    position: Optional[str] = None
    rank: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    roles: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    certificates: Optional[List[CertificateInfo]] = None
    teams: Optional[List[TeamInfo]] = None
    competitions: Optional[List[CompetitionInfo]] = None
    is_moderator: bool | None = None
    is_banned: bool = False
    control_question: Optional[str] = None
    


class UpdateProfileRequest(BaseModel):
    """Update profile request"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    study_group: Optional[str] = None
    position: Optional[str] = None
    rank: Optional[str] = None
    avatar_url: Optional[str] = None
    control_question: Optional[str] = None
    control_answer: Optional[str] = None


class UpdateRolesSkillsRequest(BaseModel):
    """Update roles and skills request"""
    roles: List[str] = []
    skills: List[str] = []


class UserListResponse(BaseModel):
    """User list response"""
    total: int
    items: List[UserResponse]
    page: int
    page_size: int
