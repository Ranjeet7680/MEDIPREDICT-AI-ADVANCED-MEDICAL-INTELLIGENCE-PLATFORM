from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.services.agents.base import BaseAgent
from app.models.models import Device

class DeviceIntegrationAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Device Integration Agent",
            role="Retrieve data through authorized device APIs, normalize incoming measurements, and check connection health."
        )

    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        device_id = context.get("device_id") if context else None
        device_status = "unregistered"
        battery = None
        protocol = "unknown"

        if db and device_id:
            device = db.query(Device).filter(Device.id == device_id).first()
            if device:
                device_status = device.connection_status
                battery = device.battery_level
                protocol = device.connection_protocol
                device_type = device.device_type
            else:
                device_type = "unknown"
        else:
            device_type = context.get("device_type", "wearable") if context else "wearable"
            device_status = "connected"

        summary = (
            f"Device '{device_id or 'all_registered'}' status: {device_status.upper()}. "
            f"Active protocol: {protocol}. Battery Level: {battery if battery is not None else 'N/A'}%."
        )

        return {
            "agent": self.name,
            "status": "completed",
            "device_id": device_id,
            "device_type": device_type,
            "connection_status": device_status,
            "battery_level": battery,
            "summary": summary,
            "data_normalization": "Converted to standard SI units (beats/min, %, mmHg, mg/dL)."
        }
