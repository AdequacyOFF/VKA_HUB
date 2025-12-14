"""User domain entity"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List


@dataclass
class UserEntity:
    """User domain entity"""

    id: int
    login: str
    first_name: Optional[str]
    last_name: Optional[str]
    middle_name: Optional[str]
    study_group: Optional[str]
    position: Optional[str]
    rank: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    @property
    def full_name(self) -> str:
        """Get full name"""
        parts = [self.last_name, self.first_name, self.middle_name]
        return " ".join(part for part in parts if part)
