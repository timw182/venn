from pydantic import BaseModel, field_validator
from typing import Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 32:
            raise ValueError("Username must be 2–32 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("display_name")
    @classmethod
    def display_name_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Display name is required")
        return v[:40]


class LoginRequest(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_color: str
    couple_id: Optional[int]
    partner_name: Optional[str] = None


# ── Pairing ───────────────────────────────────────────────────────────────────

class PairingCodeOut(BaseModel):
    code: str


class JoinRequest(BaseModel):
    code: str


# ── Catalog ───────────────────────────────────────────────────────────────────

class CatalogItem(BaseModel):
    id: int
    title: str
    category: str
    description: str
    emoji: str
    tier: str


class RespondRequest(BaseModel):
    item_id: int
    response: str

    @field_validator("response")
    @classmethod
    def response_valid(cls, v: str) -> str:
        if v not in ("yes", "no", "maybe"):
            raise ValueError("Response must be yes, no, or maybe")
        return v


# ── Matches ───────────────────────────────────────────────────────────────────

class MatchItem(BaseModel):
    id: int
    title: str
    category: str
    description: str
    emoji: str
    tier: str
    matched_at: str
    seen: bool


# ── Mood ──────────────────────────────────────────────────────────────────────

class MoodRequest(BaseModel):
    mood: str
    expires_hours: int = 8

    @field_validator("expires_hours")
    @classmethod
    def expires_valid(cls, v: int) -> int:
        if v < 1 or v > 48:
            raise ValueError("expires_hours must be 1–48")
        return v


class MoodOut(BaseModel):
    mine: Optional[str]
    partner: Optional[str]   # only set when both have active moods
