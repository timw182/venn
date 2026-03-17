from ws import manager
from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from datetime import datetime, timedelta, timezone

from database import get_db
from models import MoodRequest, MoodOut
from routers.auth import _session_user_id
from routers.deps import require_couple, get_partner_id

router = APIRouter(prefix="/mood", tags=["mood"])


def _active_mood(row) -> str | None:
    if not row:
        return None
    expires = datetime.fromisoformat(row["expires_at"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        return None
    return row["mood"]


@router.put("", response_model=MoodOut)
async def set_mood(body: MoodRequest, request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    couple_id = await require_couple(db, uid)
    partner_id = await get_partner_id(db, uid, couple_id)

    expires_at = (
        datetime.now(timezone.utc) + timedelta(hours=body.expires_hours)
    ).isoformat()

    # Rate-limit: only allow change every 5 minutes
    cur = await db.execute(
        "SELECT updated_at FROM user_mood WHERE user_id = ?", (uid,)
    )
    existing = await cur.fetchone()
    if existing and existing["updated_at"]:
        last_update = datetime.fromisoformat(existing["updated_at"])
        if last_update.tzinfo is None:
            last_update = last_update.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - last_update).total_seconds()
        if elapsed < 300:
            wait = int(300 - elapsed)
            raise HTTPException(429, f"Wait {wait} seconds before changing your mood again.")

    await db.execute(
        """INSERT INTO user_mood (user_id, mood, expires_at)
           VALUES (?,?,?)
           ON CONFLICT(user_id) DO UPDATE SET mood=excluded.mood, expires_at=excluded.expires_at, updated_at=datetime('now')""",
        (uid, body.mood, expires_at),
    )
    await db.commit()

    # Broadcast mood update to couple room
    await manager.broadcast(couple_id, {
        "type": "mood_update",
        "mood": body.mood,
        "from_user_id": uid,
    })

    cur = await db.execute(
        "SELECT mood, expires_at FROM user_mood WHERE user_id = ?", (partner_id,)
    )
    partner_row = await cur.fetchone()
    partner_mood = _active_mood(partner_row)

    return MoodOut(
        mine=body.mood,
        partner=partner_mood,
    )


@router.get("", response_model=MoodOut)
async def get_mood(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    couple_id = await require_couple(db, uid)
    partner_id = await get_partner_id(db, uid, couple_id)

    cur = await db.execute(
        "SELECT mood, expires_at FROM user_mood WHERE user_id = ?", (uid,)
    )
    my_row = await cur.fetchone()
    cur = await db.execute(
        "SELECT mood, expires_at FROM user_mood WHERE user_id = ?", (partner_id,)
    )
    partner_row = await cur.fetchone()

    my_mood = _active_mood(my_row)
    partner_mood = _active_mood(partner_row)

    return MoodOut(
        mine=my_mood,
        partner=partner_mood,
    )


@router.delete("", status_code=204)
async def clear_mood(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    await db.execute("DELETE FROM user_mood WHERE user_id = ?", (uid,))
    await db.commit()

@router.put("/message")
async def set_custom_message(request: Request, db: Connection = Depends(get_db)):
    """Set a free-text message visible to partner (separate from mood emoji)."""
    from fastapi import Body
    import json
    body_bytes = await request.body()
    try:
        body = json.loads(body_bytes)
        message = body.get("message", "").strip()
    except Exception:
        raise HTTPException(400, "Invalid body")

    if not message:
        raise HTTPException(400, "Message required")
    if len(message) > 120:
        raise HTTPException(400, "Max 120 characters")

    uid = _session_user_id(request)
    couple_id = await require_couple(db, uid)

    # Upsert into user_mood keeping existing mood, just update custom_message
    await db.execute(
        """INSERT INTO user_mood (user_id, custom_message, expires_at)
           VALUES (?, ?, datetime('now', '+24 hours'))
           ON CONFLICT(user_id) DO UPDATE SET custom_message=excluded.custom_message, updated_at=datetime('now')""",
        (uid, message)
    )
    await db.commit()

    # Broadcast to partner
    await manager.broadcast(couple_id, {
        "type": "custom_message",
        "message": message,
        "from_user_id": uid,
    })

    return {"ok": True}


@router.get("/message")
async def get_partner_message(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    couple_id = await require_couple(db, uid)
    partner_id = await get_partner_id(db, uid, couple_id)

    cur = await db.execute(
        "SELECT custom_message FROM user_mood WHERE user_id=?", (partner_id,)
    )
    row = await cur.fetchone()
    return {"message": row["custom_message"] if row else None}
