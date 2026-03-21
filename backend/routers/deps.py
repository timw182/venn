from fastapi import Depends, HTTPException, Request
from aiosqlite import Connection

from database import get_db


async def verify_session(request: Request, db: Connection = Depends(get_db)):
    """Validate session token matches DB — kicks out old devices on new login."""
    # Check cookie-based session (web)
    uid = request.session.get("user_id")
    token = request.session.get("session_token")
    # Fallback: token header (mobile)
    if not token:
        token = request.headers.get("X-Session-Token")
        if token:
            cur = await db.execute("SELECT id FROM users WHERE session_token = ?", (token,))
            row = await cur.fetchone()
            if not row:
                raise HTTPException(401, "Logged in on another device")
            return  # Token matches DB — valid
    if not uid or not token:
        return  # No session or legacy session without token — skip
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
