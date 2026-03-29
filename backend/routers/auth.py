import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from aiosqlite import Connection
from passlib.context import CryptContext
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models import RegisterRequest, LoginRequest, UserOut, UserOutWithToken, UpdateProfileRequest
from routers.deps import verify_session

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Pre-computed dummy hash — ensures bcrypt always runs on login, preventing
# timing-based username enumeration (unknown user vs wrong password).
_DUMMY_HASH = pwd_ctx.hash("__dummy__")

AVATAR_COLORS = [
    "#C4754B", "#7B9E6F", "#D4B878", "#8E7BB5",
    "#5B9BB5", "#C47474", "#74A899", "#B5875B",
]


async def _get_user_out(db: Connection, user_id: int, session_token: str = None) -> UserOut:
    cur = await db.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = await cur.fetchone()
    if not row:
        raise HTTPException(404, "User not found")

    partner_name = None
    if row["couple_id"]:
        cur = await db.execute(
            "SELECT user_a_id, user_b_id FROM couples WHERE id = ?",
            (row["couple_id"],)
        )
        couple = await cur.fetchone()
        if couple:
            partner_id = (
                couple["user_b_id"]
                if couple["user_a_id"] == user_id
                else couple["user_a_id"]
            )
            cur = await db.execute(
                "SELECT display_name FROM users WHERE id = ?", (partner_id,)
            )
            partner = await cur.fetchone()
            if partner:
                partner_name = partner["display_name"]

    base = dict(
        id=row["id"],
        username=row["username"],
        display_name=row["display_name"],
        avatar_color=row["avatar_color"],
        couple_id=row["couple_id"],
        partner_name=partner_name,
        is_admin=bool(row["is_admin"]),
        is_superadmin=bool(row["is_superadmin"]),
    )
    if session_token:
        return UserOutWithToken(**base, session_token=session_token)
    return UserOut(**base)


async def _session_user_id(request: Request, db: Connection = None) -> int:
    """Get user ID from session cookie (web) or X-Session-Token header (mobile)."""
    uid = request.session.get("user_id")
    if uid:
        return uid
    # Fallback: token-based auth for mobile clients
    token = request.headers.get("X-Session-Token")
    if token and db:
        cur = await db.execute("SELECT id FROM users WHERE session_token = ?", (token,))
        row = await cur.fetchone()
        if row:
            return row["id"]
    raise HTTPException(401, "Not authenticated")


@router.post("/register", response_model=UserOutWithToken)
@limiter.limit("5/minute")
async def register(body: RegisterRequest, request: Request, db: Connection = Depends(get_db)):
    cur = await db.execute("SELECT id FROM users WHERE username = ?", (body.username,))
    existing = await cur.fetchone()
    if existing:
        raise HTTPException(400, "An account with this email already exists")

    color = AVATAR_COLORS[hash(body.username) % len(AVATAR_COLORS)]
    hashed = pwd_ctx.hash(body.password)

    token = secrets.token_hex(32)
    cursor = await db.execute(
        "INSERT INTO users (username, password_hash, display_name, avatar_color, session_token) VALUES (?,?,?,?,?)",
        (body.username.strip(), hashed, body.display_name, color, token),
    )
    await db.commit()

    request.session.clear()
    request.session["user_id"] = cursor.lastrowid
    request.session["session_token"] = token
    return await _get_user_out(db, cursor.lastrowid, session_token=token)


@router.post("/login", response_model=UserOutWithToken)
@limiter.limit("5/minute")
async def login(body: LoginRequest, request: Request, db: Connection = Depends(get_db)):
    cur = await db.execute("SELECT * FROM users WHERE username = ?", (body.username.strip(),))
    row = await cur.fetchone()
    # Always call verify so response time is constant regardless of whether
    # the username exists, preventing timing-based account enumeration.
    hash_to_check = row["password_hash"] if row else _DUMMY_HASH
    password_ok = pwd_ctx.verify(body.password, hash_to_check)
    if not row or not password_ok:
        raise HTTPException(401, "Invalid email or password")

    # New session token invalidates all other devices
    token = secrets.token_hex(32)
    await db.execute("UPDATE users SET session_token = ? WHERE id = ?", (token, row["id"]))
    await db.commit()

    request.session.clear()
    request.session["user_id"] = row["id"]
    request.session["session_token"] = token
    return await _get_user_out(db, row["id"], session_token=token)


