"""FastAPI main application"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pathlib import Path

from app.config import get_settings, logging as log_config
from app.presentation.api.routers import (
    auth_router,
    users_router,
    teams_router,
    competitions_router,
    certificates_router,
    reports_router,
    moderator_router,
    public_router
)
from app.presentation.middlewares.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    sqlalchemy_exception_handler,
    pydantic_validation_exception_handler,
    general_exception_handler
)

# Setup logging
log_config.setup_logging()

# Get settings
settings = get_settings()

# Create FastAPI app
app = FastAPI(
    title="VKAHUB API",
    description="Competition Management Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(ValidationError, pydantic_validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Mount static files
static_dir = Path(settings.UPLOAD_DIR)
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir.parent)), name="static")

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(teams_router)
app.include_router(competitions_router)
app.include_router(certificates_router)
app.include_router(reports_router)
app.include_router(moderator_router)
app.include_router(public_router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "VKAHUB API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.on_event("startup")
async def startup_event():
    """Startup event - create upload directories and initialize default user"""
    # Create upload directories
    upload_dirs = [
        "avatars",
        "team_images",
        "competition_images",
        "certificates",
        "reports_captains",
        "reports_generated"
    ]

    for dir_name in upload_dirs:
        dir_path = Path(settings.UPLOAD_DIR) / dir_name
        dir_path.mkdir(parents=True, exist_ok=True)

    print("✅ Upload directories created")

    # Initialize default system user
    from app.infrastructure.init_default_user import init_default_user
    await init_default_user()

    print(f"✅ VKAHUB API started on http://0.0.0.0:8000")
    print(f"📚 API Documentation: http://0.0.0.0:8000/docs")
