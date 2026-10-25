import pytest
from fastapi.testclient import TestClient

def test_unified_search(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/search?q=celiac", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    # verify category and title present
    assert any("celiac" in item["title"].lower() or "celiac" in item["subtitle"].lower() for item in data)

def test_notifications_endpoint(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/notifications", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

    mark_all = client.post("/api/v1/notifications/mark-all-read", headers=auth_headers)
    assert mark_all.status_code == 200
    assert "marked as read" in mark_all.json()["message"]

def test_clinician_workspace_rbac(client: TestClient, auth_headers: dict):
    # 1. Seeded user demo@medipredict.ai is Dr. Sarah Chen (clinician), so access succeeds
    resp_clinician = client.get("/api/v1/clinician/reports", headers=auth_headers)
    assert resp_clinician.status_code == 200
    assert isinstance(resp_clinician.json(), list)

    # 2. Register and log in a standard patient account
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={"email": "patient_rbac@medipredict.ai", "password": "PatientPassword123!", "full_name": "Standard Patient", "role": "patient"},
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "patient_rbac@medipredict.ai", "password": "PatientPassword123!"},
    )
    assert login_resp.status_code == 200
    patient_token = login_resp.json()["access_token"]
    patient_headers = {"Authorization": f"Bearer {patient_token}"}

    # 3. Patient role should be forbidden from accessing clinician queue
    resp_patient = client.get("/api/v1/clinician/reports", headers=patient_headers)
    assert resp_patient.status_code == 403
    assert "Access restricted" in resp_patient.json()["detail"]

def test_admin_dashboard_rbac(client: TestClient, auth_headers: dict):
    # Patient role should be forbidden from accessing admin endpoints
    response = client.get("/api/v1/admin/stats", headers=auth_headers)
    assert response.status_code == 403
    assert "Administrator privileges required" in response.json()["detail"]
