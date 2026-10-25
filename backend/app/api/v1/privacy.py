import datetime
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.models import (
    Conversation,
    HealthMeasurement,
    MedicalReport,
    PersonalRecord,
    User,
    UserConsent,
)
from app.schemas.schemas import ConsentResponse, ConsentUpdate, PrivacyExportResponse
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/privacy", tags=["Privacy & Consent"])

@router.get("/consent", response_model=List[ConsentResponse])
def get_consents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consents = db.query(UserConsent).filter(UserConsent.user_id == current_user.id).all()
    return consents

@router.patch("/consent", response_model=ConsentResponse)
def update_consent(
    update_in: ConsentUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consent = (
        db.query(UserConsent)
        .filter(
            UserConsent.user_id == current_user.id,
            UserConsent.consent_type == update_in.consent_type,
        )
        .first()
    )
    if not consent:
        consent = UserConsent(
            user_id=current_user.id,
            consent_type=update_in.consent_type,
            granted=update_in.granted,
            version="1.0",
            ip_address=request.client.host if request.client else None,
        )
        db.add(consent)
    else:
        consent.granted = update_in.granted
        consent.ip_address = request.client.host if request.client else None

    db.commit()
    db.refresh(consent)

    AuditService.log_event(
        db,
        action="UPDATE_CONSENT",
        user_id=current_user.id,
        resource_type="UserConsent",
        details={"type": consent.consent_type, "granted": consent.granted},
    )
    return consent

@router.post("/export", response_model=PrivacyExportResponse)
def export_privacy_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # 1. Profile data
    profile = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
    }

    # 2. Reports & measurements
    reports_data = []
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).all()
    for r in reports:
        reports_data.append({
            "title": r.title,
            "report_type": r.report_type,
            "report_date": r.report_date.isoformat(),
            "summary": r.summary,
            "ai_interpretation": r.ai_interpretation,
            "measurements": [
                {
                    "test_name": m.test_name,
                    "value": m.value,
                    "unit": m.unit,
                    "flag": m.flag,
                    "reference": m.reference_text,
                }
                for m in r.measurements
            ],
        })

    # 3. Health measurements
    metrics = db.query(HealthMeasurement).filter(HealthMeasurement.user_id == current_user.id).all()
    metrics_data = [
        {
            "metric_type": m.metric_type,
            "value": m.value,
            "secondary_value": m.secondary_value,
            "unit": m.unit,
            "recorded_at": m.recorded_at.isoformat(),
            "source": m.source,
            "notes": m.notes,
        }
        for m in metrics
    ]

    # 4. Personal records
    records = db.query(PersonalRecord).filter(PersonalRecord.user_id == current_user.id).all()
    records_data = [
        {
            "title": rec.title,
            "category": rec.category,
            "date": rec.record_date.isoformat(),
            "doctor": rec.doctor_or_facility,
            "summary": rec.summary,
            "tags": rec.tags,
        }
        for rec in records
    ]

    # 5. Conversations
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).all()
    convs_data = [
        {
            "title": c.title,
            "created_at": c.created_at.isoformat(),
            "message_count": len(c.messages),
        }
        for c in conversations
    ]

    # 6. Consents
    consents = db.query(UserConsent).filter(UserConsent.user_id == current_user.id).all()
    consents_data = [
        {
            "consent_type": c.consent_type,
            "granted": c.granted,
            "version": c.version,
            "updated_at": c.updated_at.isoformat(),
        }
        for c in consents
    ]

    AuditService.log_event(
        db,
        action="EXPORT_FULL_DATA",
        user_id=current_user.id,
        resource_type="PrivacyExport",
    )

    return {
        "user_profile": profile,
        "reports": reports_data,
        "health_measurements": metrics_data,
        "personal_records": records_data,
        "conversations": convs_data,
        "consents": consents_data,
        "exported_at": datetime.datetime.utcnow(),
    }

@router.post("/account-deletion")
def request_account_deletion(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    db.delete(current_user)
    db.commit()

    AuditService.log_event(
        db,
        action="ACCOUNT_PURGED",
        user_id=user_id,
        resource_type="User",
        details={"status": "all_associated_records_purged"},
    )
    return {"message": "Account and all associated records have been permanently deleted in accordance with data retention rules."}
