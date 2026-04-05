from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from typing import List
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models import CatalogItem, RespondRequest
from routers.auth import _session_user_id
from routers.deps import require_couple
from ws import manager

router = APIRouter(prefix="/catalog", tags=["catalog"])
limiter = Limiter(key_func=get_remote_address)


@router.get("", response_model=List[CatalogItem])
async def get_catalog(request: Request, db: Connection = Depends(get_db)):
    await _session_user_id(request, db)
    cur = await db.execute(
        "SELECT id, title, category, description, emoji, tier FROM catalog_items ORDER BY RANDOM()"
    )
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


@router.get("/responses")
async def get_my_responses(request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)
    cur = await db.execute(
        "SELECT item_id, response FROM user_responses WHERE user_id = ?", (uid,)
    )
    rows = await cur.fetchall()
    return {str(r["item_id"]): r["response"] for r in rows}


@router.delete("/respond/{item_id}", status_code=204)
async def undo_response(item_id: int, request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)
    await require_couple(db, uid)
    await db.execute(
        "DELETE FROM user_responses WHERE user_id = ? AND item_id = ?",
        (uid, item_id),
    )
    await db.commit()


SPAM_WINDOW = 20       # look at last N responses
SPAM_THRESHOLD = 0.9   # 90 %+ same direction triggers alert
SPAM_COOLDOWN_H = 0    # unused — now checks for undismissed alerts instead


@router.post("/respond")
@limiter.limit("120/minute")
async def respond(body: RespondRequest, request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)
    await require_couple(db, uid)

    cur = await db.execute("SELECT id FROM catalog_items WHERE id = ?", (body.item_id,))
    item = await cur.fetchone()
    if not item:
        raise HTTPException(404, "Item not found")

    await db.execute(
        """INSERT INTO user_responses (user_id, item_id, response)
           VALUES (?,?,?)
           ON CONFLICT(user_id, item_id) DO UPDATE SET response=excluded.response, responded_at=datetime('now')""",
        (uid, body.item_id, body.response),
    )
    await db.commit()

    # ── Resolve couple / partner (shared by match check + spam detection) ────
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    user_row = await cur.fetchone()
    couple_id = user_row["couple_id"] if user_row else None

    partner_id = None
    if couple_id:
        cur = await db.execute("SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,))
        couple = await cur.fetchone()
        partner_id = couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]

    # ── Match detection ──────────────────────────────────────────────────────
    matched_item = None
    if body.response == "yes" and partner_id:
        cur = await db.execute(
            "SELECT 1 FROM user_responses WHERE user_id = ? AND item_id = ? AND response = 'yes'",
            (partner_id, body.item_id)
        )
        partner_yes = await cur.fetchone()
        if partner_yes:
            cur = await db.execute(
                "SELECT id, title, category, description, emoji, tier FROM catalog_items WHERE id = ?",
                (body.item_id,)
            )
            match_item = await cur.fetchone()
            if match_item:
                matched_item = {
                    "id": match_item["id"],
                    "title": match_item["title"],
                    "category": match_item["category"],
                    "description": match_item["description"],
                    "emoji": match_item["emoji"],
                    "tier": match_item["tier"],
                }
                await manager.broadcast(couple_id, {
                    "type": "match",
                    "triggered_by": uid,
                    "item": matched_item,
                })

    # ── Spam-swipe detection ─────────────────────────────────────────────────
    if couple_id and partner_id:
        cur = await db.execute(
            "SELECT response FROM user_responses WHERE user_id = ? ORDER BY responded_at DESC LIMIT ?",
            (uid, SPAM_WINDOW),
        )
        recent = [r["response"] for r in await cur.fetchall()]
        if len(recent) >= SPAM_WINDOW:
            yes_pct = recent.count("yes") / len(recent)
            no_pct  = recent.count("no")  / len(recent)
            dominant = None
            if yes_pct >= SPAM_THRESHOLD:
                dominant = "yes"
            elif no_pct >= SPAM_THRESHOLD:
                dominant = "no"

            if dominant:
                # Don't create a new alert if there's already an undismissed one
                cur = await db.execute(
                    """SELECT 1 FROM swipe_pattern_alerts
                       WHERE couple_id = ? AND about_user_id = ?
                         AND dismissed = 0""",
                    (couple_id, uid),
                )
                already_sent = await cur.fetchone()
                if not already_sent:
                    cur = await db.execute(
                        """INSERT INTO swipe_pattern_alerts (couple_id, about_user_id, pattern)
                           VALUES (?, ?, ?)""",
                        (couple_id, uid, dominant),
                    )
                    alert_id = cur.lastrowid
                    await db.commit()
                    # Get the spammer's display name for the alert
                    cur = await db.execute("SELECT display_name FROM users WHERE id = ?", (uid,))
                    swiper = await cur.fetchone()
                    await manager.broadcast(couple_id, {
                        "type": "swipe_pattern_alert",
                        "id": alert_id,
                        "about_user_id": uid,
                        "partner_name": swiper["display_name"] if swiper else "Your partner",
                        "pattern": dominant,
                    })

    if matched_item:
        return {"match": matched_item}
    return None


@router.get("/swipe-alerts")
async def get_swipe_alerts(request: Request, db: Connection = Depends(get_db)):
    """Return undismissed swipe-pattern alerts for the current user's partner."""
    uid = await _session_user_id(request, db)
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        return []
    couple_id = row["couple_id"]
    # Alerts about the *partner* (not about me) that I haven't dismissed
    cur = await db.execute(
        """SELECT spa.id, spa.pattern, spa.alerted_at, u.display_name AS partner_name, spa.about_user_id
           FROM swipe_pattern_alerts spa
           JOIN users u ON u.id = spa.about_user_id
           WHERE spa.couple_id = ? AND spa.about_user_id != ? AND spa.dismissed = 0
           ORDER BY spa.alerted_at DESC LIMIT 1""",
        (couple_id, uid),
    )
    alert = await cur.fetchone()
    return dict(alert) if alert else None


@router.post("/swipe-alerts/{alert_id}/dismiss", status_code=204)
async def dismiss_swipe_alert(alert_id: int, request: Request, db: Connection = Depends(get_db)):
    """Partner dismisses an alert about the other user's swipe pattern."""
    uid = await _session_user_id(request, db)
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        raise HTTPException(403, "Not paired")
    await db.execute(
        """UPDATE swipe_pattern_alerts SET dismissed = 1
           WHERE id = ? AND couple_id = ? AND about_user_id != ?""",
        (alert_id, row["couple_id"], uid),
    )
    await db.commit()
