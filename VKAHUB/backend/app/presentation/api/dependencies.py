"""API dependencies"""

from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db import get_db
from app.infrastructure.security.permissions import get_current_user, require_moderator

__all__ = ["get_db", "get_current_user", "require_moderator"]
