"""JWT token creation and validation"""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from jose import JWTError, jwt

from app.config import get_settings

settings = get_settings()


def create_access_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token (typically user_id and login)

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create a JWT refresh token.

    Args:
        data: Data to encode in the token (typically user_id and login)

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT token string to decode

    Returns:
        Decoded token payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def verify_token_type(payload: Dict[str, Any], expected_type: str) -> bool:
    """
    Verify that the token is of the expected type (access or refresh).

    Args:
        payload: Decoded token payload
        expected_type: Expected token type ("access" or "refresh")

    Returns:
        True if token type matches, False otherwise
    """
    token_type = payload.get("type")
    return token_type == expected_type
