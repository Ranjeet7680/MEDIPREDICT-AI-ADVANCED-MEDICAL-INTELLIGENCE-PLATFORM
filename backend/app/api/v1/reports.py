import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import LaboratoryMeasurement, MedicalReport, User
from app.schemas.schemas import (
    LaboratoryMeasurementResponse,
    LaboratoryMeasurementUpdate,
    MedicalReportDetailResponse,
    MedicalReportResponse,
    ReportAnalysisResponse,
)
from app.services.ai.factory import AIProviderFactory
from app.services.audit.audit_service import AuditService
from app.services.document_processing.report_parser import ReportParser

router = APIRouter(prefix="/reports", tags=["Medical Reports"])

@router.get("", response_model=List[MedicalReportResponse])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(MedicalReport)
        .filter(MedicalReport.user_id == current_user.id)
        .order_by(MedicalReport.report_date.desc())
        .all()
    )
    result = []
    for r in reports:
        item = MedicalReportResponse.model_validate(r)
        item.measurement_count = len(r.measurements)
        item.abnormal_count = sum(1 for m in r.measurements if m.is_abnormal)
        result.append(item)
    return result

@router.post("/upload", response_model=MedicalReportDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_report(
    title: str = Form("Comprehensive Blood Analysis"),
    report_type: str = Form("Laboratory Blood Panel"),
    raw_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_path = None
    file_name = None
    file_size = 0
    mime_type = "text/plain"
    content_text = raw_text or ""

    if file:
        file_name = file.filename
        mime_type = file.content_type or "application/octet-stream"
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # Security check: size limit 15MB
        if file_size > 15 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds 15MB size limit.")

        saved_path = settings.UPLOAD_DIR / f"{current_user.id}_{int(datetime.datetime.utcnow().timestamp())}_{file_name}"
        with open(saved_path, "wb") as f:
            f.write(file_bytes)
        file_path = str(saved_path)

        # Attempt decoding text or CSV content
        try:
            content_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception:
            content_text = ""

    # Parse measurements
    measurements_data, confidence, requires_verification = ReportParser.parse_text_or_csv(
        content_text, filename=file_name or "report.txt"
    )

    report = MedicalReport(
        user_id=current_user.id,
        title=title,
        report_type=report_type,
        report_date=datetime.datetime.utcnow(),
        file_path=file_path,
        file_name=file_name or "Direct Input",
        file_size=file_size,
        mime_type=mime_type,
        status="processed",
        summary=f"Extracted {len(measurements_data)} laboratory markers with {int(confidence * 100)}% extraction confidence.",
        extraction_confidence=confidence,
        requires_verification=requires_verification,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Add measurements
    for m in measurements_data:
        meas = LaboratoryMeasurement(
            report_id=report.id,
            test_name=m["test_name"],
            category=m.get("category", "General Biochemistry"),
            value=m["value"],
            unit=m["unit"],
            reference_low=m.get("reference_low"),
            reference_high=m.get("reference_high"),
            reference_text=m.get("reference_text"),
            is_abnormal=m.get("is_abnormal", False),
            flag=m.get("flag", "normal"),
            confidence=m.get("confidence", 0.95),
            user_verified=False,
        )
        db.add(meas)
    db.commit()
    db.refresh(report)

    AuditService.log_event(
        db,
        action="REPORT_UPLOAD",
        user_id=current_user.id,
        resource_type="MedicalReport",
        resource_id=str(report.id),
        details={"measurements_count": len(measurements_data)},
    )

    res = MedicalReportDetailResponse.model_validate(report)
    res.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in report.measurements]
    res.measurement_count = len(report.measurements)
    res.abnormal_count = sum(1 for m in report.measurements if m.is_abnormal)
    return res

@router.get("/{report_id}", response_model=MedicalReportDetailResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    if report.user_id != current_user.id:
        raise ForbiddenException()

    res = MedicalReportDetailResponse.model_validate(report)
    res.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in report.measurements]
    res.measurement_count = len(report.measurements)
    res.abnormal_count = sum(1 for m in report.measurements if m.is_abnormal)
    return res

@router.post("/{report_id}/analyze", response_model=ReportAnalysisResponse)
async def analyze_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    if report.user_id != current_user.id:
        raise ForbiddenException()

    meas_dicts = [
        {
            "test_name": m.test_name,
            "value": m.value,
            "unit": m.unit,
            "flag": m.flag,
            "reference_text": m.reference_text,
            "is_abnormal": m.is_abnormal,
        }
        for m in report.measurements
    ]

    provider = AIProviderFactory.get_provider()
    analysis = await provider.interpret_report(report.title, meas_dicts)

    report.ai_interpretation = analysis["interpretation"]
    db.commit()

    return {
        "report_id": report.id,
        "summary": analysis["summary"],
        "ai_interpretation": analysis["interpretation"],
        "key_findings": analysis["key_findings"],
        "potential_abnormalities": analysis["abnormalities"],
        "clinical_disclaimer": "Automated report interpretation is for informational guidance only. Consult your physician for medical diagnosis.",
    }

@router.patch("/{report_id}/measurements/{measurement_id}", response_model=LaboratoryMeasurementResponse)
def update_measurement(
    report_id: int,
    measurement_id: int,
    update_in: LaboratoryMeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report or report.user_id != current_user.id:
        raise ForbiddenException()

    meas = (
        db.query(LaboratoryMeasurement)
        .filter(LaboratoryMeasurement.id == measurement_id, LaboratoryMeasurement.report_id == report_id)
        .first()
    )
    if not meas:
        raise NotFoundException("Measurement not found")

    if update_in.test_name is not None:
        meas.test_name = update_in.test_name
    if update_in.value is not None:
        meas.value = update_in.value
    if update_in.unit is not None:
        meas.unit = update_in.unit
    if update_in.reference_text is not None:
        meas.reference_text = update_in.reference_text
    if update_in.flag is not None:
        meas.flag = update_in.flag
        meas.is_abnormal = meas.flag in ["high", "low", "critical"]
    if update_in.user_verified is not None:
        meas.user_verified = update_in.user_verified

    db.commit()
    db.refresh(meas)
    return meas

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    if report.user_id != current_user.id:
        raise ForbiddenException()

    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}

@router.get("/{report_id}/export")
def export_report_summary(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report or report.user_id != current_user.id:
        raise ForbiddenException()

    lines = [
        f"MEDIPREDICT AI — CLINICAL LABORATORY REPORT EXPORT",
        f"Report Title: {report.title}",
        f"Patient: {current_user.full_name} ({current_user.email})",
        f"Date: {report.report_date.strftime('%Y-%m-%d %H:%M UTC')}",
        f"Type: {report.report_type}",
        f"Extraction Confidence: {int(report.extraction_confidence * 100)}%",
        f"-" * 60,
        f"{'Test Name':<25} {'Value':<10} {'Unit':<10} {'Flag':<10} {'Reference Interval'}",
        f"-" * 60,
    ]
    for m in report.measurements:
        status_flag = m.flag.upper() if m.is_abnormal else "NORMAL"
        lines.append(f"{m.test_name:<25} {m.value:<10} {m.unit:<10} {status_flag:<10} {m.reference_text or ''}")

    lines.append(f"-" * 60)
    if report.ai_interpretation:
        lines.append(f"\nAI Interpretation & Clinical Notes:\n{report.ai_interpretation}\n")
    lines.append(
        "Disclaimer: This summary is generated for educational and tracking purposes. "
        "It does not replace an official laboratory diagnostic report."
    )

    return PlainTextResponse("\n".join(lines), media_type="text/plain")
