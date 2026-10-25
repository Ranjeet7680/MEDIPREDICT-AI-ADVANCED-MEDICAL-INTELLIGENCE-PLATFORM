import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import MedicalReport, User
from app.schemas.schemas import ClinicianReportResponse, ClinicianReviewRequest, LaboratoryMeasurementResponse
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/clinician", tags=["Clinician Workspace"])

def verify_clinician(user: User):
    if user.role not in ["clinician", "researcher", "admin"]:
        raise ForbiddenException("Access restricted to authorized clinical staff.")

@router.get("/reports", response_model=List[ClinicianReportResponse])
def list_clinician_reports(
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_clinician(current_user)

    q = db.query(MedicalReport)
    if status_filter:
        q = q.filter(MedicalReport.clinician_status == status_filter)

    reports = q.order_by(MedicalReport.created_at.desc()).limit(100).all()

    result = []
    for r in reports:
        patient = db.query(User).filter(User.id == r.user_id).first()
        item = ClinicianReportResponse.model_validate(r)
        item.patient_name = patient.full_name if patient else "Unknown Patient"
        item.patient_email = patient.email if patient else "unknown"
        item.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in r.measurements]
        item.measurement_count = len(r.measurements)
        item.abnormal_count = sum(1 for m in r.measurements if m.is_abnormal)
        result.append(item)

    AuditService.log_event(
        db,
        action="CLINICIAN_VIEW_QUEUE",
        user_id=current_user.id,
        resource_type="MedicalReport",
        details={"queue_size": len(result)},
    )
    return result

@router.post("/reports/{report_id}/review", response_model=ClinicianReportResponse)
def review_report(
    report_id: int,
    review_in: ClinicianReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_clinician(current_user)

    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")

    report.clinician_id = current_user.id
    report.clinician_notes = review_in.clinician_notes
    report.clinician_status = review_in.status
    report.clinician_reviewed_at = datetime.datetime.utcnow()
    report.status = "verified" if review_in.status == "approved" else report.status

    db.commit()
    db.refresh(report)

    patient = db.query(User).filter(User.id == report.user_id).first()

    AuditService.log_event(
        db,
        action="CLINICIAN_VERIFICATION_SIGN_OFF",
        user_id=current_user.id,
        resource_type="MedicalReport",
        resource_id=str(report.id),
        details={"status": review_in.status, "patient_id": report.user_id},
    )

    res = ClinicianReportResponse.model_validate(report)
    res.patient_name = patient.full_name if patient else "Unknown"
    res.patient_email = patient.email if patient else "unknown"
    res.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in report.measurements]
    res.measurement_count = len(report.measurements)
    res.abnormal_count = sum(1 for m in report.measurements if m.is_abnormal)
    return res
