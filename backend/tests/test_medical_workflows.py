import pytest

def test_report_upload_and_extraction(client, auth_headers):
    # Upload text with lab measurements
    lab_text = """
    Patient Lab Panel
    Fasting Glucose: 135 mg/dL
    HbA1c: 6.8 %
    Total Cholesterol: 220 mg/dL
    Hemoglobin: 13.5 g/dL
    """
    resp = client.post(
        "/api/v1/reports/upload",
        data={"title": "Routine Screening", "report_type": "Biochemistry", "raw_text": lab_text},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Routine Screening"
    assert len(data["measurements"]) >= 3

    # Check abnormal flags
    abnormal_items = [m for m in data["measurements"] if m["is_abnormal"]]
    assert len(abnormal_items) >= 2, "Glucose and HbA1c should be flagged as elevated"

    # User correction workflow: update measurement
    meas_id = data["measurements"][0]["id"]
    report_id = data["id"]
    patch_resp = client.patch(
        f"/api/v1/reports/{report_id}/measurements/{meas_id}",
        json={"value": 110.0, "user_verified": True},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["value"] == 110.0
    assert patch_resp.json()["user_verified"] is True

def test_health_metrics_crud_and_summary(client, auth_headers):
    # Create blood glucose reading
    create_resp = client.post(
        "/api/v1/metrics",
        json={
            "metric_type": "blood_glucose",
            "value": 105.0,
            "unit": "mg/dL",
            "source": "Fasting Glucometer",
            "notes": "Post-exercise reading",
        },
        headers=auth_headers,
    )
    assert create_resp.status_code == 201
    metric_id = create_resp.json()["id"]

    # Retrieve summary
    summary_resp = client.get("/api/v1/metrics/summary", headers=auth_headers)
    assert summary_resp.status_code == 200
    summaries = summary_resp.json()
    assert any(s["metric_type"] == "blood_glucose" for s in summaries)

    # Delete reading
    del_resp = client.delete(f"/api/v1/metrics/{metric_id}", headers=auth_headers)
    assert del_resp.status_code == 200

def test_ai_assistant_and_safety_alert(client, auth_headers):
    # Create conversation
    conv_resp = client.post(
        "/api/v1/assistant/conversations",
        json={"title": "Emergency Check Consultation"},
        headers=auth_headers,
    )
    assert conv_resp.status_code == 201
    conv_id = conv_resp.json()["id"]

    # Send critical emergency message
    emergency_msg = "I am having severe crushing chest pain radiating to my left arm and profuse sweating"
    msg_resp = client.post(
        f"/api/v1/assistant/conversations/{conv_id}/messages",
        json={"content": emergency_msg},
        headers=auth_headers,
    )
    assert msg_resp.status_code == 200
    data = msg_resp.json()
    assert "CRITICAL MEDICAL EMERGENCY WARNING" in data["content"]
    assert "Clinical & Regulatory Disclaimer:" in data["content"]

def test_ml_celiac_risk_prediction(client, auth_headers):
    payload = {
        "age": 28,
        "gender": "Female",
        "diabetes": "Yes",
        "diabetes_type": "Type 1",
        "diarrhoea": "inflammatory",
        "abdominal_pain": "yes",
        "short_stature": "no",
        "sticky_stool": "yes",
        "weight_loss": "yes",
        "iga": 2.9,
        "igg": 14.5,
        "igm": 1.2,
    }
    resp = client.post("/api/v1/ml/predict-risk", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "estimated_risk_probability" in data
    assert 0.0 <= data["estimated_risk_probability"] <= 1.0
    assert "model_provenance" in data
    assert "disclaimer" in data
    assert len(data["contributing_factors"]) > 0

def test_research_search_and_bookmarking(client, auth_headers):
    # Search research
    search_resp = client.get("/api/v1/research/search?q=celiac", headers=auth_headers)
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) > 0
    ref_id = results[0]["id"]

    # Bookmark article
    bm_resp = client.post(
        "/api/v1/research/bookmarks",
        json={"reference_id": ref_id, "notes": "Key guideline reference"},
        headers=auth_headers,
    )
    assert bm_resp.status_code == 201
    bm_id = bm_resp.json()["id"]

    # List bookmarks
    list_bm = client.get("/api/v1/research/bookmarks", headers=auth_headers)
    assert list_bm.status_code == 200
    assert any(b["id"] == bm_id for b in list_bm.json())

def test_privacy_data_export(client, auth_headers):
    resp = client.post("/api/v1/privacy/export", headers=auth_headers)
    assert resp.status_code == 200
    export_data = resp.json()
    assert "user_profile" in export_data
    assert "reports" in export_data
    assert "health_measurements" in export_data
    assert "consents" in export_data

def test_report_exports_and_custom_biomarker(client, auth_headers):
    # 1. Create a sample report
    lab_text = "Fasting Glucose: 110 mg/dL\nHbA1c: 5.9 %\nTotal Cholesterol: 215 mg/dL"
    resp = client.post(
        "/api/v1/reports/upload",
        data={"title": "Export Test Panel", "report_type": "Biochemistry", "raw_text": lab_text},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    report_id = resp.json()["id"]

    # 2. Test PDF export endpoint
    pdf_resp = client.get(f"/api/v1/reports/{report_id}/export-pdf", headers=auth_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 500

    # 3. Test CSV export endpoint
    csv_resp = client.get(f"/api/v1/reports/{report_id}/export-csv", headers=auth_headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Test Name,Value,Unit,Flag" in csv_resp.text

    # 4. Test adding custom biomarker measurement
    add_resp = client.post(
        f"/api/v1/reports/{report_id}/measurements",
        json={"test_name": "Serum Ferritin", "value": 180.0, "unit": "ng/mL", "flag": "normal"},
        headers=auth_headers,
    )
    assert add_resp.status_code == 201
    assert add_resp.json()["test_name"] == "Serum Ferritin"
    assert add_resp.json()["value"] == 180.0

def test_empty_report_extraction(client, auth_headers):
    # Upload meaningless text with no lab markers
    resp = client.post(
        "/api/v1/reports/upload",
        data={"title": "Empty Note", "report_type": "Other", "raw_text": "Hello this is a doctor note without any tests"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert len(data["measurements"]) == 0
    assert data["extraction_confidence"] == 0.0
    assert "No recognized laboratory biomarkers" in data["summary"]

