import csv
import datetime
import io
import re
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from fastapi.responses import FileResponse, PlainTextResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, verify_patient_access
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

def validate_uploaded_document(file_bytes: bytes, filename: str, mime_type: str):
    """
    Validates document safety: file size, prohibited executable binary signatures,
    embedded script injections, and verifies magic byte signatures for PDF/images.
    """
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 15MB size limit.")

    # 1. Prohibited binary signatures
    if file_bytes.startswith(b"MZ"):  # Windows PE binary (.exe, .dll)
        raise HTTPException(status_code=400, detail="Executable files are strictly prohibited.")
    if file_bytes.startswith(b"\x7fELF"):  # Linux ELF binary
        raise HTTPException(status_code=400, detail="Binary executable files are strictly prohibited.")
    if file_bytes.startswith(b"PK\x03\x04") and any(ext in filename.lower() for ext in [".exe", ".jar", ".war"]):
        raise HTTPException(status_code=400, detail="Executable archive packages are prohibited.")
    if file_bytes.startswith(b"#!"):  # Shell scripts
        raise HTTPException(status_code=400, detail="Script execution files are prohibited.")

    # 2. Prevent HTML/script injection
    sample = file_bytes[:1024].lower()
    if b"<script" in sample or b"javascript:" in sample or b"<iframe" in sample:
        raise HTTPException(status_code=400, detail="Embedded script payloads in medical documents are prohibited.")

    # 3. Magic byte signature verification for declared types
    fn_lower = filename.lower()
    if fn_lower.endswith(".pdf"):
        if not file_bytes.startswith(b"%PDF-"):
            raise HTTPException(status_code=400, detail="Invalid PDF file: Missing %PDF- magic signature.")
    elif fn_lower.endswith(".png"):
        if not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(status_code=400, detail="Invalid PNG file: Missing PNG magic signature.")
    elif fn_lower.endswith((".jpg", ".jpeg")):
        if not file_bytes.startswith(b"\xff\xd8\xff"):
            raise HTTPException(status_code=400, detail="Invalid JPEG file: Missing JPEG magic signature.")

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
        raw_name = file.filename or "uploaded_report"
        # Sanitize filename and prevent path traversal
        file_name = re.sub(r'[^a-zA-Z0-9._-]', '_', Path(raw_name).name)
        mime_type = file.content_type or "application/octet-stream"
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # Validate file signature, mime type and security invariants
        validate_uploaded_document(file_bytes, file_name, mime_type)

        # Secure random UUID-prefixed quarantine storage key
        storage_key = f"{uuid.uuid4().hex}_{file_name}"
        saved_path = settings.UPLOAD_DIR / storage_key
        with open(saved_path, "wb") as f:
            f.write(file_bytes)
        file_path = str(saved_path)

        # Multi-format document text extraction: PDF, Image, CSV, Text
        if file_name.lower().endswith(".pdf") or "pdf" in mime_type.lower():
            pdf_text = ReportParser.extract_text_from_pdf_bytes(file_bytes)
            content_text = (pdf_text + "\n" + (raw_text or "")).strip()
        elif file_name.lower().endswith((".png", ".jpg", ".jpeg", ".tiff", ".bmp")) or "image" in mime_type.lower():
            ocr_text = ReportParser.extract_text_from_image_bytes(file_bytes)
            content_text = (ocr_text + "\n" + (raw_text or "")).strip()
        else:
            try:
                decoded = file_bytes.decode("utf-8", errors="ignore")
                content_text = (decoded + "\n" + (raw_text or "")).strip()
            except Exception:
                content_text = raw_text or ""

    # Parse measurements with standard clinical reference intervals
    measurements_data, confidence, requires_verification = ReportParser.parse_text_or_csv(
        content_text, filename=file_name or "report.txt"
    )

    if measurements_data:
        summary_text = f"Extracted {len(measurements_data)} laboratory markers with {int(confidence * 100)}% extraction confidence."
    else:
        summary_text = "No recognized laboratory biomarkers detected in uploaded file. You can add measurements manually or verify document format."
        confidence = 0.0
        requires_verification = True

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
        summary=summary_text,
        extraction_confidence=confidence,
        requires_verification=requires_verification,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    # Add extracted measurements to database
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
        details={"file_name": file_name, "measurements_count": len(measurements_data), "confidence": confidence},
    )

    res = MedicalReportDetailResponse.model_validate(report)
    res.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in report.measurements]
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
    verify_patient_access(report.user_id, current_user, db)

    res = MedicalReportDetailResponse.model_validate(report)
    res.measurements = [LaboratoryMeasurementResponse.model_validate(m) for m in report.measurements]
    return res

