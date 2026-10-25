import csv
import datetime
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.api.v1.deps import get_current_user
from app.core.exceptions import ForbiddenException, NotFoundException
from app.db.session import get_db
from app.models.models import HealthMeasurement, User
from app.schemas.schemas import (
    HealthMeasurementCreate,
    HealthMeasurementResponse,
    HealthMeasurementUpdate,
    HealthMetricSummary,
)
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/metrics", tags=["Health Metrics"])

@router.get("", response_model=List[HealthMeasurementResponse])
def list_metrics(
    metric_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(HealthMeasurement).filter(HealthMeasurement.user_id == current_user.id)
    if metric_type:
        q = q.filter(HealthMeasurement.metric_type == metric_type)
    return q.order_by(HealthMeasurement.recorded_at.desc()).limit(limit).all()

@router.post("", response_model=HealthMeasurementResponse, status_code=status.HTTP_201_CREATED)
def create_metric(
    metric_in: HealthMeasurementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meas = HealthMeasurement(
        user_id=current_user.id,
        metric_type=metric_in.metric_type,
        value=metric_in.value,
        secondary_value=metric_in.secondary_value,
        unit=metric_in.unit,
        recorded_at=metric_in.recorded_at or datetime.datetime.utcnow(),
        source=metric_in.source or "Manual Entry",
        notes=metric_in.notes,
    )
    db.add(meas)
    db.commit()
    db.refresh(meas)

    AuditService.log_event(
        db,
        action="METRIC_RECORDED",
        user_id=current_user.id,
        resource_type="HealthMeasurement",
        resource_id=str(meas.id),
        details={"metric": meas.metric_type, "value": meas.value},
    )
    return meas

@router.get("/summary", response_model=List[HealthMetricSummary])
def get_metrics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    metric_types = ["blood_pressure", "blood_glucose", "heart_rate", "hba1c", "bmi", "weight"]
    summaries = []

    for m_type in metric_types:
        records = (
            db.query(HealthMeasurement)
            .filter(HealthMeasurement.user_id == current_user.id, HealthMeasurement.metric_type == m_type)
            .order_by(HealthMeasurement.recorded_at.desc())
            .all()
        )
        if not records:
            continue

        latest = records[0]
        vals = [r.value for r in records]
        avg_val = sum(vals) / len(vals)

        # Evaluate clinical status
        status_label = "normal"
        if m_type == "blood_glucose":
            if latest.value >= 126:
                status_label = "elevated"
            elif latest.value < 70:
                status_label = "low"
        elif m_type == "blood_pressure":
            if latest.value >= 130 or (latest.secondary_value and latest.secondary_value >= 80):
                status_label = "elevated"
        elif m_type == "heart_rate":
            if latest.value > 100 or latest.value < 60:
                status_label = "irregular"
        elif m_type == "hba1c":
            if latest.value >= 5.7:
                status_label = "elevated"

        summaries.append(
            HealthMetricSummary(
                metric_type=m_type,
                unit=latest.unit,
                latest_value=latest.value,
                latest_secondary=latest.secondary_value,
                latest_date=latest.recorded_at,
                min_value=min(vals),
                max_value=max(vals),
                average=round(avg_val, 1),
                status=status_label,
            )
        )

    return summaries

@router.patch("/{metric_id}", response_model=HealthMeasurementResponse)
def update_metric(
    metric_id: int,
    update_in: HealthMeasurementUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meas = db.query(HealthMeasurement).filter(HealthMeasurement.id == metric_id).first()
    if not meas:
        raise NotFoundException("Metric measurement not found")
    if meas.user_id != current_user.id:
        raise ForbiddenException()

    if update_in.value is not None:
        meas.value = update_in.value
    if update_in.secondary_value is not None:
        meas.secondary_value = update_in.secondary_value
    if update_in.unit is not None:
        meas.unit = update_in.unit
    if update_in.recorded_at is not None:
        meas.recorded_at = update_in.recorded_at
    if update_in.notes is not None:
        meas.notes = update_in.notes

    db.commit()
    db.refresh(meas)
    return meas

@router.delete("/{metric_id}")
def delete_metric(
    metric_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meas = db.query(HealthMeasurement).filter(HealthMeasurement.id == metric_id).first()
    if not meas:
        raise NotFoundException("Metric measurement not found")
    if meas.user_id != current_user.id:
        raise ForbiddenException()

    db.delete(meas)
    db.commit()
    return {"message": "Health measurement deleted"}

@router.get("/export/csv")
def export_metrics_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    records = (
        db.query(HealthMeasurement)
        .filter(HealthMeasurement.user_id == current_user.id)
        .order_by(HealthMeasurement.recorded_at.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Metric Type", "Primary Value", "Secondary Value", "Unit", "Recorded At", "Source", "Notes"])

    for r in records:
        writer.writerow([
            r.id,
            r.metric_type,
            r.value,
            r.secondary_value or "",
            r.unit,
            r.recorded_at.isoformat(),
            r.source or "",
            r.notes or "",
        ])

    AuditService.log_event(
        db,
        action="METRICS_EXPORT_CSV",
        user_id=current_user.id,
        resource_type="HealthMeasurement",
        details={"record_count": len(records)},
    )

    return PlainTextResponse(output.getvalue(), media_type="text/csv")
