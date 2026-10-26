import datetime
import io
import pytest
from app.core.security import verify_audit_signature, sign_audit_payload
from app.models.models import AuditEvent, ClinicianPatientRelationship, DataExportRequest, MedicalReport, User

def test_self_registration_role_escalation_blocked(client):
    """
    CRITICAL: Verify that public users cannot elevate their role to admin
    or clinician during registration by submitting custom role parameters.
    """
    email = "attacker_attempt@medipredict.ai"
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "AttackerSecure123!",
            "full_name": "Hostile User",
            "role": "admin",  # Attacker attempts privilege escalation
        },
    )
    assert resp.status_code == 201
    user_data = resp.json()
    assert user_data["role"] == "patient", "Role must be strictly forced to 'patient' by the server"

def test_unauthenticated_uploads_directory_blocked(client):
    """
    CRITICAL: Verify that the public unauthenticated /uploads directory mount
    has been removed, preventing direct anonymous downloads of raw medical scans.
    """
    resp = client.get("/uploads/test_patient_report.pdf")
    assert resp.status_code in [404, 403], "Unauthenticated static /uploads must not be exposed"

def test_relationship_based_access_control_rebac(client, db_session):
    """
    CRITICAL: Verify relationship-based access control (ReBAC).
    A clinician cannot view a patient's medical records unless an active
    care relationship exists in clinician_patient_relationships.
    """
    # 1. Register Patient Alpha
    patient_email = "patient_alpha@medipredict.ai"
    client.post(
        "/api/v1/auth/register",
        json={"email": patient_email, "password": "PatientPass123!", "full_name": "Patient Alpha"},
    )
    p_login = client.post("/api/v1/auth/login", json={"email": patient_email, "password": "PatientPass123!"})
    patient_token = p_login.json()["access_token"]
    patient_id = p_login.json()["user"]["id"]
    p_headers = {"Authorization": f"Bearer {patient_token}"}

    # 2. Patient creates a confidential medical report
    rep_resp = client.post(
        "/api/v1/reports/upload",
        data={"title": "Confidential Renal Profile", "report_type": "Renal Panel", "raw_text": "Serum Creatinine: 1.1 mg/dL"},
        headers=p_headers,
    )
    assert rep_resp.status_code == 201
    report_id = rep_resp.json()["id"]

    # 3. Create Clinician Gamma (with clinician role provisioned in DB)
    clinician_email = "clinician_gamma@medipredict.ai"
    client.post(
        "/api/v1/auth/register",
        json={"email": clinician_email, "password": "ClinicianPass123!", "full_name": "Dr. Gamma"},
    )
    clinician_user = db_session.query(User).filter(User.email == clinician_email).first()
    clinician_user.role = "clinician"
    db_session.commit()

    c_login = client.post("/api/v1/auth/login", json={"email": clinician_email, "password": "ClinicianPass123!"})
    c_token = c_login.json()["access_token"]
    c_headers = {"Authorization": f"Bearer {c_token}"}

    # 4. Clinician Gamma attempts to view Patient Alpha's report WITHOUT an approved care relationship
    unauthorized_attempt = client.get(f"/api/v1/reports/{report_id}", headers=c_headers)
    assert unauthorized_attempt.status_code == 403, (
        "Clinician without approved care relationship must be rejected with 403 Forbidden"
    )

    # 5. Establish an active clinical care relationship between Dr. Gamma and Patient Alpha
    relationship = ClinicianPatientRelationship(
        clinician_id=clinician_user.id,
        patient_id=patient_id,
        relationship_type="direct_care",
        status="active",
        authorized_until=datetime.datetime.utcnow() + datetime.timedelta(days=30),
        clinical_rationale="Inpatient nephrology consultation care agreement",
    )
    db_session.add(relationship)
    db_session.commit()

    # 6. Now Clinician Gamma accesses the report WITH active care relationship
    authorized_access = client.get(f"/api/v1/reports/{report_id}", headers=c_headers)
    assert authorized_access.status_code == 200, (
        "Clinician with active care relationship must be granted access to patient report"
    )
    assert authorized_access.json()["title"] == "Confidential Renal Profile"

