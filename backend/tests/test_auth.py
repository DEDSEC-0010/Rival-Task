import pytest


@pytest.mark.asyncio
async def test_signup_login_and_me(client):
    # Signup
    r = await client.post("/api/v1/auth/signup", json={"email": "alice@example.com", "password": "supersecret"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["role"] == "user"
    assert "token" in body and body["token"]

    # /me works using cookie set on signup
    r = await client.get("/api/v1/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "alice@example.com"

    # Login with the same credentials
    r = await client.post("/api/v1/auth/login", json={"email": "alice@example.com", "password": "supersecret"})
    assert r.status_code == 200

    # Wrong password
    r = await client.post("/api/v1/auth/login", json={"email": "alice@example.com", "password": "WRONGPASS"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "INVALID_CREDENTIALS"


@pytest.mark.asyncio
async def test_signup_duplicate_email_returns_409(client):
    payload = {"email": "dup@example.com", "password": "supersecret"}
    r1 = await client.post("/api/v1/auth/signup", json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/api/v1/auth/signup", json=payload)
    assert r2.status_code == 409
    assert r2.json()["error"]["code"] == "EMAIL_TAKEN"


@pytest.mark.asyncio
async def test_protected_route_requires_auth(client):
    r = await client.get("/api/v1/tasks")
    assert r.status_code == 401
