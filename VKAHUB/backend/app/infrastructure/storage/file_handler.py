"""File upload handling"""

import os
import uuid
from pathlib import Path
from typing import List
from fastapi import UploadFile, HTTPException, status

from app.config import get_settings

settings = get_settings()


async def save_file(file: UploadFile, category: str) -> str:
    """
    Save uploaded file to appropriate directory.

    Args:
        file: Uploaded file
        category: Category (avatars, team_images, etc.)

    Returns:
        File URL path
    """
    # Validate file size
    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {settings.MAX_UPLOAD_SIZE_MB}MB limit"
        )

    # Reset file pointer
    await file.seek(0)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / category
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save file
    file_path = upload_dir / unique_filename
    with open(file_path, "wb") as f:
        f.write(content)

    # Return URL path
    return f"/static/uploads/{category}/{unique_filename}"


def delete_file(file_url: str) -> bool:
    """
    Delete file from disk.

    Args:
        file_url: File URL path

    Returns:
        True if deleted, False if not found
    """
    if not file_url or not file_url.startswith("/static/uploads/"):
        return False

    # Convert URL to file path
    file_path = Path(file_url.replace("/static/uploads/", f"{settings.UPLOAD_DIR}/"))

    if file_path.exists():
        file_path.unlink()
        return True

    return False


def validate_file_type(file: UploadFile, allowed_extensions: List[str]) -> bool:
    """
    Validate file type.

    Args:
        file: Uploaded file
        allowed_extensions: List of allowed extensions

    Returns:
        True if valid

    Raises:
        HTTPException: If file type not allowed
    """
    file_extension = Path(file.filename).suffix.lstrip(".")

    if file_extension.lower() not in [ext.lower() for ext in allowed_extensions]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type .{file_extension} not allowed. Allowed types: {', '.join(allowed_extensions)}"
        )

    return True
