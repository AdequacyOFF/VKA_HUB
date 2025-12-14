"""Report domain entity"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any


@dataclass
class ReportEntity:
    """Report domain entity"""

    id: int
    registration_id: int
    summary: str
    technologies_used: Optional[str]
    individual_contributions: Optional[str]
    team_evaluation: Optional[str]
    problems_faced: Optional[str]
    attachments: Optional[Dict[str, Any]]
    submitted_by: Optional[int]
    submitted_at: datetime
