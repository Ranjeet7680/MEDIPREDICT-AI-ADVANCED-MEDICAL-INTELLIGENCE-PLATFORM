import datetime
import hashlib
import json
from typing import List, Union
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.exceptions import ValidationException
from app.db.session import get_db
from app.models.models import Device, SensorMeasurement, User, WearableMeasurement
from app.schemas.schemas import (
    IngestionResult,
    UnifiedSensorPayload,
    WearableIngestionPayload,
)

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion Pipeline"])

VALID_UNITS = {
    "heart_rate": ["beats/min", "bpm"],
    "spo2": ["%", "percent"],
    "temperature": ["degC", "celsius", "degF", "fahrenheit"],
    "blood_pressure_systolic": ["mmHg"],
    "blood_pressure_diastolic": ["mmHg"],
    "glucose": ["mg/dL", "mmol/L"],
    "respiratory_rate": ["breaths/min", "rpm"],
    "steps": ["count", "steps"],
    "active_energy": ["kcal", "calories"],
    "sleep_duration": ["minutes", "hours", "seconds"],
}

def compute_payload_hash(device_id: str, measurement_type: str, value: float, ts_iso: str) -> str:
    content = f"{device_id}_{measurement_type}_{value}_{ts_iso}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()

@router.post("/sensors", response_model=IngestionResult)
def ingest_sensor_measurement(
    payload: Union[UnifiedSensorPayload, List[UnifiedSensorPayload]],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = payload if isinstance(payload, list) else [payload]
    if not items:
        raise ValidationException("Empty ingestion payload.")

    ingested = 0
    duplicates = 0
    rejected = 0

    for item in items:
        # 1. Validation of units
        m_type = item.measurement_type.lower()
        allowed_units = VALID_UNITS.get(m_type)
        if allowed_units and item.unit.lower() not in [u.lower() for u in allowed_units]:
            rejected += 1
            continue

        # 2. Anti-replay and timestamp freshness validation
        now = datetime.datetime.now(datetime.timezone.utc)
        raw_ts = item.timestamp or now
        ts = raw_ts if raw_ts.tzinfo is not None else raw_ts.replace(tzinfo=datetime.timezone.utc)
        if ts < now - datetime.timedelta(days=7) or ts > now + datetime.timedelta(minutes=15):
            rejected += 1
            continue

        # 3. Device ownership boundary check
        device = db.query(Device).filter(Device.id == item.device_id).first()
        if device and device.user_id != current_user.id and current_user.role != "admin":
            rejected += 1
            continue

        ts_iso = ts.isoformat()
        p_hash = compute_payload_hash(item.device_id, m_type, item.value, ts_iso)

        # 2. Duplicate detection
        exists = (
            db.query(SensorMeasurement)
            .filter(SensorMeasurement.payload_hash == p_hash)
            .first()
        )
        if exists:
            duplicates += 1
            continue

        # 3. Quality evaluation
        quality = item.quality_status or "unverified"
        if m_type == "heart_rate" and (item.value < 30 or item.value > 250):
            quality = "flagged"
        elif m_type == "spo2" and (item.value < 50 or item.value > 100):
            quality = "flagged"

        record = SensorMeasurement(
            user_id=current_user.id,
            device_id=item.device_id,
            measurement_type=m_type,
            value=item.value,
            secondary_value=item.secondary_value,
            unit=item.unit,
            timestamp=ts,
            source=item.source or "medical_sensor",
            quality_status=quality,
            raw_payload=item.metadata or {},
            payload_hash=p_hash,
        )
        db.add(record)
        ingested += 1

        # Update device last_seen
        device = db.query(Device).filter(Device.id == item.device_id).first()
        if device:
            device.last_seen = datetime.datetime.utcnow()
            device.connection_status = "connected"

    db.commit()

    return IngestionResult(
        status="success" if ingested > 0 else ("duplicates" if duplicates > 0 else "rejected"),
        ingested_count=ingested,
        rejected_count=rejected,
        duplicate_count=duplicates,
        quality_status="processed",
        message=f"Ingestion pipeline processed {len(items)} record(s). Ingested: {ingested}, Duplicates: {duplicates}, Rejected: {rejected}.",
    )

@router.post("/wearables", response_model=IngestionResult)
def ingest_wearable_records(
    payload: WearableIngestionPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.records:
        raise ValidationException("No wearable records submitted.")

    ingested = 0
    duplicates = 0

    for rec in payload.records:
        # Duplicate detection by source_record_id
        if rec.source_record_id:
            exists = (
                db.query(WearableMeasurement)
                .filter(
                    WearableMeasurement.user_id == current_user.id,
                    WearableMeasurement.source_record_id == rec.source_record_id,
                )
                .first()
            )
            if exists:
                duplicates += 1
                continue

        w_meas = WearableMeasurement(
            user_id=current_user.id,
            device_id=payload.device_id,
            platform=payload.platform.lower(),
            metric_type=rec.metric_type.lower(),
            value=rec.value,
            unit=rec.unit,
            start_time=rec.start_time,
            end_time=rec.end_time,
            source_record_id=rec.source_record_id,
        )
        db.add(w_meas)
        ingested += 1

    db.commit()

    return IngestionResult(
        status="success",
        ingested_count=ingested,
        rejected_count=0,
        duplicate_count=duplicates,
        quality_status="normalized",
        message=f"Wearable synchronization completed ({payload.platform}). Ingested: {ingested}, Duplicates: {duplicates}.",
    )

@router.post("/iot", response_model=IngestionResult)
def ingest_iot_gateway_payload(
    payload: UnifiedSensorPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Delegate to sensor ingestion with IoT source
    payload.source = "iot_gateway"
    return ingest_sensor_measurement(payload, current_user=current_user, db=db)