@router.get("/{report_id}/download")
def download_original_report_file(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

    if not report.file_path or not Path(report.file_path).exists():
        raise NotFoundException("Original report document is unavailable or expired.")

    AuditService.log_event(
        db,
        action="DOWNLOAD_REPORT_FILE",
        user_id=current_user.id,
        resource_type="MedicalReport",
        resource_id=str(report.id),
        details={"file_name": report.file_name},
    )

    return FileResponse(
        path=report.file_path,
        filename=report.file_name or "medical_report.pdf",
        media_type=report.mime_type or "application/octet-stream",
        headers={"X-Content-Type-Options": "nosniff"},
    )

@router.post("/{report_id}/analyze", response_model=ReportAnalysisResponse)
async def analyze_report_with_ai(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

    provider = AIProviderFactory.get_provider(settings.AI_PROVIDER)

    # Format measurements for LLM
    meas_list = [
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

    analysis = await provider.analyze_report(meas_list)

    # Persist interpretation
    report.ai_interpretation = analysis["ai_interpretation"]
    db.commit()

    AuditService.log_event(
        db,
        action="REPORT_ANALYZE_AI",
        user_id=current_user.id,
        resource_type="MedicalReport",
        resource_id=str(report.id),
        details={"provider": settings.AI_PROVIDER},
    )

    return ReportAnalysisResponse(
        report_id=report.id,
        summary=analysis["summary"],
        key_findings=analysis.get("key_findings", []),
        potential_abnormalities=analysis.get("potential_abnormalities", []),
        ai_interpretation=analysis["ai_interpretation"],
        disclaimer=analysis.get(
            "disclaimer",
            "This analysis is generated by AI for informational and educational support only. "
            "It is not a medical diagnosis. Please consult a qualified clinician."
        ),
    )

@router.post("/{report_id}/measurements", response_model=LaboratoryMeasurementResponse, status_code=status.HTTP_201_CREATED)
def add_measurement(
    report_id: int,
    measurement_in: LaboratoryMeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

    test_name = measurement_in.test_name or "Custom Biomarker"
    value = measurement_in.value if measurement_in.value is not None else 0.0
    unit = measurement_in.unit or ""

    evaluated = ReportParser._evaluate_measurement(test_name, value, unit)

    meas = LaboratoryMeasurement(
        report_id=report.id,
        test_name=test_name,
        category=evaluated.get("category", "General Biochemistry"),
        value=value,
        unit=unit or evaluated.get("unit", "units"),
        reference_low=evaluated.get("reference_low"),
        reference_high=evaluated.get("reference_high"),
        reference_text=measurement_in.reference_text or evaluated.get("reference_text"),
        is_abnormal=evaluated.get("is_abnormal", False),
        flag=measurement_in.flag or evaluated.get("flag", "normal"),
        confidence=1.0,
        user_verified=True,
    )
    db.add(meas)
    db.commit()
    db.refresh(meas)
    return meas

@router.put("/{report_id}/measurements/{measurement_id}", response_model=LaboratoryMeasurementResponse)
@router.patch("/{report_id}/measurements/{measurement_id}", response_model=LaboratoryMeasurementResponse)
def update_measurement(
    report_id: int,
    measurement_id: int,
    update_in: LaboratoryMeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

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
    if report.user_id != current_user.id and current_user.role != "admin":
        raise ForbiddenException("Only the record owner or an administrator can delete this medical report.")

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
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

    lines = [
        "MEDIPREDICT AI — CLINICAL LABORATORY REPORT EXPORT",
        f"Report Title: {report.title}",
        f"Patient: {current_user.full_name} ({current_user.email})",
        f"Date: {report.report_date.strftime('%Y-%m-%d %H:%M UTC')}",
        f"Type: {report.report_type}",
        f"Extraction Confidence: {int(report.extraction_confidence * 100)}%",
        "-" * 60,
        f"{'Test Name':<25} {'Value':<10} {'Unit':<10} {'Flag':<10} {'Reference Interval'}",
        "-" * 60,
    ]
    for m in report.measurements:
        status_flag = m.flag.upper() if m.is_abnormal else "NORMAL"
        lines.append(f"{m.test_name:<25} {m.value:<10} {m.unit:<10} {status_flag:<10} {m.reference_text or ''}")

    lines.append("-" * 60)
    if report.ai_interpretation:
        lines.append(f"\nAI Interpretation & Clinical Notes:\n{report.ai_interpretation}\n")
    lines.append(
        "Disclaimer: This summary is generated for educational and tracking purposes. "
        "It does not replace an official laboratory diagnostic report."
    )

    return PlainTextResponse("\n".join(lines), media_type="text/plain")

@router.get("/{report_id}/export-csv")
def export_report_csv(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Test Name", "Value", "Unit", "Flag", "Reference Interval", "Category", "Verified"])
    for m in report.measurements:
        writer.writerow([m.test_name, m.value, m.unit, m.flag, m.reference_text or "", m.category or "", m.user_verified])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=medipredict_report_{report.id}.csv"},
    )

@router.get("/{report_id}/export-pdf")
def export_report_pdf(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(MedicalReport).filter(MedicalReport.id == report_id).first()
    if not report:
        raise NotFoundException("Medical report not found")
    verify_patient_access(report.user_id, current_user, db)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#00635e'),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#546865'),
        spaceAfter=12,
    )
    normal_style = ParagraphStyle(
        'DocNormal',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0a1e27'),
    )
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=11,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#ffffff'),
    )

    story = []
    story.append(Paragraph("MediPredict AI — Clinical Laboratory Analysis", title_style))
    story.append(Paragraph(
        f"Patient: {current_user.full_name} ({current_user.email}) | "
        f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} | Confidential Patient Health Record",
        subtitle_style
    ))
    story.append(Spacer(1, 8))

    meta_data = [
        [
            Paragraph(f"<b>Report:</b> {report.title}", normal_style),
            Paragraph(f"<b>Category:</b> {report.report_type}", normal_style),
        ],
        [
            Paragraph(f"<b>Confidence:</b> {int(report.extraction_confidence * 100)}%", normal_style),
            Paragraph(f"<b>Clinician Verification:</b> {report.clinician_status or 'Pending Review'}", normal_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f4faff')),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc9c7')),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    meas_data = [
        [
            Paragraph("<b>Biomarker / Test</b>", header_style),
            Paragraph("<b>Result</b>", header_style),
            Paragraph("<b>Unit</b>", header_style),
            Paragraph("<b>Reference Interval</b>", header_style),
            Paragraph("<b>Flag</b>", header_style),
        ]
    ]
    for m in report.measurements:
        flag_color = "#ba1a1a" if m.is_abnormal else "#00635e"
        meas_data.append([
            Paragraph(m.test_name, normal_style),
            Paragraph(str(m.value), normal_style),
            Paragraph(m.unit, normal_style),
            Paragraph(m.reference_text or "—", normal_style),
            Paragraph(f"<font color='{flag_color}'><b>{m.flag.upper()}</b></font>", normal_style),
        ])

    meas_table = Table(meas_data, colWidths=[170, 65, 65, 160, 80])
    meas_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#00635e')),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fbfb')]),
    ]))
    story.append(meas_table)
    story.append(Spacer(1, 12))

    if report.ai_interpretation:
        story.append(Paragraph("<b>Clinical AI Findings & Physiological Interpretation:</b>", normal_style))
        story.append(Spacer(1, 3))
        story.append(Paragraph(report.ai_interpretation, normal_style))
        story.append(Spacer(1, 10))

    story.append(Paragraph(
        "<i>Disclaimer: Generated by MediPredict AI for clinical tracking, education, and decision support. "
        "Not an independent diagnosis. Always correlate with official laboratory documentation and treating physician.</i>",
        subtitle_style
    ))

    doc.build(story)
    pdf_bytes = buffer.getvalue()

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=medipredict_report_{report.id}.pdf"},
    )
