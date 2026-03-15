import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from database import init_db
from seed import seed
from routers import auth, admin as admin_router, tickets as tickets_router, pairing, catalog, matches, mood, reset
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
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "https://venn.amoreapp.net")
EXTRA_ORIGINS = [o.strip() for o in os.environ.get("EXTRA_ORIGINS", "").split(",") if o.strip()]
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed()
    yield


app = FastAPI(
    title="KinkLink API",
    lifespan=lifespan,
    docs_url="/api/docs" if DEBUG else None,
    redoc_url="/api/redoc" if DEBUG else None,
    openapi_url="/api/openapi.json" if DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Explicit host (no leading dot) so the cookie is never sent to other subdomains.
COOKIE_DOMAIN = os.environ.get("COOKIE_DOMAIN", "venn.amoreapp.net")

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

app.include_router(auth.router, prefix="/api")
app.include_router(pairing.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(mood.router, prefix="/api")
app.include_router(reset.router, prefix="/api")
app.include_router(admin_router.router, prefix="/api")
app.include_router(tickets_router.router, prefix="/api")


@app.websocket("/api/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("[WS DEBUG] cookies:", list(websocket.cookies.keys()), "session:", dict(websocket.session), flush=True)
    uid = websocket.session.get("user_id")
    if not uid:
        await websocket.close(code=4001)
        return

    async with get_db_ctx() as db:
        cur = await db.execute("SELECT couple_id FROM users WHERE id = ?", (uid,))
        row = await cur.fetchone()

    if not row or not row["couple_id"]:
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
        manager.disconnect(websocket, couple_id)


@app.get("/api/health")
async def health():
    return {"status": "ok"}