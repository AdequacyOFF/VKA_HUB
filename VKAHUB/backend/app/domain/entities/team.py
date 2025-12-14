"""Team domain entity"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class TeamEntity:
    """Team domain entity"""

    id: int
    name: str
    description: Optional[str]
    image_url: Optional[str]
    captain_id: Optional[int]
    created_at: datetime
    updated_at: datetime
