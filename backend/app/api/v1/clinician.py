import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user, verify_patient_access
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import AuditEvent, ClinicianPatientRelationship, LaboratoryMeasurement, MedicalReport, User
from app.schemas.schemas import ClinicianReportResponse, ClinicianReviewRequest, LaboratoryMeasurementResponse
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/clinician", tags=["Clinician Workspace"])

def verify_clinician(user: User):
    if user.role not in ["clinician", "admin"]:
        raise ForbiddenException("Access restricted to authorized clinical staff and medical administrators.")

def _compute_triage(report: MedicalReport) -> str:
    """Computes triage priority based on panic/critical biomarker values."""
    for m in report.measurements:
        if m.flag == "critical":
            return "stat_critical"
        name_lower = m.test_name.lower()
        if "glucose" in name_lower and m.value >= 250:
            return "stat_critical"
        if "hba1c" in name_lower and m.value >= 10.5:
            return "stat_critical"
        if "hemoglobin" in name_lower and m.value < 8.0:
            return "stat_critical"
        if "potassium" in name_lower and (m.value < 2.8 or m.value > 6.0):
            return "stat_critical"

    abnormal_count = sum(1 for m in report.measurements if m.is_abnormal)
    if abnormal_count >= 2 or report.requires_verification:
        return "urgent"
    return "routine"

