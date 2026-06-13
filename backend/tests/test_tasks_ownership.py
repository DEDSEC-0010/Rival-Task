import pytest


async def _signup(client, email: str) -> str:
    r = await client.post("/api/v1/auth/signup", json={"email": email, "password": "supersecret"})
    assert r.status_code == 201
    return r.json()["token"]


@pytest.mark.asyncio
async def test_users_cannot_access_each_others_tasks(client):
    alice_token = await _signup(client, "alice@example.com")
    bob_token = await _signup(client, "bob@example.com")

    # Alice creates a task
    r = await client.post(
        "/api/v1/tasks",
        json={"title": "Alice's secret", "priority": "high"},
        headers={"Authorization": f"Bearer {alice_token}"},
    )
    assert r.status_code == 201, r.text
    task_id = r.json()["id"]

    # Bob tries to GET — 404 (not 403, by design)
    r = await client.get(f"/api/v1/tasks/{task_id}", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 404

    # Bob tries to PATCH
    r = await client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"title": "hacked"},
        headers={"Authorization": f"Bearer {bob_token}"},
    )
    assert r.status_code == 404

    # Bob tries to DELETE
    r = await client.delete(f"/api/v1/tasks/{task_id}", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 404

    # Bob's list is empty
    r = await client.get("/api/v1/tasks", headers={"Authorization": f"Bearer {bob_token}"})
    assert r.status_code == 200
    assert r.json()["total"] == 0

    # Alice can still see her task
    r = await client.get(f"/api/v1/tasks/{task_id}", headers={"Authorization": f"Bearer {alice_token}"})
    assert r.status_code == 200
    assert r.json()["title"] == "Alice's secret"


@pytest.mark.asyncio
async def test_task_create_update_delete_round_trip(client):
    token = await _signup(client, "carol@example.com")
    h = {"Authorization": f"Bearer {token}"}

    r = await client.post("/api/v1/tasks", json={"title": "Original", "priority": "low"}, headers=h)
    assert r.status_code == 201
    tid = r.json()["id"]

    r = await client.patch(f"/api/v1/tasks/{tid}", json={"status": "completed", "title": "Done"}, headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "completed"
    assert r.json()["title"] == "Done"

    r = await client.delete(f"/api/v1/tasks/{tid}", headers=h)
    assert r.status_code == 204

    r = await client.get(f"/api/v1/tasks/{tid}", headers=h)
    assert r.status_code == 404
