"""Competition domain entity"""

from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional


@dataclass
class CompetitionEntity:
    """Competition domain entity"""

    id: int
    type: str
    name: str
    link: Optional[str]
    image_url: Optional[str]
    start_date: date
    end_date: date
    registration_deadline: date
    description: Optional[str]
    case_file_url: Optional[str]
    tasks_file_url: Optional[str]
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime
