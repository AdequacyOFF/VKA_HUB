"""API routers"""

from .auth import router as auth_router
from .users import router as users_router
from .teams import router as teams_router
from .competitions import router as competitions_router
from .certificates import router as certificates_router
from .reports import router as reports_router
from .moderator import router as moderator_router
from .public import router as public_router

__all__ = [
    "auth_router",
    "users_router",
    "teams_router",
    "competitions_router",
    "certificates_router",
    "reports_router",
    "moderator_router",
    "public_router",
]
