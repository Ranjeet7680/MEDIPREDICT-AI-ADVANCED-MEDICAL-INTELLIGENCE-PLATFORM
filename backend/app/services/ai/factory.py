import logging
from typing import Any, Dict
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.clinical_evidence import ClinicalEvidenceProvider
from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.local_provider import LocalProvider
from app.services.ai.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

class AIProviderFactory:
    @staticmethod
    def get_provider(preferred_provider: str = None) -> BaseAIProvider:
        choice = (preferred_provider or settings.AI_PROVIDER).lower()

        if choice == "gemini":
            gemini = GeminiProvider()
            if gemini.is_configured():
                return gemini
            logger.info("Gemini requested but not configured with GEMINI_API_KEY. Defaulting to Clinical Evidence Provider.")
            return ClinicalEvidenceProvider()

        elif choice == "openai":
            openai_p = OpenAIProvider()
            if openai_p.is_configured():
                return openai_p
            logger.info("OpenAI requested but not configured with OPENAI_API_KEY. Defaulting to Clinical Evidence Provider.")
            return ClinicalEvidenceProvider()

        elif choice == "local":
            return LocalProvider()

        return ClinicalEvidenceProvider()

    @staticmethod
    def get_all_provider_status() -> Dict[str, Dict[str, Any]]:
        gemini = GeminiProvider()
        openai_p = OpenAIProvider()
        local_p = LocalProvider()
        evidence_p = ClinicalEvidenceProvider()

        return {
            "clinical_evidence": {
                "name": "MediPredict Evidence Engine",
                "configured": True,
                "model": "v1.0 (PubMed/Guideline Grounded)",
                "description": "Offline deterministic medical intelligence engine grounded in peer-reviewed clinical guidelines and lab ranges.",
            },
            "gemini": {
                "name": "Google Gemini",
                "configured": gemini.is_configured(),
                "model": settings.GEMINI_MODEL,
                "description": "Official Google Gen AI LLM with evidence-grounded prompt engineering.",
            },
            "openai": {
                "name": "OpenAI",
                "configured": openai_p.is_configured(),
                "model": settings.OPENAI_MODEL,
                "description": "OpenAI GPT models with clinical safety boundaries.",
            },
            "local": {
                "name": "Local LLM Inference",
                "configured": local_p.is_configured(),
                "model": settings.LOCAL_MODEL_BASE_URL,
                "description": "Self-hosted local endpoint (e.g. Ollama or vLLM).",
            },
        }
