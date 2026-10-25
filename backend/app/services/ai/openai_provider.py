import logging
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.safety import AISafetyLayer

logger = logging.getLogger(__name__)

class OpenAIProvider(BaseAIProvider):
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL or "gpt-4o-mini"
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    def name(self) -> str:
        return "openai"

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        retrieved_context: Optional[List[Dict[str, Any]]] = None,
        report_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured():
            raise ValueError("OpenAI API key is not configured in environment variables.")

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
                "provider": "openai",
                "model": self.model,
            }

        context_str = ""
        sources = []
        if retrieved_context:
            context_str = "\nRetrieved Evidence Grounding:\n" + "\n".join(
                [f"- {c.get('title')} ({c.get('journal', 'Ref')})" for c in retrieved_context]
            )
            sources = retrieved_context

        formatted_messages = [
            {
                "role": "system",
                "content": (
                    "You are MediPredict AI, a clinical informatics assistant. "
                    "Provide evidence-based medical explanations. Do not formulate unsupported diagnoses. "
                    "Ground responses in clinical science and medical reference ranges."
                ),
            }
        ]

        for m in messages[:-1]:
            formatted_messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        formatted_messages.append({"role": "user", "content": f"{user_msg}\n{context_str}"})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": formatted_messages,
            "temperature": 0.2,
            "max_tokens": 1000,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(self.endpoint, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]

        return {
            "content": AISafetyLayer.append_disclaimer(raw_text),
            "sources": sources,
            "safety_alerts": safety_alerts,
            "provider": "openai",
            "model": self.model,
        }

    async def interpret_report(
        self,
        report_title: str,
        measurements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        prompt = (
            f"Analyze laboratory report: '{report_title}'\n"
            f"Results: {measurements}\n"
            "Summarize the findings, note out-of-range parameters, and provide clinical education."
        )
        resp = await self.generate_response([{"role": "user", "content": prompt}])
        return {
            "summary": f"OpenAI Analysis of {report_title}",
            "interpretation": resp["content"],
            "key_findings": [f"{m.get('test_name')}: {m.get('value')} {m.get('unit')}" for m in measurements],
            "abnormalities": [f"{m.get('test_name')} is flagged {m.get('flag')}" for m in measurements if m.get("is_abnormal")],
        }
