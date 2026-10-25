import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.db.session import get_db
from app.models.models import Device, SensorMeasurement, User, WearableMeasurement
from app.schemas.schemas import (
    AnalyticsOverviewResponse,
    DataQualityReport,
    DeviceHealthItem,
)

router = APIRouter(prefix="/analytics", tags=["Healthcare Analytics"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total_sensor = (
        db.query(SensorMeasurement)
        .filter(SensorMeasurement.user_id == current_user.id)
        .count()
    )
    total_wearable = (
        db.query(WearableMeasurement)
        .filter(WearableMeasurement.user_id == current_user.id)
        .count()
    )
    total_measurements = total_sensor + total_wearable

    active_devices = (
        db.query(Device)
        .filter(Device.user_id == current_user.id, Device.connection_status == "connected")
        .count()
    )

    # Average Heart Rate
    hr_avg = (
        db.query(func.avg(SensorMeasurement.value))
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.measurement_type == "heart_rate",
        )
        .scalar()
    )

    # Latest SpO2
    latest_spo2_rec = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.measurement_type == "spo2",
        )
        .order_by(SensorMeasurement.timestamp.desc())
        .first()
    )

    # Latest BP
    latest_bp = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.measurement_type == "blood_pressure_systolic",
        )
        .order_by(SensorMeasurement.timestamp.desc())
        .first()
    )
    bp_str = f"{int(latest_bp.value)}/{int(latest_bp.secondary_value or 80)} mmHg" if latest_bp else "120/80 mmHg"

    # Flagged count
    flagged_count = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.quality_status == "flagged",
        )
        .count()
    )

    quality_score = 98.4 if total_measurements == 0 else max(70.0, 100.0 - (flagged_count * 2.5))

    return AnalyticsOverviewResponse(
        total_measurements=total_measurements,
        active_devices_count=active_devices,
        average_heart_rate=round(float(hr_avg), 1) if hr_avg else 72.0,
        latest_blood_pressure=bp_str,
        latest_spo2=latest_spo2_rec.value if latest_spo2_rec else 98.0,
        data_quality_score=round(quality_score, 1),
        recent_anomalies_count=flagged_count,
        timestamp=datetime.datetime.utcnow(),
    )

@router.get("/device-health", response_model=List[DeviceHealthItem])
def get_device_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    devices = db.query(Device).filter(Device.user_id == current_user.id).all()
    health_items = []

    since = datetime.datetime.utcnow() - datetime.timedelta(hours=24)

    for d in devices:
        count_24h = (
            db.query(SensorMeasurement)
            .filter(SensorMeasurement.device_id == d.id, SensorMeasurement.timestamp >= since)
            .count()
        )
        flagged_24h = (
            db.query(SensorMeasurement)
            .filter(
                SensorMeasurement.device_id == d.id,
                SensorMeasurement.timestamp >= since,
                SensorMeasurement.quality_status == "flagged",
            )
            .count()
        )
        err_rate = round((flagged_24h / count_24h * 100), 2) if count_24h > 0 else 0.0

        health_items.append(
            DeviceHealthItem(
                device_id=d.id,
                device_name=d.device_name,
                device_type=d.device_type,
                status=d.connection_status,
                battery_level=d.battery_level,
                last_seen=d.last_seen,
                data_points_24h=count_24h,
                error_rate=err_rate,
            )
        )

    return health_items

@router.get("/data-quality", response_model=DataQualityReport)
def get_data_quality_report(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = (
        db.query(SensorMeasurement)
        .filter(SensorMeasurement.user_id == current_user.id)
        .count()
    )
    verified = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.quality_status == "verified",
        )
        .count()
    )
    calibrated = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.quality_status == "calibrated",
        )
        .count()
    )
    unverified = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.quality_status == "unverified",
        )
        .count()
    )
    flagged = (
        db.query(SensorMeasurement)
        .filter(
            SensorMeasurement.user_id == current_user.id,
            SensorMeasurement.quality_status == "flagged",
        )
        .count()
    )

    pct = round(((verified + calibrated) / max(1, total)) * 100, 1) if total > 0 else 95.0

    recommendations = [
        "Calibrate peripheral pulse oximeter against clinical standard at regular 30-day intervals.",
        "Ensure BLE wearable is charged above 20% to avoid intermittent dropped packets.",
        "Verify timestamps are synchronized with NTP UTC standard.",
    ]

    return DataQualityReport(
        overall_quality_percentage=pct,
        verified_points=verified,
        calibrated_points=calibrated,
        unverified_points=unverified,
        flagged_outliers=flagged,
        recommendations=recommendations,
    )
