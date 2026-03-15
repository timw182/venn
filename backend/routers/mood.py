from ws import manager
from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from datetime import datetime, timedelta, timezone

from database import get_db
from models import MoodRequest, MoodOut
from routers.auth import _session_user_id

router = APIRouter(prefix="/mood", tags=["mood"])


async def _require_couple(db: Connection, uid: int) -> int:
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        raise HTTPException(403, "Not paired")
    return row["couple_id"]


async def _get_partner_id(db: Connection, uid: int, couple_id: int) -> int:
    cur = await db.execute(
        "SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,)
    )
    couple = await cur.fetchone()
    return couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]


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
    couple_id = await _require_couple(db, uid)
    partner_id = await _get_partner_id(db, uid, couple_id)

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
    couple_id = await _require_couple(db, uid)
    partner_id = await _get_partner_id(db, uid, couple_id)

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
