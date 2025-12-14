"""Moderator DTOs"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AssignModeratorRequest(BaseModel):
    """Assign moderator request"""
    user_id: int


class RemoveModeratorRequest(BaseModel):
    """Remove moderator request"""
    user_id: int


class ModeratorResponse(BaseModel):
    """Moderator response"""
    id: int
    user_id: int
    assigned_by: int
    assigned_at: datetime



class UpdateUserLoginRequest(BaseModel):
    login: str

class ResetUserPasswordRequest(BaseModel):
    new_password: str

class UpdateControlQuestionRequest(BaseModel):
    control_question: str
    control_answer: str

class BanUserRequest(BaseModel):
    reason: Optional[str] = None

class UnbanUserRequest(BaseModel):
    reason: Optional[str] = None


class UserSecurityInfoResponse(BaseModel):
    """Response with user's sensitive security information (moderators only)"""
    id: int
    login: str
    control_question: Optional[str] = None
    # Примечание: пароль и ответ в открытом виде не хранятся в базе!
    # Мы можем вернуть только факт наличия/возможность сброса

    has_password: bool = True  # Всегда true, так как пользователь без пароля не может войти
    has_control_answer: bool = False
    password_last_changed: Optional[datetime] = None
    security_setup_date: Optional[datetime] = None

    class Config:
        from_attributes = True


# ========================================
# User Complaint DTOs
# ========================================

class UserComplaintResponse(BaseModel):
    """User complaint response for frontend"""
    id: int
    reporter: str  # reporter login/name
    target: str    # target login/name
    reason: str
    description: str
    status: str    # 'pending', 'resolved', 'rejected'
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CreateUserComplaintRequest(BaseModel):
    """Create user complaint request"""
    target_id: int
    reason: str
    description: str


# ========================================
# Analytics DTOs
# ========================================

class UserGrowthDataPoint(BaseModel):
    """Single data point for user growth chart"""
    month: str
    users: int


class TeamStatsDataPoint(BaseModel):
    """Single data point for team stats chart"""
    month: str
    teams: int


class CompetitionTypeDataPoint(BaseModel):
    """Single data point for competition type pie chart"""
    name: str
    value: int


class AnalyticsResponse(BaseModel):
    """Analytics data response"""
    userGrowth: list[UserGrowthDataPoint]
    teamStats: list[TeamStatsDataPoint]
    competitionTypes: list[CompetitionTypeDataPoint]