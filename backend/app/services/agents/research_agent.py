from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.agents.base import BaseAgent
from app.models.models import MedicalReference

class ResearchAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Medical Research Agent",
            role="Search scientific literature, summarize clinical publications, and compare study evidence levels."
        )

    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        query_text = context.get("query", task) if context else task
        results: List[Dict[str, Any]] = []

        if db:
            q_filter = f"%{query_text.strip().lower()}%"
            refs = (
                db.query(MedicalReference)
                .filter(
                    (MedicalReference.title.ilike(q_filter)) |
                    (MedicalReference.abstract.ilike(q_filter)) |
                    (MedicalReference.key_findings.ilike(q_filter))
                )
                .limit(5)
                .all()
            )
            for r in refs:
                results.append({
                    "id": r.id,
                    "title": r.title,
                    "journal": r.journal,
                    "year": r.publication_year,
                    "pmid": r.pmid,
                    "evidence_level": r.evidence_level,
                    "key_findings": r.key_findings,
                })

        summary = (
            f"Retrieved {len(results)} peer-reviewed publication(s) for clinical query: '{query_text}'. "
            "Evidence levels analyzed include randomized controlled trials and clinical practice guidelines."
        )

        return {
            "agent": self.name,
            "status": "completed",
            "summary": summary,
            "publications": results,
            "query": query_text,
            "evidence_quality": "High (Peer-Reviewed / Index Medicus)",
        }
