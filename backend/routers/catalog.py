from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from typing import List

from database import get_db
from models import CatalogItem, RespondRequest
from routers.auth import _session_user_id
from ws import manager

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=List[CatalogItem])
async def get_catalog(db: Connection = Depends(get_db)):
    cur = await db.execute(
        "SELECT id, title, category, description, emoji, tier FROM catalog_items ORDER BY RANDOM()"
    )
    rows = await cur.fetchall()
    return [dict(r) for r in rows]


@router.get("/responses")
async def get_my_responses(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    cur = await db.execute(
        "SELECT item_id, response FROM user_responses WHERE user_id = ?", (uid,)
    )
    rows = await cur.fetchall()
    return {str(r["item_id"]): r["response"] for r in rows}


@router.delete("/respond/{item_id}", status_code=204)
async def undo_response(item_id: int, request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    await db.execute(
        "DELETE FROM user_responses WHERE user_id = ? AND item_id = ?",
        (uid, item_id),
    )
    await db.commit()


@router.post("/respond", status_code=204)
async def respond(body: RespondRequest, request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)

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

    # Check if this created a new match — broadcast to couple if so
    if body.response == "yes":
        cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
        user_row = await cur.fetchone()
        if user_row and user_row["couple_id"]:
            couple_id = user_row["couple_id"]
            # Get partner id
            cur = await db.execute("SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,))
            couple = await cur.fetchone()
            partner_id = couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]
            # Check if partner also said yes to this item
            cur = await db.execute(
                "SELECT 1 FROM user_responses WHERE user_id = ? AND item_id = ? AND response = 'yes'",
                (partner_id, body.item_id)
            )
            partner_yes = await cur.fetchone()
            if partner_yes:
                # It's a match! Get the item details and broadcast
                cur = await db.execute(
                    "SELECT id, title, category, description, emoji, tier FROM catalog_items WHERE id = ?",
                    (body.item_id,)
                )
                match_item = await cur.fetchone()
                if match_item:
                    await manager.broadcast(couple_id, {
                        "type": "match",
                        "triggered_by": uid,
                        "item": {
                            "id": match_item["id"],
                            "title": match_item["title"],
                            "category": match_item["category"],
                            "description": match_item["description"],
                            "emoji": match_item["emoji"],
                            "tier": match_item["tier"],
                        }
                    })
