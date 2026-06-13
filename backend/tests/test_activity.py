import pytest


async def _signup(client, email: str) -> str:
    r = await client.post(
        "/api/v1/auth/signup", json={"email": email, "password": "supersecret"}
    )
    assert r.status_code == 201
    return r.json()["token"]


@pytest.mark.asyncio
async def test_activity_records_create_and_status_transitions(client):
    token = await _signup(client, "eve@example.com")
    h = {"Authorization": f"Bearer {token}"}

    # Create
    r = await client.post(
        "/api/v1/tasks",
        json={"title": "Original", "priority": "low"},
        headers=h,
    )
    assert r.status_code == 201
    tid = r.json()["id"]

    # Update title and status to completed → should log a "completed" action with a diff
    r = await client.patch(
        f"/api/v1/tasks/{tid}",
        json={"title": "Final", "status": "completed"},
        headers=h,
    )
    assert r.status_code == 200

    # Reopen — back to pending → should log "reopened"
    r = await client.patch(
        f"/api/v1/tasks/{tid}", json={"status": "pending"}, headers=h
    )
    assert r.status_code == 200

    # Read activity
    r = await client.get(f"/api/v1/tasks/{tid}/activity", headers=h)
    assert r.status_code == 200
    activity = r.json()
    actions = [a["action"] for a in activity]
    # Newest first
    assert actions == ["reopened", "completed", "created"]
    completed = next(a for a in activity if a["action"] == "completed")
    assert "title" in completed["details"]["changed"]
    assert completed["details"]["changed"]["title"] == {"from": "Original", "to": "Final"}


@pytest.mark.asyncio
async def test_activity_is_owner_scoped(client):
    a_token = await _signup(client, "alice2@example.com")
    b_token = await _signup(client, "bob2@example.com")

    r = await client.post(
        "/api/v1/tasks",
        json={"title": "Alice's note"},
        headers={"Authorization": f"Bearer {a_token}"},
    )
    tid = r.json()["id"]

    # Bob cannot read Alice's activity — same 404 contract as the task itself.
    r = await client.get(
        f"/api/v1/tasks/{tid}/activity",
        headers={"Authorization": f"Bearer {b_token}"},
    )
    assert r.status_code == 404
