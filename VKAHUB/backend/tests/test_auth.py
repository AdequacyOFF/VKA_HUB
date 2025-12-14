"""Authentication tests"""

import pytest
from fastapi.testclient import TestClient


def test_register(client: TestClient):
    """Test user registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "login": "testuser",
            "password": "password123",
            "password_confirm": "password123"
        }
    )
    assert response.status_code in [200, 201]


def test_login(client: TestClient):
    """Test user login"""
    # First register
    client.post(
        "/api/auth/register",
        json={
            "login": "logintest",
            "password": "password123",
            "password_confirm": "password123"
        }
    )

    # Then login
    response = client.post(
        "/api/auth/login",
        json={
            "login": "logintest",
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