def seed_demo_clinician_cases(db: Session, target_user_id: int):
    """Seeds 5 diverse realistic clinical demo cases for the clinician review workflow."""
    cases_data = [
        {
            "title": "STAT Triage: Diabetic Ketoacidosis Alert Panel",
            "type": "Endocrine Emergency Panel",
            "status": "pending",
            "summary": "Critical panic laboratory values: Fasting Glucose 285 mg/dL, HbA1c 11.4%, Ketonuria. Immediate physician review indicated.",
            "confidence": 0.98,
            "measurements": [
                {"name": "Fasting Glucose", "val": 285.0, "unit": "mg/dL", "low": 70, "high": 99, "flag": "critical", "cat": "Endocrinology"},
                {"name": "HbA1c", "val": 11.4, "unit": "%", "low": 4.0, "high": 5.6, "flag": "critical", "cat": "Endocrinology"},
                {"name": "Serum Potassium", "val": 5.6, "unit": "mmol/L", "low": 3.5, "high": 5.0, "flag": "high", "cat": "Electrolytes"},
                {"name": "Serum Sodium", "val": 131.0, "unit": "mmol/L", "low": 135, "high": 145, "flag": "low", "cat": "Electrolytes"},
            ]
        },
        {
            "title": "Celiac Disease Serology & Small Bowel Panel",
            "type": "Gastroenterology Serology",
            "status": "pending",
            "summary": "Strongly positive tTG-IgA (>100 U/mL) and normal total serum IgA. Meets ACG criteria for duodenal biopsy consideration.",
            "confidence": 0.96,
            "measurements": [
                {"name": "tTG-IgA", "val": 128.0, "unit": "U/mL", "low": 0.0, "high": 10.0, "flag": "high", "cat": "Serology"},
                {"name": "Total Serum IgA", "val": 2.2, "unit": "g/L", "low": 0.8, "high": 3.0, "flag": "normal", "cat": "Immunology"},
                {"name": "Serum Ferritin", "val": 14.0, "unit": "ng/mL", "low": 30.0, "high": 300.0, "flag": "low", "cat": "Iron Studies"},
                {"name": "Hemoglobin", "val": 11.1, "unit": "g/dL", "low": 12.0, "high": 17.5, "flag": "low", "cat": "Hematology"},
            ]
        },
        {
            "title": "Severe Microcytic Anemia Diagnostic Workup",
            "type": "Hematology Diagnostic Panel",
            "status": "escalated",
            "summary": "Marked microcytic hypochromic anemia (Hb 7.6 g/dL, Ferritin 4 ng/mL). Escalated to Hematology clinic.",
            "confidence": 0.95,
            "measurements": [
                {"name": "Hemoglobin", "val": 7.6, "unit": "g/dL", "low": 12.0, "high": 17.5, "flag": "critical", "cat": "Hematology"},
                {"name": "Ferritin", "val": 4.0, "unit": "ng/mL", "low": 30.0, "high": 300.0, "flag": "critical", "cat": "Iron Studies"},
                {"name": "MCV", "val": 64.0, "unit": "fL", "low": 80.0, "high": 100.0, "flag": "low", "cat": "Hematology"},
                {"name": "Platelets", "val": 490.0, "unit": "x10^9/L", "low": 150.0, "high": 450.0, "flag": "high", "cat": "Hematology"},
            ]
        },
        {
            "title": "Annual Executive Cardiovascular Risk Evaluation",
            "type": "Cardiovascular & Lipid Panel",
            "status": "approved",
            "summary": "Moderate hypercholesterolemia (LDL-C 148 mg/dL). Clinically reviewed and approved with lifestyle recommendation.",
            "confidence": 0.97,
            "measurements": [
                {"name": "Total Cholesterol", "val": 224.0, "unit": "mg/dL", "low": 120.0, "high": 200.0, "flag": "high", "cat": "Lipid Panel"},
                {"name": "LDL Cholesterol", "val": 148.0, "unit": "mg/dL", "low": 50.0, "high": 100.0, "flag": "high", "cat": "Lipid Panel"},
                {"name": "HDL Cholesterol", "val": 52.0, "unit": "mg/dL", "low": 40.0, "high": 80.0, "flag": "normal", "cat": "Lipid Panel"},
                {"name": "Triglycerides", "val": 162.0, "unit": "mg/dL", "low": 50.0, "high": 150.0, "flag": "high", "cat": "Lipid Panel"},
                {"name": "hs-CRP", "val": 1.2, "unit": "mg/L", "low": 0.0, "high": 3.0, "flag": "normal", "cat": "Inflammation"},
            ]
        },
        {
            "title": "Thyroid Function & Metabolic Screen",
            "type": "Endocrine Thyroid Screen",
            "status": "pending",
            "summary": "Subclinical hyperthyroidism pattern: suppressed TSH (0.05 mIU/L) with normal Free T4 (1.5 ng/dL).",
            "confidence": 0.96,
            "measurements": [
                {"name": "TSH", "val": 0.05, "unit": "mIU/L", "low": 0.4, "high": 4.0, "flag": "low", "cat": "Endocrinology"},
                {"name": "Free T4", "val": 1.5, "unit": "ng/dL", "low": 0.8, "high": 1.8, "flag": "normal", "cat": "Endocrinology"},
                {"name": "Free T3", "val": 3.8, "unit": "pg/mL", "low": 2.3, "high": 4.2, "flag": "normal", "cat": "Endocrinology"},
            ]
        }
    ]

    for c in cases_data:
        # Check if already seeded by title
        if db.query(MedicalReport).filter(MedicalReport.title == c["title"]).first():
            continue

        report = MedicalReport(
            user_id=target_user_id,
            title=c["title"],
            report_type=c["type"],
            report_date=datetime.datetime.utcnow(),
            file_name=f"{c['title'].replace(' ', '_').lower()}.pdf",
            file_size=24500,
            mime_type="application/pdf",
            status="verified" if c["status"] == "approved" else "processed",
            summary=c["summary"],
            extraction_confidence=c["confidence"],
            requires_verification=c["status"] != "approved",
            clinician_status=c["status"],
            clinician_notes="Reviewed and confirmed by clinical queue reviewer." if c["status"] == "approved" else None,
            clinician_reviewed_at=datetime.datetime.utcnow() if c["status"] == "approved" else None,
        )
        db.add(report)
        db.commit()

    # Ensure an active clinical care relationship is recorded for the clinician
    existing_rel = db.query(ClinicianPatientRelationship).filter(
        ClinicianPatientRelationship.clinician_id == target_user_id,
        ClinicianPatientRelationship.patient_id == target_user_id,
    ).first()
    if not existing_rel:
        rel = ClinicianPatientRelationship(
            clinician_id=target_user_id,
            patient_id=target_user_id,
            relationship_type="triage_evaluation",
            status="active",
            authorized_until=datetime.datetime.utcnow() + datetime.timedelta(days=90),
            clinical_rationale="Clinical review queue triage assignment",
        )
        db.add(rel)
        db.commit()
        db.refresh(report)

        for m in c["measurements"]:
            meas = LaboratoryMeasurement(
                report_id=report.id,
                test_name=m["name"],
                category=m["cat"],
                value=m["val"],
                unit=m["unit"],
                reference_low=m["low"],
                reference_high=m["high"],
                reference_text=f"{m['low']} - {m['high']} {m['unit']}",
                is_abnormal=m["flag"] != "normal",
                flag=m["flag"],
                confidence=0.98,
                user_verified=c["status"] == "approved",
            )
            db.add(meas)
        db.commit()

    # Ensure an active clinical care relationship is recorded for the clinician
    existing_rel = db.query(ClinicianPatientRelationship).filter(
        ClinicianPatientRelationship.clinician_id == target_user_id,
        ClinicianPatientRelationship.patient_id == target_user_id,
    ).first()
    if not existing_rel:
        rel = ClinicianPatientRelationship(
            clinician_id=target_user_id,
            patient_id=target_user_id,
            relationship_type="triage_evaluation",
            status="active",
            authorized_until=datetime.datetime.utcnow() + datetime.timedelta(days=90),
            clinical_rationale="Clinical review queue triage assignment",
        )
        db.add(rel)
        db.commit()

