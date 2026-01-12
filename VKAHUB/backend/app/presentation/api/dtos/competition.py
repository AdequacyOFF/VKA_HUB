"""Competition DTOs"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import date, datetime


class CompetitionStageRequest(BaseModel):
    """Competition stage request"""
    stage_number: int = Field(..., ge=1)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: date
    end_date: date


class CompetitionCaseRequest(BaseModel):
    """Competition case request for hackathons"""
    case_number: int = Field(..., ge=1)
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    knowledge_stack: List[str] = Field(..., min_items=1)


class CreateCompetitionRequest(BaseModel):
    """Create competition request"""
    type: str = Field(..., pattern="^(hackathon|CTF|other)$")
    name: str = Field(..., min_length=1, max_length=255)
    link: Optional[str] = None
    image_url: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    description: Optional[str] = None
    other_type_description: Optional[str] = Field(None, max_length=255)
    organizer: str = Field(..., min_length=1, max_length=500)  # Required organizer field
    min_team_size: int = Field(default=2, ge=1, le=10)
    max_team_size: int = Field(default=5, ge=1, le=10)
    case_file_url: Optional[str] = None
    tasks_file_url: Optional[str] = None
    stages: List[CompetitionStageRequest] = Field(default_factory=list)
    cases: List[CompetitionCaseRequest] = Field(default_factory=list)

    @field_validator('start_date', 'end_date', 'registration_deadline')
    @classmethod
    def validate_datetimes(cls, v):
        if v is not None and v.tzinfo is not None:
            # Convert timezone-aware datetime to naive datetime in UTC
            return v.replace(tzinfo=None)
        return v

    @field_validator('max_team_size')
    @classmethod
    def validate_team_size(cls, v, info):
        if 'min_team_size' in info.data and v < info.data['min_team_size']:
            raise ValueError('max_team_size must be greater than or equal to min_team_size')
        return v

    @field_validator('cases')
    @classmethod
    def validate_cases(cls, v, info):
        if 'type' in info.data and info.data['type'] == 'hackathon' and not v:
            raise ValueError('Hackathon competitions must have at least one case')
        if 'type' in info.data and info.data['type'] != 'hackathon' and v:
            raise ValueError('Only hackathon competitions can have cases')
        return v

    @field_validator('other_type_description')
    @classmethod
    def validate_other_description(cls, v, info):
        if 'type' in info.data and info.data['type'] == 'other' and not v:
            raise ValueError('other_type_description is required for "other" type competitions')
        return v


class CompetitionStageResponse(BaseModel):
    """Competition stage response"""
    id: int
    competition_id: int
    stage_number: int
    name: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime


class CompetitionCaseResponse(BaseModel):
    """Competition case response"""
    id: int
    competition_id: int
    case_number: int
    title: str
    description: str
    knowledge_stack: List[str]
    created_at: datetime
    updated_at: datetime


class UpdateCompetitionRequest(BaseModel):
    """Update competition request"""
    type: Optional[str] = Field(None, pattern="^(hackathon|CTF|other)$")
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    link: Optional[str] = None
    image_url: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    registration_deadline: Optional[datetime] = None
    description: Optional[str] = None
    other_type_description: Optional[str] = Field(None, max_length=255)
    organizer: Optional[str] = Field(None, min_length=1, max_length=500)
    min_team_size: Optional[int] = Field(None, ge=1, le=10)
    max_team_size: Optional[int] = Field(None, ge=1, le=10)
    case_file_url: Optional[str] = None
    tasks_file_url: Optional[str] = None
    stages: Optional[List[CompetitionStageRequest]] = None
    cases: Optional[List[CompetitionCaseRequest]] = None

    @field_validator('start_date', 'end_date', 'registration_deadline')
    @classmethod
    def validate_datetimes(cls, v):
        if v is not None and v.tzinfo is not None:
            # Convert timezone-aware datetime to naive datetime in UTC
            return v.replace(tzinfo=None)
        return v


class CompetitionResponse(BaseModel):
    """Competition response"""
    id: int
    type: str
    name: str
    link: Optional[str] = None
    image_url: Optional[str] = None
    start_date: datetime
    end_date: datetime
    registration_deadline: datetime
    description: Optional[str] = None
    other_type_description: Optional[str] = None
    organizer: Optional[str] = None
    min_team_size: int
    max_team_size: int
    case_file_url: Optional[str] = None
    tasks_file_url: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    stages: List[CompetitionStageResponse] = []
    cases: List[CompetitionCaseResponse] = []


class ApplyToCompetitionRequest(BaseModel):
    """Apply to competition request"""
    team_id: int
    member_ids: List[int] = Field(..., min_items=1)
    case_id: Optional[int] = None  # Required for hackathon competitions
    address: Optional[str] = None  # Location where team will participate from


class TeamMemberResponse(BaseModel):
    """Team member response for registration"""
    id: int
    user_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class RegistrationResponse(BaseModel):
    """Registration response"""
    id: int
    competition_id: int
    team_id: int
    status: str
    result: Optional[str] = None
    address: Optional[str] = None
    applied_at: datetime
    team_members: List[TeamMemberResponse] = []
