import pytest

def test_health_check(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "MediPredict AI"

def test_register_and_login(client):
    email = "testuser1@medipredict.ai"
    password = "SecurePassword123!"

    # 1. Register
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User 1"},
    )
    assert reg_resp.status_code == 201
    user_data = reg_resp.json()
    assert user_data["email"] == email

    # Duplicate registration check
    dup_resp = client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Test User Duplicate"},
    )
    assert dup_resp.status_code == 400

    # 2. Login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Login with wrong password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword!"},
    )
    assert bad_login.status_code == 401

def test_unauthenticated_protected_route(client):
    # Trying to get current user without token
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401

def test_idor_protection(client):
    # Register User A
    user_a_email = "usera@medipredict.ai"
    client.post(
        "/api/v1/auth/register",
        json={"email": user_a_email, "password": "PasswordA123!", "full_name": "User Alpha"},
    )
    token_a = client.post(
        "/api/v1/auth/login",
        json={"email": user_a_email, "password": "PasswordA123!"},
    ).json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    user_b_email = "userb@medipredict.ai"
    client.post(
        "/api/v1/auth/register",
        json={"email": user_b_email, "password": "PasswordB123!", "full_name": "User Beta"},
    )
    token_b = client.post(
        "/api/v1/auth/login",
        json={"email": user_b_email, "password": "PasswordB123!"},
    ).json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a medical report
    rep_resp = client.post(
        "/api/v1/reports/upload",
        data={"title": "Alpha Confidential Report", "report_type": "Lipid Panel", "raw_text": "Total Cholesterol: 210 mg/dL"},
        headers=headers_a,
    )
    assert rep_resp.status_code == 201
    report_id = rep_resp.json()["id"]

    # User B attempts to access User A's report (IDOR Attack)
    idor_access = client.get(f"/api/v1/reports/{report_id}", headers=headers_b)
    assert idor_access.status_code == 403, "User B must not be permitted to view User A's report"

    # User B attempts to delete User A's report
    idor_delete = client.delete(f"/api/v1/reports/{report_id}", headers=headers_b)
    assert idor_delete.status_code == 403, "User B must not be permitted to delete User A's report"