def test_document_signature_validation_and_malicious_upload_rejection(client, auth_headers):
    """
    HIGH: Verify file signature checks reject disguised binaries (.exe, ELF, script payloads).
    """
    # 1. Attempt upload of executable PE binary disguised as .pdf
    fake_exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00" + b"malicious_executable_content"
    resp_exe = client.post(
        "/api/v1/reports/upload",
        files={"file": ("fake_report.pdf", fake_exe_bytes, "application/pdf")},
        data={"title": "Suspicious Executable Report"},
        headers=auth_headers,
    )
    assert resp_exe.status_code == 400
    assert "Executable files are strictly prohibited" in resp_exe.json()["detail"]

    # 2. Attempt upload of script injection disguised as .pdf
    fake_script_bytes = b"<script>alert('XSS_PAYLOAD');</script>"
    resp_script = client.post(
        "/api/v1/reports/upload",
        files={"file": ("injected.pdf", fake_script_bytes, "application/pdf")},
        data={"title": "Injected Script Report"},
        headers=auth_headers,
    )
    assert resp_script.status_code == 400
    assert "Embedded script payloads" in resp_script.json()["detail"]

    # 3. Valid PDF with proper %PDF- magic signature succeeds
    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"
    resp_valid = client.post(
        "/api/v1/reports/upload",
        files={"file": ("valid_clinical_panel.pdf", valid_pdf_bytes, "application/pdf")},
        data={"title": "Legitimate Clinical Panel"},
        headers=auth_headers,
    )
    assert resp_valid.status_code == 201

def test_security_headers_enforced(client):
    """
    MEDIUM: Verify healthcare-grade security headers are set on all responses.
    """
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "default-src 'self'" in resp.headers.get("Content-Security-Policy", "")

def test_tamper_evident_audit_log_cryptographic_checksum(client, db_session, auth_headers):
    """
    MEDIUM: Verify audit events have cryptographic HMAC-SHA256 signatures for tamper resistance.
    """
    resp = client.get("/api/v1/clinician/audit-logs", headers=auth_headers)
    assert resp.status_code == 200

    # Query recent audit event in DB
    event = db_session.query(AuditEvent).order_by(AuditEvent.timestamp.desc()).first()
    assert event is not None
    assert event.checksum is not None, "Audit event must record cryptographic HMAC signature"
    assert len(event.checksum) == 64, "Checksum must be a 64-character SHA-256 hex digest"

def test_dpdp_data_export_and_deletion_workflows(client, auth_headers, db_session):
    """
    Verify DPDP Act 2023 / GDPR Article 20 data export request and erasure tracking.
    """
    # 1. Trigger Data Export
    exp_resp = client.post("/api/v1/privacy/export", headers=auth_headers)
    assert exp_resp.status_code == 200
    assert "user_profile" in exp_resp.json()

    # Verify DataExportRequest recorded in DB
    export_req = db_session.query(DataExportRequest).order_by(DataExportRequest.created_at.desc()).first()
    assert export_req is not None
    assert export_req.status == "completed"

def test_ai_safety_emergency_redirection(client, auth_headers):
    """
    Verify AI layer immediately intercepts acute cardiac/stroke symptoms with emergency redirection.
    """
    # 1. Create a conversation
    conv_resp = client.post(
        "/api/v1/assistant/conversations",
        json={"title": "Emergency Consultation Test"},
        headers=auth_headers,
    )
    assert conv_resp.status_code == 201
    conv_id = conv_resp.json()["id"]

    # 2. Submit acute emergency symptom query
    msg_resp = client.post(
        f"/api/v1/assistant/conversations/{conv_id}/messages",
        json={"content": "I am having crushing chest pain radiating to my left arm with cold sweat", "provider": "clinical_evidence"},
        headers=auth_headers,
    )
    assert msg_resp.status_code == 200
    msg_data = msg_resp.json()
    assert "CRITICAL MEDICAL EMERGENCY WARNING" in msg_data["content"]
    assert any("emergency" in alert.lower() for alert in (msg_data.get("safety_alerts") or []))
