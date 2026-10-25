import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.exceptions import NotFoundException
from app.db.session import get_db
from app.models.models import Device, DeviceConnection, User
from app.schemas.schemas import (
    DeviceCreate,
    DeviceResponse,
    DeviceStatusResponse,
    DeviceUpdate,
)
from app.services.audit.audit_service import AuditService

router = APIRouter(prefix="/devices", tags=["Connected Devices"])

@router.post("", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
def register_device(
    payload: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device_id = payload.id or f"dev_{uuid.uuid4().hex[:10]}"

    device = Device(
        id=device_id,
        user_id=current_user.id,
        device_name=payload.device_name,
        device_type=payload.device_type,
        model_number=payload.model_number,
        serial_number=payload.serial_number,
        mac_address=payload.mac_address,
        connection_protocol=payload.connection_protocol or "https",
        connection_status="disconnected",
        battery_level=100,
        device_metadata=payload.device_metadata or {},
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    AuditService.log_event(
        db,
        action="DEVICE_REGISTER",
        user_id=current_user.id,
        resource_type="Device",
        resource_id=device.id,
        details={"device_type": device.device_type, "device_name": device.device_name},
    )

    return device

@router.get("", response_model=List[DeviceResponse])
def list_devices(
    device_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Device).filter(Device.user_id == current_user.id)
    if device_type:
        q = q.filter(Device.device_type == device_type)
    return q.order_by(Device.created_at.desc()).all()

@router.get("/{device_id}", response_model=DeviceResponse)
def get_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == current_user.id)
        .first()
    )
    if not device:
        raise NotFoundException("Device not found")
    return device

@router.post("/{device_id}/connect", response_model=DeviceStatusResponse)
def connect_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == current_user.id)
        .first()
    )
    if not device:
        raise NotFoundException("Device not found")

    device.connection_status = "connected"
    device.last_seen = datetime.datetime.utcnow()

    # Log connection session
    conn = DeviceConnection(
        device_id=device.id,
        session_id=str(uuid.uuid4()),
        connected_at=datetime.datetime.utcnow(),
        protocol=device.connection_protocol,
    )
    db.add(conn)
    db.commit()
    db.refresh(device)

    return DeviceStatusResponse(
        device_id=device.id,
        connection_status="connected",
        last_seen=device.last_seen,
        battery_level=device.battery_level,
        active_stream=True,
    )

@router.post("/{device_id}/disconnect", response_model=DeviceStatusResponse)
def disconnect_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == current_user.id)
        .first()
    )
    if not device:
        raise NotFoundException("Device not found")

    device.connection_status = "disconnected"
    db.commit()
    db.refresh(device)

    return DeviceStatusResponse(
        device_id=device.id,
        connection_status="disconnected",
        last_seen=device.last_seen,
        battery_level=device.battery_level,
        active_stream=False,
    )

@router.get("/{device_id}/status", response_model=DeviceStatusResponse)
def get_device_status(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == current_user.id)
        .first()
    )
    if not device:
        raise NotFoundException("Device not found")

    return DeviceStatusResponse(
        device_id=device.id,
        connection_status=device.connection_status,
        last_seen=device.last_seen,
        battery_level=device.battery_level,
        active_stream=device.connection_status == "connected",
    )

@router.patch("/{device_id}", response_model=DeviceResponse)
def update_device(
    device_id: str,
    payload: DeviceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == current_user.id)
        .first()
    )
    if not device:
        raise NotFoundException("Device not found")

    if payload.device_name is not None:
        device.device_name = payload.device_name
    if payload.connection_status is not None:
        device.connection_status = payload.connection_status
    if payload.battery_level is not None:
        device.battery_level = payload.battery_level
    if payload.firmware_version is not None:
        device.firmware_version = payload.firmware_version
    if payload.device_metadata is not None:
        device.device_metadata = payload.device_metadata

    device.last_seen = datetime.datetime.utcnow()
    db.commit()
    db.refresh(device)
    return device

@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.user_id == current_user.id)
        .first()
    )
    if not device:
        raise NotFoundException("Device not found")

    db.delete(device)
    db.commit()

    AuditService.log_event(
        db,
        action="DEVICE_REVOKE",
        user_id=current_user.id,
        resource_type="Device",
        resource_id=device_id,
        details={"revoked": True},
    )
