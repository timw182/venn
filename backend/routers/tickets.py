
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from aiosqlite import Connection
from database import get_db

router = APIRouter(prefix="/tickets", tags=["tickets"])


class TicketIn(BaseModel):
    message: str


@router.post("")
async def submit_ticket(body: TicketIn, request: Request, db: Connection = Depends(get_db)):
    uid = request.session.get("user_id")
    if not uid:
        raise HTTPException(401, "Not authenticated")
    if not body.message.strip():
        raise HTTPException(400, "Message required")
    await db.execute(
        "INSERT INTO tickets (user_id, message) VALUES (?,?)",
        (uid, body.message.strip())
    )
    await db.commit()
    return {"ok": True}
