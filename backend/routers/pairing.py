import os
import secrets
import string
import logging
import resend
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from aiosqlite import Connection
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from models import PairingCodeOut, JoinRequest, UserOut
from routers.auth import _session_user_id, _get_user_out

log = logging.getLogger("venn.pairing")
limiter = Limiter(key_func=get_remote_address)

CODE_LENGTH = 8
CODE_TTL_HOURS = 48

# Beta flag — set PAYMENT_REQUIRED=true in prod once IAP is wired
PAYMENT_REQUIRED = os.environ.get("PAYMENT_REQUIRED", "false").lower() == "true"

router = APIRouter(prefix="/pairing", tags=["pairing"])

# Set Resend API key once at import time (not per-request)
resend.api_key = os.environ.get("RESEND_API_KEY", "")

_CODE_CHARS = string.ascii_uppercase.replace("I", "").replace("O", "") + "23456789"

# Placeholder addresses generated for social-login users who don't share their email.
# Sending to these bounces, so we skip delivery instead.
_PLACEHOLDER_EMAIL_SUFFIX = "@noreply.venn.lu"


def _gen_code(length: int = CODE_LENGTH) -> str:
    return "".join(secrets.choice(_CODE_CHARS) for _ in range(length))


def _pick_delivery_email(user) -> str | None:
    """Return a usable email for the user, or None if nothing real is on file."""
    for field in ("email", "username"):
        try:
            addr = user[field]
        except (KeyError, IndexError):
            addr = None
        if not addr:
            continue
        addr = addr.strip()
        if not addr or "@" not in addr:
            continue
        if addr.lower().endswith(_PLACEHOLDER_EMAIL_SUFFIX):
            continue
        return addr
    return None


