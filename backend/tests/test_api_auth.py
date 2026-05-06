import pytest

def test_register_user(client):
    response = client.post("/auth/register", json={
        "name": "Test User",
        "email": "newuser@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user_email"] == "newuser@example.com"
    # Check if cookie is set
    assert "authToken" in response.cookies

def test_login_user(client, sample_user):
    response = client.post("/auth/login", json={
        "email": sample_user.email,
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "authToken" in response.cookies

def test_login_invalid_password(client, sample_user):
    response = client.post("/auth/login", json={
        "email": sample_user.email,
        "password": "wrongpassword"
    })
    assert response.status_code == 401
