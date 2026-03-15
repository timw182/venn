from fastapi import HTTPException
from aiosqlite import Connection


async def require_couple(db: Connection, uid: int) -> int:
    """Return couple_id for the user, or raise 403 if not paired."""
    cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    if not row or not row["couple_id"]:
        raise HTTPException(403, "Not paired")
    return row["couple_id"]


async def get_partner_id(db: Connection, uid: int, couple_id: int) -> int:
    """Return the partner's user ID within the couple."""
    cur = await db.execute(
        "SELECT user_a_id, user_b_id FROM couples WHERE id = ?", (couple_id,)
    )
    couple = await cur.fetchone()
    return couple["user_b_id"] if couple["user_a_id"] == uid else couple["user_a_id"]
