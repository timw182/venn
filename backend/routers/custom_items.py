from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from aiosqlite import Connection
from database import get_db
from fastapi import Depends
from routers.auth import _session_user_id
from routers.deps import require_couple

router = APIRouter(prefix="/catalog/custom", tags=["catalog"])

# ── Word filter ───────────────────────────────────────────────
# Block genuinely harmful content; this is an adult app so normal kink terms are fine
_BLOCKED = {
    "minor", "minors", "child", "children", "underage", "kid", "kids",
    "teen", "teenager", "13", "14", "15", "16", "17",
    "lolita", "shota", "loli", "toddler", "baby", "infant",
    "rape", "snuff", "necro", "necrophilia", "bestiality", "zoo",
    "murder", "torture", "gore", "scat",
}

def _check(text: str) -> str:
    text = text.strip()
    if not text:
        raise HTTPException(400, "Can't be empty")
    if len(text) > 80:
        raise HTTPException(400, "Keep it under 80 characters")
    lower = text.lower()
    words = set(lower.replace(",", " ").replace(".", " ").split())
    hit = words & _BLOCKED
    if hit:
        raise HTTPException(400, "That content isn't allowed")
    return text


class CustomItemIn(BaseModel):
    title: str
    emoji: str = "✨"


@router.post("")
async def create_custom(body: CustomItemIn, request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    couple_id = await require_couple(db, uid)
    title = _check(body.title)
    emoji = body.emoji.strip() or "✨"
    cur = await db.execute(
        "INSERT INTO custom_catalog_items (couple_id, created_by, title, emoji, created_at) VALUES (?,?,?,?,datetime('now'))",
        (couple_id, uid, title, emoji)
    )
    await db.commit()
    return {
        "id": f"c{cur.lastrowid}",
        "title": title,
        "emoji": emoji,
        "category": "custom",
        "description": "",
        "tier": "standard",
    }


@router.get("")
async def list_custom(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    couple_id = await require_couple(db, uid)
    cur = await db.execute(
        "SELECT id, title, emoji FROM custom_catalog_items WHERE couple_id=? ORDER BY created_at ASC",
        (couple_id,)
    )
    rows = await cur.fetchall()
    return [
        {"id": f"c{r['id']}", "title": r["title"], "emoji": r["emoji"],
         "category": "custom", "description": "", "tier": "standard"}
        for r in rows
    ]
