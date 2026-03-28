
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, field_validator
from aiosqlite import Connection
from slowapi import Limiter
from slowapi.util import get_remote_address
from database import get_db
from routers.auth import _session_user_id

router = APIRouter(prefix="/tickets", tags=["tickets"])
limiter = Limiter(key_func=get_remote_address)


class TicketIn(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def message_length(cls, v):
        if len(v) > 5000:
            raise ValueError("Message must be 5000 characters or less")
        return v


@router.post("")
@limiter.limit("5/minute")
async def submit_ticket(body: TicketIn, request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)
    if not body.message.strip():
        raise HTTPException(400, "Message required")
    await db.execute(
        "INSERT INTO tickets (user_id, message) VALUES (?,?)",
        (uid, body.message.strip())
    )
    await db.commit()
    return {"ok": True}
