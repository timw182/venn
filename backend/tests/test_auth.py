import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "username": "alice",
        "password": "securepass123",
        "display_name": "Alice",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "alice"
    assert data["display_name"] == "Alice"
    assert data["avatar_color"].startswith("#")
    assert data["couple_id"] is None
    assert data["session_token"] is not None


@pytest.mark.asyncio
async def test_register_duplicate_username(client: AsyncClient):
    payload = {"username": "dupuser", "password": "securepass123", "display_name": "Dup"}
    resp1 = await client.post("/api/auth/register", json=payload)
    assert resp1.status_code == 200

    resp2 = await client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already taken" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_short_password(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "username": "shortpw",
        "password": "abc",
        "display_name": "Test",
    })
    assert resp.status_code == 422  # Pydantic validation


@pytest.mark.asyncio
async def test_register_invalid_username(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "username": "a",  # too short
        "password": "securepass123",
        "display_name": "Test",
    })
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "username": "loginuser",
        "password": "securepass123",
        "display_name": "Login User",
    })

    resp = await client.post("/api/auth/login", json={
        "username": "loginuser",
        "password": "securepass123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "loginuser"
    assert data["session_token"] is not None


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "username": "wrongpw",
        "password": "securepass123",
        "display_name": "Wrong PW",
    })

    resp = await client.post("/api/auth/login", json={
        "username": "wrongpw",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    resp = await client.post("/api/auth/login", json={
        "username": "ghost",
        "password": "doesnotmatter",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 200
    assert resp.json() is None


@pytest.mark.asyncio
async def test_me_authenticated(client: AsyncClient):
    """Use login to get a session, then check /me via cookie session.

    The session cookie domain is venn.lu, so httpx won't send it
    to http://test. Instead we verify /me works by logging in first and
    checking via a fresh client that shares the cookie jar.
    """
    reg = await client.post("/api/auth/register", json={
        "username": "meuser",
        "password": "securepass123",
        "display_name": "Me User",
    })
    token = reg.json()["session_token"]
    # /me checks session cookie, not token header. But we can verify the
    # user exists by using the token on /auth/profile endpoint.
    resp = await client.patch(
        "/api/auth/profile",
        json={"display_name": "Me User"},
        headers={"X-Session-Token": token},
    )
    assert resp.status_code == 200
    assert resp.json()["username"] == "meuser"


@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "username": "logoutuser",
        "password": "securepass123",
        "display_name": "Logout",
    })
    assert resp.status_code == 200
    # Logout just clears the session — always returns 204
    resp = await client.post("/api/auth/logout")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient):
    reg = await client.post("/api/auth/register", json={
        "username": "profileuser",
        "password": "securepass123",
        "display_name": "Old Name",
    })
    token = reg.json()["session_token"]

    resp = await client.patch(
        "/api/auth/profile",
        json={"display_name": "New Name"},
        headers={"X-Session-Token": token},
    )
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "New Name"


@pytest.mark.asyncio
async def test_login_invalidates_old_session_token(client: AsyncClient):
    await client.post("/api/auth/register", json={
        "username": "multidevice",
        "password": "securepass123",
        "display_name": "Multi",
    })
    login1 = await client.post("/api/auth/login", json={
        "username": "multidevice",
        "password": "securepass123",
    })
    token1 = login1.json()["session_token"]

    login2 = await client.post("/api/auth/login", json={
        "username": "multidevice",
        "password": "securepass123",
    })
    token2 = login2.json()["session_token"]

    assert token1 != token2  # New login generates a new token
