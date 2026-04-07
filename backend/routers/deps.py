import os
from fastapi import Depends, HTTPException, Request
from aiosqlite import Connection

from database import get_db
from jwt_utils import decode_access_token

SECRET_KEY = os.environ.get("SECRET_KEY", "")


async def resolve_user_id(request: Request, db: Connection) -> int | None:
    """Try to resolve user_id from cookie session, Bearer JWT, or X-Session-Token."""
    # 1. Cookie session (web)
    uid = request.session.get("user_id")
    if uid:
        return uid

    # 2. Already resolved by middleware
    if hasattr(request.state, "user_id"):
        return request.state.user_id

    # 3. Bearer JWT (mobile)
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        try:
            uid = decode_access_token(token, SECRET_KEY)
            request.state.user_id = uid
            return uid
        except ValueError:
            raise HTTPException(401, "Invalid or expired token")

    # 4. Legacy X-Session-Token header (mobile, deprecated)
    token = request.headers.get("X-Session-Token")
    if token:
        cur = await db.execute("SELECT id FROM users WHERE session_token = ?", (token,))
        row = await cur.fetchone()
        if row:
            request.state.user_id = row["id"]
            return row["id"]

    return None


async def verify_session(request: Request, db: Connection = Depends(get_db)):
    """Validate auth via cookie, Bearer JWT, or X-Session-Token."""
    uid = await resolve_user_id(request, db)
    if not uid:
        raise HTTPException(401, "Not authenticated")

    # For cookie sessions, verify the session_token still matches DB
    token = request.session.get("session_token")
    if token:
        cur = await db.execute("SELECT session_token FROM users WHERE id = ?", (uid,))
        row = await cur.fetchone()
        if row and row["session_token"] and row["session_token"] != token:
            request.session.clear()
            raise HTTPException(401, "Logged in on another device")


async def require_couple(db: Connection, uid: int) -> int:
    """Return couple_id for the user, or raise 403 if not paired."""
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        raise HTTPException(403, "Not paired")
    return row["couple_id"]


async def get_partner_id(db: Connection, uid: int, couple_id: int) -> int:
    """Return the partner's user ID within the couple."""
    cur = await db.execute(
        "SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,)
    )
    couple = await cur.fetchone()
    return couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]
