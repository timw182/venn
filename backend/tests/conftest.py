import os
import tempfile
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Use a temp file DB so all connections share the same database
_test_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_test_db.close()

os.environ["DB_PATH"] = _test_db.name
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["DEBUG"] = "true"

from database import init_db
from main import app
from main import limiter as main_limiter
from routers.auth import limiter as auth_limiter

# Disable rate limiting in tests
main_limiter.enabled = False
auth_limiter.enabled = False


@pytest_asyncio.fixture(autouse=True)
async def _setup_db():
    """Re-initialize the DB before each test for isolation."""
    import aiosqlite
    async with aiosqlite.connect(os.environ["DB_PATH"]) as db:
        rows = await db.execute_fetchall(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
        for (name,) in rows:
            await db.execute(f"DROP TABLE IF EXISTS [{name}]")
        await db.commit()
    await init_db()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
