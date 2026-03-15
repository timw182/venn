from fastapi import APIRouter, Request, HTTPException
from aiosqlite import Connection
from database import get_db_ctx as get_db
from routers.auth import _session_user_id
from ws import manager
import json

router = APIRouter(prefix="/reset", tags=["reset"])


async def _get_couple(db, uid):
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        raise HTTPException(403, "Not in a couple")
    couple_id = row["couple_id"]
    cur = await db.execute("SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,))
    couple = await cur.fetchone()
    partner_id = couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]
    return couple_id, partner_id


@router.get("/status")
async def reset_status(request: Request):
    uid = _session_user_id(request)
    async with get_db() as db:
        couple_id, partner_id = await _get_couple(db, uid)
        cur = await db.execute(
            "SELECT requested_by, status FROM reset_requests WHERE couple_id = ? ORDER BY created_at DESC LIMIT 1",
            (couple_id,)
        )
        row = await cur.fetchone()
    if not row or row["status"] == "declined":
        return {"status": "none"}
    return {"status": row["status"], "requested_by_me": row["requested_by"] == uid}


@router.post("/request")
async def request_reset(request: Request):
    uid = _session_user_id(request)
    async with get_db() as db:
        couple_id, partner_id = await _get_couple(db, uid)

        # Cancel any existing request first
        await db.execute("DELETE FROM reset_requests WHERE couple_id = ?", (couple_id,))
        await db.execute(
            "INSERT INTO reset_requests (couple_id, requested_by, status) VALUES (?, ?, 'pending')",
            (couple_id, uid)
        )
        await db.commit()

    await manager.broadcast(couple_id, {"type": "reset_requested", "by": uid})
    return {"ok": True}


@router.post("/confirm")
async def confirm_reset(request: Request):
    uid = _session_user_id(request)
    async with get_db() as db:
        couple_id, partner_id = await _get_couple(db, uid)

        cur = await db.execute(
            "SELECT requested_by FROM reset_requests WHERE couple_id = ? AND status = 'pending'",
            (couple_id,)
        )
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "No pending reset request")
        if row["requested_by"] == uid:
            raise HTTPException(400, "Cannot confirm your own reset request")

        # Execute the reset
        await db.execute(
            "DELETE FROM user_responses WHERE user_id IN (SELECT user_a_id FROM couples WHERE id = ?) OR user_id IN (SELECT user_b_id FROM couples WHERE id = ?)",
            (couple_id, couple_id)
        )
        await db.execute(
            "DELETE FROM match_seen WHERE user_id IN (SELECT user_a_id FROM couples WHERE id = ?) OR user_id IN (SELECT user_b_id FROM couples WHERE id = ?)",
            (couple_id, couple_id)
        )
        await db.execute("DELETE FROM reset_requests WHERE couple_id = ?", (couple_id,))
        await db.commit()

    await manager.broadcast(couple_id, {"type": "reset_done"})
    return {"ok": True}


@router.post("/decline")
async def decline_reset(request: Request):
    uid = _session_user_id(request)
    async with get_db() as db:
        couple_id, partner_id = await _get_couple(db, uid)
        await db.execute(
            "UPDATE reset_requests SET status = 'declined' WHERE couple_id = ? AND status = 'pending'",
            (couple_id,)
        )
        await db.commit()

    await manager.broadcast(couple_id, {"type": "reset_declined"})
    return {"ok": True}


@router.post("/cancel")
async def cancel_reset(request: Request):
    uid = _session_user_id(request)
    async with get_db() as db:
        couple_id, partner_id = await _get_couple(db, uid)
        await db.execute("DELETE FROM reset_requests WHERE couple_id = ? AND requested_by = ?", (couple_id, uid))
        await db.commit()

    await manager.broadcast(couple_id, {"type": "reset_cancelled"})
    return {"ok": True}
