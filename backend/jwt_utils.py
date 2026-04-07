import hashlib
import secrets
from datetime import datetime, timezone, timedelta

import jwt

ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: int, secret: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, secret, algorithm="HS256")


def decode_access_token(token: str, secret: str) -> int:
    """Decode and validate a JWT access token. Returns user_id or raises."""
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
    if payload.get("type") != "access":
        raise ValueError("Invalid token type")
    return int(payload["sub"])


def create_refresh_token() -> tuple[str, str]:
    """Generate a refresh token. Returns (raw_token, sha256_hash)."""
    raw = secrets.token_hex(48)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    return raw, token_hash
