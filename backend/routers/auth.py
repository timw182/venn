from fastapi import APIRouter, Depends, HTTPException, Request, Response
from aiosqlite import Connection
from passlib.context import CryptContext

from database import get_db
from models import RegisterRequest, LoginRequest, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

AVATAR_COLORS = [
    "#C4754B", "#7B9E6F", "#D4B878", "#8E7BB5",
    "#5B9BB5", "#C47474", "#74A899", "#B5875B",
]


async def _get_user_out(db: Connection, user_id: int) -> UserOut:
    row = await db.execute_fetchone(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    )
    if not row:
        raise HTTPException(404, "User not found")

    partner_name = None
    if row["couple_id"]:
        couple = await db.execute_fetchone(
            "SELECT user_a_id, user_b_id FROM couples WHERE id = ?",
            (row["couple_id"],),
        )
        if couple:
            partner_id = (
                couple["user_b_id"]
                if couple["user_a_id"] == user_id
                else couple["user_a_id"]
            )
            partner = await db.execute_fetchone(
                "SELECT display_name FROM users WHERE id = ?", (partner_id,)
            )
            if partner:
                partner_name = partner["display_name"]

    return UserOut(
        id=row["id"],
        username=row["username"],
        display_name=row["display_name"],
        avatar_color=row["avatar_color"],
        couple_id=row["couple_id"],
        partner_name=partner_name,
    )


def _session_user_id(request: Request) -> int:
    uid = request.session.get("user_id")
    if not uid:
        raise HTTPException(401, "Not authenticated")
    return uid


@router.post("/register", response_model=UserOut)
async def register(body: RegisterRequest, request: Request, db: Connection = Depends(get_db)):
    existing = await db.execute_fetchone(
        "SELECT id FROM users WHERE username = ?", (body.username,)
    )
    if existing:
        raise HTTPException(400, "Username already taken")

    color = AVATAR_COLORS[hash(body.username) % len(AVATAR_COLORS)]
    hashed = pwd_ctx.hash(body.password)

    cursor = await db.execute(
        "INSERT INTO users (username, password_hash, display_name, avatar_color) VALUES (?,?,?,?)",
        (body.username.strip(), hashed, body.display_name, color),
    )
    await db.commit()

    request.session["user_id"] = cursor.lastrowid
    return await _get_user_out(db, cursor.lastrowid)


@router.post("/login", response_model=UserOut)
async def login(body: LoginRequest, request: Request, db: Connection = Depends(get_db)):
    row = await db.execute_fetchone(
        "SELECT * FROM users WHERE username = ?", (body.username.strip(),)
    )
    if not row or not pwd_ctx.verify(body.password, row["password_hash"]):
        raise HTTPException(401, "Invalid username or password")

    request.session["user_id"] = row["id"]
    return await _get_user_out(db, row["id"])


@router.post("/logout", status_code=204)
async def logout(request: Request):
    request.session.clear()


@router.get("/me", response_model=UserOut)
async def me(request: Request, db: Connection = Depends(get_db)):
    uid = _session_user_id(request)
    return await _get_user_out(db, uid)
