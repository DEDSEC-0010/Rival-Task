import pytest


async def _signup(client, email: str) -> str:
    r = await client.post("/api/v1/auth/signup", json={"email": email, "password": "supersecret"})
    assert r.status_code == 201
    return r.json()["token"]


@pytest.mark.asyncio
async def test_filter_search_sort_and_pagination_compose(client):
    token = await _signup(client, "dan@example.com")
    h = {"Authorization": f"Bearer {token}"}

    # Seed 25 tasks: alternating statuses, varied priorities, varied titles
    statuses = ["pending", "in_progress", "completed"]
    priorities = ["low", "medium", "high"]
    for i in range(25):
        title = f"Buy milk {i}" if i % 2 == 0 else f"Walk dog {i}"
        await client.post(
            "/api/v1/tasks",
            json={
                "title": title,
                "status": statuses[i % 3],
                "priority": priorities[i % 3],
            },
            headers=h,
        )

    # Filter by status=pending
    r = await client.get("/api/v1/tasks", params={"status": "pending"}, headers=h)
    assert r.status_code == 200
    pending_total = r.json()["total"]
    assert pending_total > 0
    assert all(t["status"] == "pending" for t in r.json()["items"])

    # Search by title "milk" — should only return "Buy milk N"
    r = await client.get("/api/v1/tasks", params={"search": "milk"}, headers=h)
    assert r.status_code == 200
    items = r.json()["items"]
    assert all("milk" in t["title"].lower() for t in items)

    # Sort by priority desc — first item should be high priority
    r = await client.get("/api/v1/tasks", params={"sort": "priority", "order": "desc", "page_size": 5}, headers=h)
    assert r.status_code == 200
    items = r.json()["items"]
    assert items[0]["priority"] == "high"

    # Pagination: page_size=10, page=1 returns 10, page=3 returns 5
    r = await client.get("/api/v1/tasks", params={"page": 1, "page_size": 10}, headers=h)
    body = r.json()
    assert body["total"] == 25
    assert body["total_pages"] == 3
    assert len(body["items"]) == 10

    r = await client.get("/api/v1/tasks", params={"page": 3, "page_size": 10}, headers=h)
    assert len(r.json()["items"]) == 5

    # Composed: status=pending + search=milk + sort=created_at desc + paginated
    r = await client.get(
        "/api/v1/tasks",
        params={"status": "pending", "search": "milk", "sort": "created_at", "order": "desc", "page_size": 50},
        headers=h,
    )
    assert r.status_code == 200
    items = r.json()["items"]
    assert all(t["status"] == "pending" and "milk" in t["title"].lower() for t in items)
