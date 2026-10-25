from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.services.agents.base import BaseAgent
from app.services.document_processing.report_parser import ReportParser

class MedicalReportAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Medical Report Agent",
            role="Extract laboratory measurements, identify reference intervals, flag abnormal values, and summarize reports."
        )

    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        raw_text = context.get("raw_text", task) if context else task
        
        # Parse lab measurements
        measurements, confidence, req_verification = ReportParser.parse_text_or_csv(raw_text)
        
        abnormal_count = sum(1 for m in measurements if m.get("is_abnormal"))
        critical_count = sum(1 for m in measurements if m.get("flag") == "critical")
        
        summary = (
            f"Extracted {len(measurements)} laboratory biomarker(s) with {confidence*100:.0f}% confidence. "
            f"Identified {abnormal_count} out-of-range measurement(s) ({critical_count} critical)."
        )
        
        human_review_required = confidence < 0.85 or critical_count > 0
        
        return {
            "agent": self.name,
            "status": "completed",
            "summary": summary,
            "measurements_extracted": measurements,
            "confidence_score": confidence,
            "abnormal_count": abnormal_count,
            "human_review_required": human_review_required,
            "recommendation": "Review highlighted biomarkers and confirm values before clinical sign-off."
        }
