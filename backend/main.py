import os
import secrets
import time
import logging
import json as _json
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect


# ---------------------------------------------------------------------------
# Structured JSON logging (built-in only, no extra dependencies)
# ---------------------------------------------------------------------------
class _JSONFormatter(logging.Formatter):
    """Emit each log record as a single JSON object."""

    def format(self, record: logging.LogRecord) -> str:
        entry = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info and record.exc_info[0] is not None:
            entry["exception"] = self.formatException(record.exc_info)
        return _json.dumps(entry)


_log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
_handler = logging.StreamHandler()
_handler.setFormatter(_JSONFormatter())
logging.root.handlers = [_handler]
logging.root.setLevel(getattr(logging, _log_level, logging.INFO))

logger = logging.getLogger("venn.api")
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from fastapi import Depends
from database import init_db
from seed import seed
from routers import auth, admin as admin_router, tickets as tickets_router, pairing, catalog, matches, mood, reset, custom_items
from routers.deps import verify_session
from ws import manager
from database import get_db, get_db_ctx


class SecurityHeadersMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        async def patched_send(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers += [
                    (b"strict-transport-security", b"max-age=63072000; includeSubDomains; preload"),
                    (b"x-content-type-options", b"nosniff"),
                    (b"x-frame-options", b"DENY"),
                    (b"referrer-policy", b"strict-origin-when-cross-origin"),
                    (b"content-security-policy", (
                        b"default-src 'self'; "
                        b"script-src 'self' https://unpkg.com; "
                        b"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                        b"font-src 'self' data: https://fonts.gstatic.com; "
                        b"connect-src 'self' https://api.venn.lu wss://api.venn.lu "
                        b"https://faro-collector-prod-eu-west-2.grafana.net "
                        b"https://fonts.googleapis.com; "
                        b"img-src 'self' data: blob:; "
                        b"frame-ancestors 'none';"
                    )),
                ]
                message = {**message, "headers": headers}
            await send(message)
        await self.app(scope, receive, patched_send)


limiter = Limiter(key_func=get_remote_address)

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    if os.environ.get("DEBUG", "false").lower() == "true":
        SECRET_KEY = secrets.token_hex(32)  # Allow ephemeral key in dev only
    else:
        raise RuntimeError("SECRET_KEY environment variable must be set in production")
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "https://venn.lu")
EXTRA_ORIGINS = [o.strip() for o in os.environ.get("EXTRA_ORIGINS", "").split(",") if o.strip()]
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed()
    yield


app = FastAPI(
    title="Venn API",
    lifespan=lifespan,
    docs_url="/api/docs" if DEBUG else None,
    redoc_url="/api/redoc" if DEBUG else None,
    openapi_url="/api/openapi.json" if DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Explicit host (no leading dot) so the cookie is never sent to other subdomains.
COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", "venn.lu")

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="kl_session",
    max_age=60 * 60 * 24 * 7,  # 7 days
    https_only=True,
    same_site="strict",
    domain=COOKIE_DOMAIN,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN] + EXTRA_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router has no session validation (login/register/me need to work without it)
app.include_router(auth.router, prefix="/api")
# All other routers validate session token — kicks out old devices on new login
_auth_dep = [Depends(verify_session)]
app.include_router(pairing.router, prefix="/api", dependencies=_auth_dep)
app.include_router(catalog.router, prefix="/api", dependencies=_auth_dep)
app.include_router(matches.router, prefix="/api", dependencies=_auth_dep)
app.include_router(mood.router, prefix="/api", dependencies=_auth_dep)
app.include_router(reset.router, prefix="/api", dependencies=_auth_dep)
app.include_router(admin_router.router, prefix="/api", dependencies=_auth_dep)
app.include_router(tickets_router.router, prefix="/api", dependencies=_auth_dep)
app.include_router(custom_items.router, prefix="/api", dependencies=_auth_dep)


# Short-lived WS auth tickets: ticket_hex -> (user_id, expires_at)
# Mobile clients exchange their session token for a one-time ticket via GET /api/ws/ticket,
# then pass ?ticket=<nonce> in the WS URL to avoid logging long-lived tokens.
_ws_tickets: dict[str, tuple[int, float]] = {}


@app.get("/api/ws/ticket")
@limiter.limit("10/minute")
async def ws_ticket(request: Request):
    """Issue a 60-second single-use ticket for WebSocket auth (mobile clients)."""
    uid = request.session.get("user_id")
    if not uid:
        token = request.headers.get("X-Session-Token")
        if token:
            async with get_db_ctx() as db:
                cur = await db.execute("SELECT id FROM users WHERE session_token = ?", (token,))
                row = await cur.fetchone()
                if row:
                    uid = row["id"]
    if not uid:
        raise HTTPException(401, "Not authenticated")
    now = time.time()
    # Prune expired tickets
    expired = [k for k, (_, exp) in list(_ws_tickets.items()) if exp < now]
    for k in expired:
        del _ws_tickets[k]
    ticket = secrets.token_hex(16)
    _ws_tickets[ticket] = (uid, now + 60)
    return {"ticket": ticket}


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    uid = websocket.session.get("user_id")
    # Fallback: one-time ticket for mobile clients
    if not uid:
        ticket = websocket.query_params.get("ticket")
        if ticket:
            now = time.time()
            entry = _ws_tickets.pop(ticket, None)
            if entry and entry[1] >= now:
                uid = entry[0]
    if not uid:
        await websocket.accept()
        await websocket.close(code=4001)
        return

    async with get_db_ctx() as db:
        cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
        row = await cur.fetchone()

    if not row or not row["couple_id"]:
        await websocket.accept()
        await websocket.close(code=4002)
        return

    couple_id = row["couple_id"]
    await manager.connect(websocket, couple_id)
    try:
        while True:
            # Keep connection alive; server pushes events, client just pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.warning("WebSocket error for couple %s: %s", couple_id, e)
    finally:
        manager.disconnect(websocket, couple_id)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
