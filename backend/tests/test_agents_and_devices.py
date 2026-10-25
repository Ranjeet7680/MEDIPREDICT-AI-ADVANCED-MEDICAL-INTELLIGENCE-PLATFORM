import datetime
import pytest
from fastapi.testclient import TestClient

def test_device_lifecycle(client: TestClient, auth_headers: dict):
    # 1. Register device
    dev_payload = {
        "id": "esp32_pulseox_01",
        "device_name": "ESP32 Medical Pulse Oximeter",
        "device_type": "medical_sensor",
        "model_number": "ESP32-MAX30102",
        "connection_protocol": "https",
        "device_metadata": {"sampling_rate_hz": 100},
    }
    reg_resp = client.post("/api/v1/devices", json=dev_payload, headers=auth_headers)
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["id"] == "esp32_pulseox_01"
    assert data["device_name"] == "ESP32 Medical Pulse Oximeter"

    # 2. Connect device
    conn_resp = client.post("/api/v1/devices/esp32_pulseox_01/connect", headers=auth_headers)
    assert conn_resp.status_code == 200
    assert conn_resp.json()["connection_status"] == "connected"

    # 3. Check status
    stat_resp = client.get("/api/v1/devices/esp32_pulseox_01/status", headers=auth_headers)
    assert stat_resp.status_code == 200
    assert stat_resp.json()["active_stream"] is True

    # 4. Disconnect device
    disc_resp = client.post("/api/v1/devices/esp32_pulseox_01/disconnect", headers=auth_headers)
    assert disc_resp.status_code == 200
    assert disc_resp.json()["connection_status"] == "disconnected"

def test_unified_sensor_ingestion_and_duplicate_detection(client: TestClient, auth_headers: dict):
    # Ingest sensor reading
    payload = {
        "device_id": "esp32_pulseox_01",
        "measurement_type": "spo2",
        "value": 98.5,
        "unit": "%",
        "source": "esp32_sensor",
        "quality_status": "calibrated",
        "timestamp": "2026-10-25T10:30:00Z",
    }
    resp1 = client.post("/api/v1/ingestion/sensors", json=payload, headers=auth_headers)
    assert resp1.status_code == 200
    assert resp1.json()["ingested_count"] == 1
    assert resp1.json()["duplicate_count"] == 0

    # Test duplicate detection (same payload and timestamp)
    resp2 = client.post("/api/v1/ingestion/sensors", json=payload, headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["duplicate_count"] == 1
    assert resp2.json()["ingested_count"] == 0

def test_wearable_ingestion(client: TestClient, auth_headers: dict):
    payload = {
        "platform": "apple_health",
        "device_id": "apple_watch_s9",
        "records": [
            {
                "metric_type": "steps",
                "value": 8420,
                "unit": "steps",
                "source_record_id": "apple_health_step_record_101",
            },
            {
                "metric_type": "resting_heart_rate",
                "value": 62.0,
                "unit": "beats/min",
                "source_record_id": "apple_health_hr_record_102",
            },
        ],
    }
    resp = client.post("/api/v1/ingestion/wearables", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["ingested_count"] == 2

def test_healthcare_analytics_endpoints(client: TestClient, auth_headers: dict):
    # Overview
    overview = client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert overview.status_code == 200
    data = overview.json()
    assert "data_quality_score" in data
    assert "total_measurements" in data

    # Device health
    dev_health = client.get("/api/v1/analytics/device-health", headers=auth_headers)
    assert dev_health.status_code == 200
    assert isinstance(dev_health.json(), list)

    # Data quality report
    quality = client.get("/api/v1/analytics/data-quality", headers=auth_headers)
    assert quality.status_code == 200
    q_data = quality.json()
    assert "overall_quality_percentage" in q_data
    assert len(q_data["recommendations"]) > 0

def test_multi_agent_framework(client: TestClient, auth_headers: dict):
    # Run Medical Information Agent
    req_info = {
        "agent_type": "medical_information",
        "task_description": "Explain the role of tTG-IgA in celiac disease serological screening.",
    }
    resp_info = client.post("/api/v1/agents/run", json=req_info, headers=auth_headers)
    assert resp_info.status_code == 201
    info_data = resp_info.json()
    assert info_data["agent_type"] == "medical_information"
    assert info_data["status"] == "completed"
    assert "summary" in info_data["result"]

    # Run Supervisor Agent with a multi-step task
    req_sup = {
        "agent_type": "supervisor",
        "task_description": "Review laboratory findings and check vital sign trends for celiac patient.",
        "context": {"raw_text": "Fasting Glucose: 110 mg/dL\nHbA1c: 5.6 %"},
    }
    resp_sup = client.post("/api/v1/agents/run", json=req_sup, headers=auth_headers)
    assert resp_sup.status_code == 201
    sup_data = resp_sup.json()
    assert "delegated_agents" in sup_data["result"]

    # List runs
    runs = client.get("/api/v1/agents/runs", headers=auth_headers)
    assert runs.status_code == 200
    assert len(runs.json()) >= 2

def test_ml_experiments_tracking(client: TestClient, auth_headers: dict):
    # 1. List models
    models = client.get("/api/v1/ml/models", headers=auth_headers)
    assert models.status_code == 200
    assert len(models.json()) >= 2

    # 2. List experiments
    exp_list = client.get("/api/v1/ml/experiments", headers=auth_headers)
    assert exp_list.status_code == 200
    assert len(exp_list.json()) >= 1

    # 3. Log new experiment
    new_exp = {
        "model_name": "RandomForestClassifier",
        "experiment_name": "Celiac Tree Ensemble Comparison",
        "dataset_name": "celiac_disease_lab_data.csv",
        "parameters": {"n_estimators": 200, "max_depth": 6},
        "metrics": {"roc_auc": 0.938, "accuracy": 0.948},
        "artifact_path": "ml/models/celiac_rf_exp.joblib",
        "version": "1.1.0",
    }
    log_resp = client.post("/api/v1/ml/experiments", json=new_exp, headers=auth_headers)
    assert log_resp.status_code == 201
    assert log_resp.json()["model_name"] == "RandomForestClassifier"
