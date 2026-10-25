from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.services.agents.base import BaseAgent
from app.services.ai.factory import AIProviderFactory
from app.services.medical_rag.retrieval_service import MedicalRAGService

class MedicalInformationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Medical Information Agent",
            role="Explain medical terminology, summarize authorized documents, and provide evidence-grounded education."
        )

    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        self.check_safety(task)
        
        # 1. Retrieve PubMed references & clinical guidelines
        retrieved_evidence = MedicalRAGService.retrieve_evidence(db, task, limit=3) if db else []
        
        # 2. Generate response using active provider
        provider = AIProviderFactory.get_provider()
        messages = [{"role": "user", "content": task}]
        ai_response = await provider.generate_response(messages=messages, retrieved_context=retrieved_evidence)
        
        return {
            "agent": self.name,
            "status": "completed",
            "summary": ai_response.get("content", ""),
            "sources": ai_response.get("sources", []),
            "safety_alerts": ai_response.get("safety_alerts", []),
            "disclaimer": "Educational information grounded in clinical literature. Not a medical diagnosis."
        }
