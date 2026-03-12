import os
import secrets
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from database import init_db
from seed import seed
from routers import auth, pairing, catalog, matches, mood

SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))
FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed()
    yield


app = FastAPI(title="KinkLink API", lifespan=lifespan)

app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
    session_cookie="kl_session",
    max_age=60 * 60 * 24 * 30,  # 30 days
    https_only=False,            # set True behind TLS in production
    same_site="lax",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(pairing.router, prefix="/api")
app.include_router(catalog.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(mood.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
