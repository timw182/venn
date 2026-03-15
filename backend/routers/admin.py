
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from aiosqlite import Connection
from database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


async def _require_admin(request: Request, db: Connection = Depends(get_db)):
    uid = request.session.get("user_id")
    if not uid:
        raise HTTPException(401, "Not authenticated")
    cur = await db.execute("SELECT is_admin, is_superadmin FROM users WHERE id=?", (uid,))
    row = await cur.fetchone()
    if not row or not row["is_admin"]:
        raise HTTPException(403, "Admin access required")
    return {"uid": uid, "is_superadmin": bool(row["is_superadmin"])}


async def _require_superadmin(request: Request, db: Connection = Depends(get_db)):
    admin = await _require_admin(request, db)
    if not admin["is_superadmin"]:
        raise HTTPException(403, "Superadmin access required")
    return admin


# ── Stats ──────────────────────────────────────────────────────
@router.get("/stats")
async def get_stats(db: Connection = Depends(get_db), admin=Depends(_require_admin)):
    total_users   = (await (await db.execute("SELECT COUNT(*) FROM users")).fetchone())[0]
    paired_users  = (await (await db.execute("SELECT COUNT(*) FROM users WHERE couple_id IS NOT NULL")).fetchone())[0]
    total_swipes  = (await (await db.execute("SELECT COUNT(*) FROM responses")).fetchone())[0]
    total_matches = (await (await db.execute(
        "SELECT COUNT(*) FROM responses r1 JOIN responses r2 "
        "ON r1.item_id=r2.item_id AND r1.user_id!=r2.user_id "
        "WHERE r1.answer=1 AND r2.answer=1"
    )).fetchone())[0]
    open_tickets  = (await (await db.execute("SELECT COUNT(*) FROM tickets WHERE status='open'")).fetchone())[0]
    return {
        "total_users": total_users,
        "paired_users": paired_users,
        "total_swipes": total_swipes,
        "total_matches": total_matches // 2,
        "open_tickets": open_tickets,
    }


# ── Users ──────────────────────────────────────────────────────
@router.get("/users")
async def list_users(db: Connection = Depends(get_db), admin=Depends(_require_admin)):
    cur = await db.execute(
        "SELECT id, username, display_name, email, couple_id, created_at, is_admin, is_superadmin "
        "FROM users ORDER BY id DESC"
    )
    rows = await cur.fetchall()
    return [
        {
            "id": r["id"], "username": r["username"], "display_name": r["display_name"],
            "email": r["email"], "couple_id": r["couple_id"], "created_at": r["created_at"],
            "is_admin": bool(r["is_admin"]), "is_superadmin": bool(r["is_superadmin"]),
            "paired": r["couple_id"] is not None,
        }
        for r in rows
    ]


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: Connection = Depends(get_db), admin=Depends(_require_admin)):
    cur = await db.execute("SELECT is_superadmin FROM users WHERE id=?", (user_id,))
    row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "User not found")
    if row["is_superadmin"] and not admin["is_superadmin"]:
        raise HTTPException(403, "Cannot delete a superadmin")
    await db.execute("DELETE FROM responses WHERE user_id=?", (user_id,))
    await db.execute("DELETE FROM tickets WHERE user_id=?", (user_id,))
    await db.execute("UPDATE users SET couple_id=NULL WHERE id=?", (user_id,))
    await db.execute("DELETE FROM users WHERE id=?", (user_id,))
    await db.commit()
    return {"ok": True}


class AdminGrant(BaseModel):
    is_admin: bool


@router.patch("/users/{user_id}/admin")
async def set_admin(user_id: int, body: AdminGrant, db: Connection = Depends(get_db), _=Depends(_require_superadmin)):
    await db.execute("UPDATE users SET is_admin=? WHERE id=?", (int(body.is_admin), user_id))
    await db.commit()
    return {"ok": True}


# ── Tickets ────────────────────────────────────────────────────
@router.get("/tickets")
async def list_tickets(db: Connection = Depends(get_db), _=Depends(_require_admin)):
    cur = await db.execute(
        "SELECT t.id, t.user_id, u.username, t.message, t.status, "
        "t.admin_note, t.created_at, t.resolved_at "
        "FROM tickets t JOIN users u ON t.user_id=u.id "
        "ORDER BY t.created_at DESC"
    )
    rows = await cur.fetchall()
    return [
        {"id": r["id"], "user_id": r["user_id"], "username": r["username"],
         "message": r["message"], "status": r["status"], "admin_note": r["admin_note"],
         "created_at": r["created_at"], "resolved_at": r["resolved_at"]}
        for r in rows
    ]


class TicketUpdate(BaseModel):
    status: Optional[str] = None
    admin_note: Optional[str] = None


@router.patch("/tickets/{ticket_id}")
async def update_ticket(ticket_id: int, body: TicketUpdate, db: Connection = Depends(get_db), _=Depends(_require_admin)):
    if body.status:
        if body.status == "resolved":
            await db.execute("UPDATE tickets SET status=?, resolved_at=datetime('now') WHERE id=?", (body.status, ticket_id))
        else:
            await db.execute("UPDATE tickets SET status=?, resolved_at=NULL WHERE id=?", (body.status, ticket_id))
    if body.admin_note is not None:
        await db.execute("UPDATE tickets SET admin_note=? WHERE id=?", (body.admin_note, ticket_id))
    await db.commit()
    return {"ok": True}


# ── Cards ──────────────────────────────────────────────────────
@router.get("/cards")
async def list_cards(db: Connection = Depends(get_db), _=Depends(_require_admin)):
    cur = await db.execute("SELECT id, category, title, description FROM items ORDER BY category, id")
    rows = await cur.fetchall()
    return [{"id": r["id"], "category": r["category"], "title": r["title"], "description": r["description"]} for r in rows]


class CardBody(BaseModel):
    category: str
    title: str
    description: Optional[str] = ""


@router.post("/cards")
async def create_card(body: CardBody, db: Connection = Depends(get_db), _=Depends(_require_admin)):
    cur = await db.execute(
        "INSERT INTO items (category, title, description) VALUES (?,?,?)",
        (body.category, body.title, body.description)
    )
    await db.commit()
    return {"id": cur.lastrowid}


@router.patch("/cards/{card_id}")
async def update_card(card_id: int, body: CardBody, db: Connection = Depends(get_db), _=Depends(_require_admin)):
    await db.execute(
        "UPDATE items SET category=?, title=?, description=? WHERE id=?",
        (body.category, body.title, body.description, card_id)
    )
    await db.commit()
    return {"ok": True}


@router.delete("/cards/{card_id}")
async def delete_card(card_id: int, db: Connection = Depends(get_db), _=Depends(_require_admin)):
    await db.execute("DELETE FROM responses WHERE item_id=?", (card_id,))
    await db.execute("DELETE FROM items WHERE id=?", (card_id,))
    await db.commit()
    return {"ok": True}
