import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.safety import AISafetyLayer

logger = logging.getLogger(__name__)

class LocalProvider(BaseAIProvider):
    def __init__(self):
        self.base_url = settings.LOCAL_MODEL_BASE_URL.rstrip("/")
        self.endpoint = f"{self.base_url}/chat/completions"

    def name(self) -> str:
        return "local"

    def is_configured(self) -> bool:
        return bool(self.base_url and "localhost" in self.base_url or "http" in self.base_url)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        retrieved_context: Optional[List[Dict[str, Any]]] = None,
        report_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        user_msg = messages[-1]["content"] if messages else ""
        is_emergency, emergency_msg, injection_alert = AISafetyLayer.inspect_query(user_msg)
        safety_alerts = []
        if injection_alert:
            safety_alerts.append(injection_alert)
        if is_emergency:
            safety_alerts.append("CRITICAL: Emergency symptoms reported.")
            return {
                "content": AISafetyLayer.append_disclaimer(emergency_msg),
                "sources": [],
                "safety_alerts": safety_alerts,
                "provider": "local",
                "model": "local-llm",
            }

        payload = {
            "model": "default",
            "messages": messages,
            "temperature": 0.2,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(self.endpoint, json=payload)
                resp.raise_for_status()
                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"Local provider failed, falling back to Clinical Evidence Engine: {e}")
            from app.services.ai.clinical_evidence import ClinicalEvidenceProvider
            fallback = ClinicalEvidenceProvider()
            result = await fallback.generate_response(messages, retrieved_context, report_data)
            result["safety_alerts"].append(f"Notice: Local inference endpoint unreachable ({e}). Served by MediPredict Evidence Engine.")
            return result

        return {
            "content": AISafetyLayer.append_disclaimer(raw_text),
            "sources": retrieved_context or [],
            "safety_alerts": safety_alerts,
            "provider": "local",
            "model": "local-endpoint",
        }

    async def interpret_report(
        self,
        report_title: str,
        measurements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        from app.services.ai.clinical_evidence import ClinicalEvidenceProvider
        return await ClinicalEvidenceProvider().interpret_report(report_title, measurements)