async def _send_code_email(to_email: str, code: str) -> bool:
    """Send the invite-code email. Returns True on success, False if skipped or failed."""
    from_email = os.environ.get("FROM_EMAIL", "Venn <noreply@venn.lu>")
    if not resend.api_key:
        log.warning("RESEND_API_KEY not set — skipping email for %s", to_email)
        return False
    try:
        resend.Emails.send({
            "from": from_email,
            "to": [to_email],
            "subject": "Your Venn invite code",
            "html": f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Your Venn invite code</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
    body,table,td {{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}}
    body {{background-color:#EDE8F4;}}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#EDE8F4;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#EDE8F4;">
    <tr><td style="padding:48px 16px;" align="center">

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="520" style="max-width:520px;background-color:#FAF7FC;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(45,31,61,0.10);">

        <!-- Gradient top bar -->
        <tr><td height="4" style="background:linear-gradient(90deg,#C4547A 0%,#9B80D4 100%);font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Logo -->
        <tr><td style="padding:36px 40px 0;text-align:center;">
          <span style="font-family:'Comfortaa',cursive,Helvetica,Arial;font-size:15px;color:#C4547A;margin-right:-5px;">&#9711;</span><span style="font-family:'Comfortaa',cursive,Helvetica,Arial;font-size:15px;color:#9B80D4;margin-right:9px;">&#9711;</span><span style="font-family:'Comfortaa',cursive,Helvetica,Arial;font-size:21px;font-weight:700;color:#2D1F3D;letter-spacing:-0.3px;">venn</span>
        </td></tr>

        <!-- Heading -->
        <tr><td style="padding:28px 40px 0;text-align:center;">
          <h1 style="font-family:'Comfortaa',cursive,Helvetica,Arial;font-size:27px;font-weight:700;color:#2D1F3D;margin:0;line-height:1.3;letter-spacing:-0.4px;">Your invite code<br>is ready</h1>
        </td></tr>

        <!-- Subtext -->
        <tr><td style="padding:14px 40px 0;text-align:center;">
          <p style="font-family:'DM Sans',Helvetica,Arial;font-size:15px;font-weight:300;color:#5C4A72;margin:0;line-height:1.65;">Share the code with your partner &mdash; they&rsquo;ll enter it in the Venn app and you&rsquo;ll be connected instantly.</p>
        </td></tr>

        <!-- Code box -->
        <tr><td style="padding:28px 40px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td style="background-color:#ffffff;border:1.5px solid #E4D8EE;border-radius:16px;padding:28px 24px;text-align:center;">
              <p style="font-family:'DM Sans',Helvetica,Arial;font-size:11px;font-weight:500;letter-spacing:0.14em;text-transform:uppercase;color:#9B80D4;margin:0 0 16px 0;">your invite code</p>
              <p style="font-family:'Comfortaa',cursive,Courier,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#2D1F3D;margin:0 0 16px 10px;">{code}</p>
              <p style="font-family:'DM Sans',Helvetica,Arial;font-size:12px;color:#B0A0C0;margin:0;">Valid for 48 hours</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Tip -->
        <tr><td style="padding:20px 40px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td style="background-color:#FDF3F6;border-left:3px solid #C4547A;border-radius:0 10px 10px 0;padding:14px 18px;">
              <p style="font-family:'DM Sans',Helvetica,Arial;font-size:13px;font-weight:300;color:#5C4A72;margin:0;line-height:1.65;font-style:italic;">Share it however feels right &mdash; a text, a note left on the counter, a whisper. &#128140;</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Settings note -->
        <tr><td style="padding:20px 40px 36px;text-align:center;">
          <p style="font-family:'DM Sans',Helvetica,Arial;font-size:13px;font-weight:300;color:#7A6490;margin:0;line-height:1.65;">You can always find your code again under <strong style="color:#2D1F3D;font-weight:500;">Settings &rarr; Pairing</strong> in the app.</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #E4D8EE;padding:20px 40px;text-align:center;">
          <p style="font-family:'DM Sans',Helvetica,Arial;font-size:11px;color:#C4B8D4;margin:0;letter-spacing:0.04em;">Venn &middot; <a href="https://venn.lu" style="color:#C4B8D4;text-decoration:none;">venn.lu</a></p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>""",
        })
        return True
    except Exception as e:
        log.error("Failed to send pairing code email to %s: %s", to_email, e)
        return False


@router.post("/verify-purchase")
@limiter.limit("10/minute")
async def verify_purchase(request: Request, db: Connection = Depends(get_db)):
    """Called after a RevenueCat consumable purchase to credit the user.

    Reads non-subscription transactions, inserts any new ones into
    ``pairing_purchases`` (idempotent on store transaction id), and
    increments ``users.pairing_credits`` by the number of newly-recorded
    transactions. Returns the user's new credit total.
    """
    import re
    uid = await _session_user_id(request, db)
    body = await request.json()
    rc_user_id = body.get("rc_user_id", "")

    # Sanitize rc_user_id to prevent SSRF path traversal
    if rc_user_id and not re.match(r'^[\w\-:.$]+$', rc_user_id):
        raise HTTPException(400, "Invalid user ID format")

    # Verify with RevenueCat API that this user actually purchased
    rc_api_key = os.environ.get("REVENUECAT_API_KEY", "")
    if not rc_api_key:
        raise HTTPException(503, "Payment verification unavailable")

    import httpx
    subscriber_id = rc_user_id or str(uid)
    async with httpx.AsyncClient() as http:
        resp = await http.get(
            f"https://api.revenuecat.com/v1/subscribers/{subscriber_id}",
            headers={"Authorization": f"Bearer {rc_api_key}"},
        )
        if resp.status_code != 200:
            log.warning("RevenueCat verification failed: %s", resp.status_code)
            raise HTTPException(502, "Could not verify purchase")
        data = resp.json()

    subscriber = data.get("subscriber", {}) or {}
    non_sub = subscriber.get("non_subscription_transactions", []) or []
    relevant = [
        t for t in non_sub
        if t.get("product_id") == "lu.venn.pairingcode_v2"
    ]

    new_count = 0
    for t in relevant:
        store_tx_id = t.get("id")
        product_id = t.get("product_id")
        purchased_at = t.get("purchase_date") or ""
        if not store_tx_id or not product_id:
            continue
        cur = await db.execute(
            "INSERT OR IGNORE INTO pairing_purchases "
            "(user_id, store_transaction_id, product_id, purchased_at) "
            "VALUES (?, ?, ?, ?)",
            (uid, store_tx_id, product_id, purchased_at),
        )
        if cur.rowcount and cur.rowcount > 0:
            new_count += 1

    if new_count > 0:
        await db.execute(
            "UPDATE users SET pairing_credits = pairing_credits + ? WHERE id = ?",
            (new_count, uid),
        )
    await db.commit()

    cur = await db.execute("SELECT pairing_credits FROM users WHERE id = ?", (uid,))
    row = await cur.fetchone()
    credits = int(row["pairing_credits"]) if row and row["pairing_credits"] is not None else 0
    return {"credits": credits}


@router.post("/create", response_model=PairingCodeOut)
@limiter.limit("10/minute")
async def create_pairing_code(request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)

    cur = await db.execute(
        "SELECT couple_id, pairing_code, pairing_code_expires_at, pairing_credits, username, email FROM users WHERE id = ?", (uid,)
    )
    user = await cur.fetchone()
    if user and user["couple_id"]:
        raise HTTPException(400, "Already paired")

    # Return existing code if still valid (no credit check needed — code was already paid for).
    code: str | None = None
    if user and user["pairing_code"] and user["pairing_code_expires_at"]:
        exp = datetime.fromisoformat(user["pairing_code_expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < exp:
            code = user["pairing_code"]

    # Only require payment when minting a new code
    if code is None and PAYMENT_REQUIRED and (user["pairing_credits"] or 0) <= 0:
        raise HTTPException(402, "No pairing credits — purchase one to generate a code")

    if code is None:
        # Generate a unique code
        for _ in range(10):
            candidate = _gen_code()
            cur = await db.execute("SELECT id FROM users WHERE pairing_code = ?", (candidate,))
            existing = await cur.fetchone()
            if not existing:
                code = candidate
                break
        else:
            raise HTTPException(500, "Could not generate unique code")

        expires_at = (datetime.now(timezone.utc) + timedelta(hours=CODE_TTL_HOURS)).isoformat()
        await db.execute(
            "UPDATE users SET pairing_code = ?, pairing_code_expires_at = ? WHERE id = ?",
            (code, expires_at, uid),
        )
        await db.commit()

    # Always re-send the email on this endpoint — rate limiting (10/min) is the spam guard.
    # If the user has no real email on file (social login w/o email share), skip quietly.
    delivery = _pick_delivery_email(user) if user else None
    email_sent = await _send_code_email(delivery, code) if delivery else False

    return PairingCodeOut(code=code, email_sent=email_sent)


@router.post("/join", response_model=UserOut)
@limiter.limit("10/minute")
async def join_with_code(body: JoinRequest, request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)

    # Acquire write lock before any reads to prevent TOCTOU races
    await db.execute("BEGIN IMMEDIATE")

    try:
        cur = await db.execute("SELECT * FROM users WHERE id = ?", (uid,))
        me = await cur.fetchone()
        if me and me["couple_id"]:
            await db.execute("ROLLBACK")
            raise HTTPException(400, "Already paired")

        code = body.code.strip().upper()
        cur = await db.execute("SELECT * FROM users WHERE pairing_code = ?", (code,))
        other = await cur.fetchone()
        if not other:
            await db.execute("ROLLBACK")
            raise HTTPException(404, "Invalid or expired code")
        if other["id"] == uid:
            await db.execute("ROLLBACK")
            raise HTTPException(400, "Cannot pair with yourself")
        if other["couple_id"]:
            await db.execute("ROLLBACK")
            raise HTTPException(404, "Invalid or expired code")
    except HTTPException:
        raise
    except Exception:
        await db.execute("ROLLBACK")
        raise

    # Atomically claim the code + check expiry
    cur = await db.execute(
        "UPDATE users SET pairing_code = NULL, pairing_code_expires_at = NULL "
        "WHERE id = ? AND pairing_code = ? "
        "AND (pairing_code_expires_at IS NULL OR pairing_code_expires_at > ?)",
        (other["id"], code, datetime.now(timezone.utc).isoformat()),
    )
    if cur.rowcount == 0:
        cur2 = await db.execute("SELECT pairing_code FROM users WHERE id = ?", (other["id"],))
        row2 = await cur2.fetchone()
        await db.execute("ROLLBACK")
        if row2 and row2["pairing_code"] == code:
            raise HTTPException(410, "Pairing code has expired")
        raise HTTPException(409, "Code was just used by someone else")

    # Create couple
    cursor = await db.execute(
        "INSERT INTO couples (user_a_id, user_b_id) VALUES (?,?)",
        (other["id"], uid),
    )
    couple_id = cursor.lastrowid

    # Link both users
    cur = await db.execute(
        "UPDATE users SET couple_id = ? WHERE id IN (?,?) AND couple_id IS NULL",
        (couple_id, other["id"], uid),
    )
    if cur.rowcount < 2:
        await db.execute("ROLLBACK")
        raise HTTPException(409, "Pairing conflict — please try again")

    # Decrement the buyer's (code owner's) pairing credits by 1.
    # The joining partner is unaffected.
    cur = await db.execute(
        "UPDATE users SET pairing_credits = pairing_credits - 1 "
        "WHERE id = ? AND pairing_credits > 0",
        (other["id"],),
    )
    if cur.rowcount == 0:
        log.warning(
            "Pairing succeeded but buyer %s had no credits to decrement",
            other["id"],
        )
    await db.commit()

    return await _get_user_out(db, uid)


@router.get("/status")
async def pairing_status(request: Request, db: Connection = Depends(get_db)):
    uid = await _session_user_id(request, db)
    cur = await db.execute(
        "SELECT couple_id, pairing_code, pairing_code_expires_at, pairing_credits FROM users WHERE id = ?", (uid,)
    )
    row = await cur.fetchone()
    code = None
    if row and row["pairing_code"] and row["pairing_code_expires_at"]:
        exp = datetime.fromisoformat(row["pairing_code_expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) < exp:
            code = row["pairing_code"]
    return {
        "paired": bool(row and row["couple_id"]),
        "pairing_code": code,
        "pairing_credits": int(row["pairing_credits"]) if row and row["pairing_credits"] is not None else 0,
    }