@router.post("/logout", status_code=204, dependencies=[Depends(verify_session)])
async def logout(request: Request, db: Connection = Depends(get_db)):
    uid = request.session.get("user_id")
    if not uid:
        token = request.headers.get("X-Session-Token")
        if token:
            cur = await db.execute("SELECT id FROM users WHERE session_token = ?", (token,))
            row = await cur.fetchone()
            if row:
                uid = row["id"]
    if uid:
        await db.execute("UPDATE users SET session_token = NULL WHERE id = ?", (uid,))
        await db.commit()
    request.session.clear()


@router.get("/me")
async def me(request: Request, db: Connection = Depends(get_db)):
    uid = request.session.get("user_id")
    if not uid:
        token = request.headers.get("X-Session-Token")
        if token:
            cur = await db.execute("SELECT id FROM users WHERE session_token = ?", (token,))
            row = await cur.fetchone()
            if row:
                uid = row["id"]
    if not uid:
        return None  # 200 with null body — avoids noisy 401 in browser console
    return await _get_user_out(db, uid)



@router.patch("/profile", response_model=UserOut, dependencies=[Depends(verify_session)])
@limiter.limit("10/minute")
async def update_profile(body: UpdateProfileRequest, request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)
    await db.execute("UPDATE users SET display_name = ? WHERE id = ?", (body.display_name, uid))
    await db.commit()
    return await _get_user_out(db, uid)

DISCONNECT_COOLDOWN_HOURS = 120  # 5 days

@router.post("/disconnect", status_code=204, dependencies=[Depends(verify_session)])
@limiter.limit("5/minute")
async def disconnect_partner(request: Request, db: Connection = Depends(get_db)):
    """Remove the current couple pairing. Rate-limited to once per 24 hours."""
    uid = await _session_user_id(request, db)

    cur = await db.execute("SELECT couple_id, last_disconnected_at FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        raise HTTPException(400, "Not paired")

    # Rate limit check
    if row["last_disconnected_at"]:
        last = datetime.fromisoformat(row["last_disconnected_at"])
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        elapsed_hours = (datetime.now(timezone.utc) - last).total_seconds() / 3600
        if elapsed_hours < DISCONNECT_COOLDOWN_HOURS:
            wait_h = int(DISCONNECT_COOLDOWN_HOURS - elapsed_hours) + 1
            raise HTTPException(429, f"You can disconnect again in {wait_h} hour(s).")

    couple_id = row["couple_id"]

    # Get both user IDs in the couple
    cur = await db.execute("SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,))
    couple = await cur.fetchone()
    partner_ids = [couple["user_a_id"], couple["user_b_id"]] if couple else [uid]

    # Purge couple-scoped data to prevent carryover to a new partner
    for pid in partner_ids:
        await db.execute("DELETE FROM user_responses WHERE user_id = ?", (pid,))
        await db.execute("DELETE FROM match_seen WHERE user_id = ?", (pid,))
        await db.execute("DELETE FROM user_mood WHERE user_id = ?", (pid,))
    await db.execute("DELETE FROM reset_requests WHERE couple_id = ?", (couple_id,))
    await db.execute("DELETE FROM swipe_pattern_alerts WHERE couple_id = ?", (couple_id,))
    await db.execute("DELETE FROM custom_catalog_items WHERE couple_id = ?", (couple_id,))

    # Unpair both users
    await db.execute(
        "UPDATE users SET couple_id = NULL, last_disconnected_at = datetime('now') WHERE couple_id = ?",
        (couple_id,)
    )
    # Remove the couple record
    await db.execute("DELETE FROM couples WHERE id = ?", (couple_id,))
    await db.commit()
