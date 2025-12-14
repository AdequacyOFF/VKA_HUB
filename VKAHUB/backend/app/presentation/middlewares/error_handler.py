"""Global error handler middleware"""

import logging
import traceback
from datetime import date, datetime
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


def serialize_value(value):
    """Convert non-JSON-serializable values to JSON-serializable format"""
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    elif isinstance(value, bytes):
        return value.decode('utf-8', errors='replace')
    return value


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.method} {request.url.path}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.warning(f"Validation error: {exc.errors()} - {request.method} {request.url.path}")

    # Convert errors to JSON-serializable format
    errors = []
    for error in exc.errors():
        error_dict = {}
        for key, value in error.items():
            error_dict[key] = serialize_value(value)
        errors.append(error_dict)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Ошибка валидации данных",
            "errors": errors
        }
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle SQLAlchemy database errors"""
    logger.error(f"Database error: {str(exc)} - {request.method} {request.url.path}")
    logger.error(traceback.format_exc())

    # Check if it's an integrity error (unique constraint, foreign key, etc.)
    if isinstance(exc, IntegrityError):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "Нарушение ограничений базы данных. Возможно, запись уже существует."}
        )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Ошибка базы данных. Пожалуйста, попробуйте позже."}
    )


async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors"""
    logger.warning(f"Pydantic validation error: {exc.errors()} - {request.method} {request.url.path}")

    # Convert errors to JSON-serializable format
    errors = []
    for error in exc.errors():
        error_dict = {}
        for key, value in error.items():
            error_dict[key] = serialize_value(value)
        errors.append(error_dict)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Ошибка валидации данных",
            "errors": errors
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)} - {request.method} {request.url.path}")
    logger.error(traceback.format_exc())

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Внутренняя ошибка сервера. Пожалуйста, попробуйте позже.",
            "error": str(exc) if logger.level == logging.DEBUG else None
        }
    )
