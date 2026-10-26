import datetime
import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.core.security import sign_audit_payload
from app.models.models import AuditEvent

class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        user_id: Optional[int] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        outcome: str = "success",
    ) -> AuditEvent:
        now = datetime.datetime.utcnow()
        # Compute tamper-evident payload hash
        payload_data = f"{user_id}|{action}|{resource_type}|{resource_id}|{outcome}|{ip_address}|{now.isoformat()}"
        checksum = sign_audit_payload(payload_data)

        event = AuditEvent(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            outcome=outcome,
            checksum=checksum,
            timestamp=now,
        )
        db.add(event)
        try:
            db.commit()
            db.refresh(event)
        except Exception:
            db.rollback()
        return event
