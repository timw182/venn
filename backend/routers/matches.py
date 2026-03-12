from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from typing import List

from database import get_db
from models import MatchItem
from routers.auth import _session_user_id

router = APIRouter(prefix="/matches", tags=["matches"])


async def _require_couple(db: Connection, uid: int) -> int:
    row = await db.execute_fetchone("SELECT couple_id FROM users WHERE id = ?", (uid,))
    if not row or not row["couple_id"]:
        raise HTTPException(403, "Not paired")
    return row["couple_id"]


async def _get_partner_id(db: Connection, uid: int, couple_id: int) -> int:
    couple = await db.execute_fetchone(
        "SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,)
    )
    return couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]


@router.get("", response_model=List[MatchItem])
async def get_matches(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    couple_id = await _require_couple(db, uid)
    partner_id = await _get_partner_id(db, uid, couple_id)

    # Items where BOTH said yes — never expose what partner said no/maybe to
    rows = await db.execute_fetchall(
        """
        SELECT
            ci.id, ci.title, ci.category, ci.description, ci.emoji, ci.tier,
            MAX(ur.responded_at) AS matched_at,
            CASE WHEN ms.item_id IS NOT NULL THEN 1 ELSE 0 END AS seen
        FROM user_responses ur
        JOIN catalog_items ci ON ci.id = ur.item_id
        LEFT JOIN match_seen ms ON ms.item_id = ci.id AND ms.user_id = ?
        WHERE ur.response = 'yes'
          AND ur.item_id IN (
              SELECT item_id FROM user_responses
              WHERE user_id = ? AND response = 'yes'
          )
          AND ur.user_id IN (?, ?)
        GROUP BY ci.id
        HAVING COUNT(DISTINCT ur.user_id) = 2
        ORDER BY matched_at DESC
        """,
        (uid, partner_id, uid, partner_id),
    )

    return [
        MatchItem(
            id=r["id"],
            title=r["title"],
            category=r["category"],
            description=r["description"],
            emoji=r["emoji"],
            tier=r["tier"],
            matched_at=r["matched_at"],
            seen=bool(r["seen"]),
        )
        for r in rows
    ]


@router.post("/{item_id}/seen", status_code=204)
async def mark_seen(item_id: int, request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    await _require_couple(db, uid)

    await db.execute(
        "INSERT OR IGNORE INTO match_seen (user_id, item_id) VALUES (?,?)",
        (uid, item_id),
    )
    await db.commit()
