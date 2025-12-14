"""Application settings using Pydantic Settings"""

from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    DATABASE_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Upload Configuration
    UPLOAD_DIR: str = "./static/uploads"
    MAX_UPLOAD_SIZE_MB: int = 50
    ALLOWED_IMAGE_EXTENSIONS: str = "jpg,jpeg,png,gif"
    ALLOWED_DOCUMENT_EXTENSIONS: str = "pdf,docx,doc"

    # Application
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:3000"

    # Computed properties
    @property
    def allowed_image_extensions_list(self) -> List[str]:
        """Get list of allowed image extensions"""
        return [ext.strip() for ext in self.ALLOWED_IMAGE_EXTENSIONS.split(",")]

    @property
    def allowed_document_extensions_list(self) -> List[str]:
        """Get list of allowed document extensions"""
        return [ext.strip() for ext in self.ALLOWED_DOCUMENT_EXTENSIONS.split(",")]

    @property
    def cors_origins_list(self) -> List[str]:
        """Get list of CORS origins"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        """Get max upload size in bytes"""
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
