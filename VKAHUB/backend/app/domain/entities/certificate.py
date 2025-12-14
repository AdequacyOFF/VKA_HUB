"""Certificate domain entity"""

from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional


@dataclass
class CertificateEntity:
    """Certificate domain entity"""

    id: int
    user_id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    date: Optional[date]
    file_url: str
    created_at: datetime
    updated_at: datetime
