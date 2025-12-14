"""Authentication DTOs"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    """Registration request"""
    login: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)
    password_confirm: str = Field(..., min_length=6)

    @field_validator('password_confirm')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('Passwords do not match')
        return v


class LoginRequest(BaseModel):
    """Login request"""
    login: str
    password: str


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


class RefreshRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class RecoverPasswordRequest(BaseModel):
    """Password recovery request"""
    login: str
    control_answer: str
    new_password: str = Field(..., min_length=6)
    new_password_confirm: str = Field(..., min_length=6)

    @field_validator('new_password_confirm')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('Passwords do not match')
        return v


class GetControlQuestionResponse(BaseModel):
    """Control question response"""
    login: str
    control_question: str