@router.get("/reports", response_model=List[ClinicianReportResponse])
def list_clinician_reports(
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_clinician(current_user)

    # Ensure queue has representative clinical demo cases
    if db.query(MedicalReport).count() < 4:
        seed_demo_clinician_cases(db, current_user.id)

    q = db.query(MedicalReport)
    if status_filter and status_filter != "all":
        q = q.filter(MedicalReport.clinician_status == status_filter)

    reports = q.order_by(MedicalReport.created_at.desc()).limit(100).all()

    result = []
    for r in reports:
        patient = db.query(User).filter(User.id == r.user_id).first()
        item = ClinicianReportResponse.model_validate(r)
        item.patient_name = patient.full_name if patient else "Clinical Test Subject"
        item.patient_email = patient.email if patient else "patient@medipredict.ai"
        item.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in r.measurements]
        item.measurement_count = len(r.measurements)
        item.abnormal_count = sum(1 for m in r.measurements if m.is_abnormal)
        item.triage_priority = _compute_triage(r)
        result.append(item)

    AuditService.log_event(
        db,
        action="CLINICIAN_VIEW_QUEUE",
        user_id=current_user.id,
        resource_type="MedicalReport",
        details={"queue_size": len(result), "filter": status_filter},
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
    report.requires_verification = False if review_in.status == "approved" else True

    db.commit()
    db.refresh(report)

    patient = db.query(User).filter(User.id == report.user_id).first()

    action_label = "CLINICIAN_ESCALATION" if review_in.status == "escalated" else "CLINICIAN_VERIFICATION_SIGN_OFF"
    AuditService.log_event(
        db,
        action=action_label,
        user_id=current_user.id,
        resource_type="MedicalReport",
        resource_id=str(report.id),
        details={
            "status": review_in.status,
            "patient_id": report.user_id,
            "reason": review_in.escalation_reason,
            "department": review_in.escalation_department,
        },
    )

    res = ClinicianReportResponse.model_validate(report)
    res.patient_name = patient.full_name if patient else "Clinical Test Subject"
    res.patient_email = patient.email if patient else "patient@medipredict.ai"
    res.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in report.measurements]
    res.measurement_count = len(report.measurements)
    res.abnormal_count = sum(1 for m in report.measurements if m.is_abnormal)
    res.triage_priority = _compute_triage(report)
    res.escalation_reason = review_in.escalation_reason
    res.escalation_department = review_in.escalation_department
    return res

@router.get("/audit-logs")
def get_clinician_audit_logs(
    limit: int = Query(30, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_clinician(current_user)

    logs = (
        db.query(AuditEvent)
        .filter(AuditEvent.action.like("CLINICIAN_%"))
        .order_by(AuditEvent.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": log.id,
            "action": log.action,
            "user_id": log.user_id,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]

@router.post("/seed-cases")
def trigger_seed_cases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verify_clinician(current_user)
    seed_demo_clinician_cases(db, current_user.id)
    return {"message": "Clinician demo cases successfully refreshed and loaded into queue."}
