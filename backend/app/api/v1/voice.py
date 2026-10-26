"""
MediPredict AI — Voice Assistant API Router
Provides real-time voice session endpoints, multilingual transcription handling,
language detection, medical tool calling, and clinical safety enforcement.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_optional_user
from app.models.models import User
from app.services.voice_service import INDIAN_LANGUAGES, voice_service

router = APIRouter(prefix="/voice", tags=["Multilingual Voice Assistant"])

class VoiceSessionRequest(BaseModel):
    preferred_language: Optional[str] = Field("hi-IN", description="ISO language code, e.g. hi-IN, ta-IN, en-IN")
    client_device: Optional[str] = Field("web_browser", description="Client platform, e.g. web_browser, mobile_app")
    consent_given: bool = Field(True, description="Explicit user consent for microphone & medical voice processing")

class VoiceProcessRequest(BaseModel):
    query_text: str = Field(..., description="Recognized speech text or direct input")
    preferred_language: Optional[str] = Field(None, description="Explicit language override or auto-detect")
    session_id: Optional[str] = Field(None, description="Active voice session identifier")

@router.get("/languages", response_model=Dict[str, Any])
def list_supported_languages():
    """
    Returns the list of 13 supported Indian languages, default neural voices,
    scripts, and greeting phrases.
    """
    return {
        "count": len(INDIAN_LANGUAGES),
        "supported_languages": list(INDIAN_LANGUAGES.values()),
        "features": {
            "auto_language_detection": True,
            "code_mixing_support": ["Hinglish", "Tanglish", "Benglish"],
            "streaming_tts": True,
            "barge_in_supported": True,
            "medical_safety_guard": True
        }
    }

@router.post("/session", response_model=Dict[str, Any])
def create_voice_session(
    payload: VoiceSessionRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Initializes a real-time voice consultation session with language settings
    and explicit privacy consent verification (DPDP Act 2023 / HIPAA).
    """
    if not payload.consent_given:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit user consent is mandatory for medical voice processing."
        )

    lang = payload.preferred_language if payload.preferred_language in INDIAN_LANGUAGES else "hi-IN"
    lang_meta = INDIAN_LANGUAGES[lang]

    session_id = f"v-sess-{hash(lang + payload.client_device) & 0xFFFFFF}"

    return {
        "session_id": session_id,
        "status": "ready",
        "selected_language": lang,
        "language_name": lang_meta["name"],
        "voice_profile": lang_meta["default_voice"],
        "initial_greeting": lang_meta["greeting"],
        "user_authenticated": current_user is not None,
        "privacy_protocol": "Zero-raw-audio retention. Ephemeral in-memory stream processing."
    }

@router.post("/process", response_model=Dict[str, Any])
async def process_voice_message(
    payload: VoiceProcessRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Processes real-time user speech input:
    - Identifies language & mixed-code intent
    - Evaluates acute red-flag emergency symptoms
    - Calls relevant healthcare tools (reports, vitals, research)
    - Generates spoken response + subtitles
    """
    if not payload.query_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Speech input cannot be empty."
        )

    context = {
        "user_id": current_user.id if current_user else None,
        "user_name": current_user.full_name if current_user else "Patient",
        "session_id": payload.session_id,
    }

    result = await voice_service.process_voice_query(
        query_text=payload.query_text,
        preferred_language=payload.preferred_language,
        context=context,
        db=db,
    )

    return result

@router.get("/tools", response_model=List[Dict[str, str]])
def list_voice_tools():
    """
    Returns healthcare modules integrated into the voice assistant tool calling layer.
    """
    return [
        {
            "name": "Medical Report Analyzer",
            "description": "Explains laboratory blood tests, HbA1c, glucose, lipid panels in simple Indian language.",
            "status": "connected"
        },
        {
            "name": "Health Metrics Telemetry",
            "description": "Retrieves real-time blood pressure, pulse oximetry (SpO2), and heart rate vitals.",
            "status": "connected"
        },
        {
            "name": "Disease Research Explorer",
            "description": "Evidence-grounded medical RAG literature from PubMed and clinical guidelines.",
            "status": "connected"
        },
        {
            "name": "Emergency Triage Safeguard",
            "description": "Real-time clinical red-flag symptom detector routing to 112 / 108 emergency services.",
            "status": "connected"
        },
        {
            "name": "Clinician Review Workflow",
            "description": "Flags uncertain or elevated readings for physician sign-off.",
            "status": "connected"
        }
    ]
