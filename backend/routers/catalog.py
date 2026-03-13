from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from typing import List
import random

from database import get_db
from models import CatalogItem, RespondRequest
from routers.auth import _session_user_id

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("", response_model=List[CatalogItem])
async def get_catalog(db: Connection = Depends(get_db)):
    cur = await db.execute(
        "SELECT id, title, category, description, emoji, tier FROM catalog_items ORDER BY id"
    )
    rows = await cur.fetchall()
    result = [dict(r) for r in rows]
    random.shuffle(result)
    return result


@router.get("/responses")
async def get_my_responses(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    cur = await db.execute(
        "SELECT item_id, response FROM user_responses WHERE user_id = ?", (uid,)
    )
    rows = await cur.fetchall()
    return {str(r["item_id"]): r["response"] for r in rows}


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
