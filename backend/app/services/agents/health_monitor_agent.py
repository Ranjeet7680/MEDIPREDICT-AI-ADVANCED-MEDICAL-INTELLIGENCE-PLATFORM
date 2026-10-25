from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.services.agents.base import BaseAgent
from app.models.models import HealthMeasurement, SensorMeasurement

class HealthMonitoringAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Health Monitoring Agent",
            role="Analyze incoming authorized health measurements, identify unusual trends, and generate informational alerts."
        )

    async def run(self, task: str, context: Optional[Dict[str, Any]] = None, db: Optional[Session] = None) -> Dict[str, Any]:
        user_id = context.get("user_id") if context else None
        alerts: List[str] = []
        recent_stats: Dict[str, Any] = {}

        if db and user_id:
            # Query recent sensor measurements
            sensors = (
                db.query(SensorMeasurement)
                .filter(SensorMeasurement.user_id == user_id)
                .order_by(SensorMeasurement.timestamp.desc())
                .limit(20)
                .all()
            )
            
            for s in sensors:
                if s.measurement_type == "heart_rate" and (s.value > 110 or s.value < 45):
                    alerts.append(f"Unusual heart rate recorded: {s.value} {s.unit} at {s.timestamp.strftime('%H:%M')}")
                elif s.measurement_type == "spo2" and s.value < 93.0:
                    alerts.append(f"Low oxygen saturation alert: {s.value}% {s.unit} at {s.timestamp.strftime('%H:%M')}")
                elif s.measurement_type == "blood_pressure_systolic" and s.value >= 140:
                    alerts.append(f"Elevated systolic BP: {s.value} mmHg")

            recent_stats["evaluated_points"] = len(sensors)
        else:
            recent_stats["evaluated_points"] = context.get("data_points", 1) if context else 1

        is_anomalous = len(alerts) > 0
        summary = (
            f"Evaluated {recent_stats.get('evaluated_points', 0)} physiological data points. "
            f"{'Identified ' + str(len(alerts)) + ' unusual threshold event(s).' if is_anomalous else 'All monitored vitals remain within expected normative ranges.'}"
        )

        return {
            "agent": self.name,
            "status": "completed",
            "summary": summary,
            "alerts": alerts,
            "anomalies_detected": is_anomalous,
            "human_review_required": is_anomalous,
            "disclaimer": "Informational vitals monitoring. Not an automated diagnosis or emergency dispatch alarm."
        }
