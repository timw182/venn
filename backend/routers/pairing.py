import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection

from database import get_db
from models import PairingCodeOut, JoinRequest, UserOut
from routers.auth import _session_user_id, _get_user_out

router = APIRouter(prefix="/pairing", tags=["pairing"])

_CODE_CHARS = string.ascii_uppercase.replace("I", "").replace("O", "") + "23456789"


def _gen_code(length: int = 6) -> str:
    return "".join(secrets.choice(_CODE_CHARS) for _ in range(length))


@router.post("/create", response_model=PairingCodeOut)
async def create_pairing_code(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)

    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    user = await cur.fetchone()
    if user and user["couple_id"]:
        raise HTTPException(400, "Already paired")

    # Generate a unique code
    for _ in range(10):
        code = _gen_code()
        cur = await db.execute("SELECT id FROM users WHERE pairing_code = ?", (code,))
        existing = await cur.fetchone()
        if not existing:
            break
    else:
        raise HTTPException(500, "Could not generate unique code")

    await db.execute("UPDATE users SET pairing_code = ? WHERE id = ?", (code, uid))
    await db.commit()
    return PairingCodeOut(code=code)


@router.post("/join", response_model=UserOut)
async def join_with_code(body: JoinRequest, request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)

    cur = await db.execute("SELECT * FROM users WHERE id = ?", (uid,))
    me = await cur.fetchone()
    if me and me["couple_id"]:
        raise HTTPException(400, "Already paired")

    code = body.code.strip().upper()
    cur = await db.execute("SELECT * FROM users WHERE pairing_code = ?", (code,))
    other = await cur.fetchone()
    if not other:
        raise HTTPException(404, "Code not found")
    if other["id"] == uid:
        raise HTTPException(400, "Cannot pair with yourself")
    if other["couple_id"]:
        raise HTTPException(400, "This code has already been used")

    # Create couple
    cursor = await db.execute(
        "INSERT INTO couples (user_a_id, user_b_id) VALUES (?,?)",
        (other["id"], uid),
    )
    couple_id = cursor.lastrowid

    # Link both users, clear the pairing code (one-time use)
    await db.execute(
        "UPDATE users SET couple_id = ?, pairing_code = NULL WHERE id IN (?,?)",
        (couple_id, other["id"], uid),
    )
    await db.commit()

    return await _get_user_out(db, uid)


@router.get("/status")
async def pairing_status(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    cur = await db.execute("SELECT couple_id, pairing_code FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    return {
        "paired": bool(row and row["couple_id"]),
        "pairing_code": row["pairing_code"] if row else None,
    }
