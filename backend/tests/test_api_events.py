import pytest

@pytest.fixture
def auth_client(client, sample_user):
    # Log in to get token and set cookie
    response = client.post("/auth/login", json={
        "email": sample_user.email,
        "password": "password123"
    })
    token = response.json()["access_token"]
    # We can use the authorization header or let the client use the cookie
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client

def test_get_events_empty(auth_client):
    response = auth_client.get("/api/events/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_event(auth_client, sample_category):
    event_data = {
        "title": "Test Event",
        "date": "2026-05-10",
        "startTime": "10:00",
        "endTime": "11:00",
        "category_id": sample_category.id
    }
    response = auth_client.post("/api/events/", json=event_data)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Test Event"
    assert data["date"] == "2026-05-10"

def test_get_events_unauthorized(client):
    response = client.get("/api/events/")
    assert response.status_code == 401
