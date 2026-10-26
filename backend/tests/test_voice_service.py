import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_supported_languages():
    response = client.get("/api/v1/voice/languages")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 13
    codes = [l["code"] for l in data["supported_languages"]]
    assert "hi-IN" in codes
    assert "ta-IN" in codes
    assert "bn-IN" in codes
    assert "te-IN" in codes
    assert "mr-IN" in codes
    assert "en-IN" in codes

def test_create_voice_session():
    # Valid session
    response = client.post(
        "/api/v1/voice/session",
        json={"preferred_language": "hi-IN", "client_device": "web_browser", "consent_given": True}
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "ready"
    assert data["selected_language"] == "hi-IN"
    assert "voice_profile" in data

    # Missing consent
    fail_res = client.post(
        "/api/v1/voice/session",
        json={"preferred_language": "hi-IN", "consent_given": False}
    )
    assert fail_res.status_code == 400

def test_voice_process_hindi():
    response = client.post(
        "/api/v1/voice/process",
        json={"query_text": "मेरी ब्लड शुगर रिपोर्ट समझाओ"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "hi-IN"
    assert data["is_emergency"] is False
    assert "subtitles" in data
    assert "native" in data["subtitles"]
    assert "romanized" in data["subtitles"]
    assert "english" in data["subtitles"]

def test_voice_process_code_mixed_hinglish():
    response = client.post(
        "/api/v1/voice/process",
        json={"query_text": "Mera blood test report kya bata raha hai?"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["detected_language"] == "hi-IN"
    assert data["detected_confidence"] >= 0.90

def test_voice_process_emergency_triage():
    # Red-flag symptom should trigger emergency safeguard
    response = client.post(
        "/api/v1/voice/process",
        json={"query_text": "Mujhe acute chest pain aur saans lene me takleef ho rahi hai"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_emergency"] is True
    assert "112" in data["speech_response"] or "108" in data["speech_response"]
    assert "EmergencyTriageGuard" in data["tools_executed"]

def test_list_voice_tools():
    response = client.get("/api/v1/voice/tools")
    assert response.status_code == 200
    tools = response.json()
    tool_names = [t["name"] for t in tools]
    assert "Medical Report Analyzer" in tool_names
    assert "Health Metrics Telemetry" in tool_names
    assert "Emergency Triage Safeguard" in tool_names
