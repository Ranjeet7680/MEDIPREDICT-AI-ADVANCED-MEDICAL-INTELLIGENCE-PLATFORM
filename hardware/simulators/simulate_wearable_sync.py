"""
Wearable Ecosystem Batch Synchronization Simulator.

Simulates automated intraday health record batch export from Apple HealthKit (iOS)
and Android Health Connect (Android 14+). Emits resting heart rate samples, cumulative step
counts, active energy burn (kcal), and nocturnal sleep stages into the MediPredict AI
Section 10 Wearable Ingestion Endpoint.
"""

import datetime
import json
import random
import sys
import time
from typing import Dict, Any, List, Optional

try:
    import httpx
except ImportError:
    print("Error: httpx is required. Run 'pip install httpx'.")
    sys.exit(1)

API_BASE_URL = "http://127.0.0.1:8000/api/v1"


class WearableBatchSyncSimulator:
    def __init__(
        self,
        platform: str = "apple_health",
        device_id: Optional[str] = "APPLE-WATCH-S9-HK",
        api_base: str = API_BASE_URL,
        auth_token: Optional[str] = None,
    ):
        self.platform = platform
        self.device_id = device_id
        self.api_base = api_base
        self.auth_token = auth_token

    def generate_daily_batch(self) -> Dict[str, Any]:
        """
        Generate typical day's wearable metrics batch.
        """
        now = datetime.datetime.now(datetime.timezone.utc)
        records: List[Dict[str, Any]] = []

        # 1. Resting Heart Rate
        records.append({
            "metric_type": "resting_heart_rate",
            "value": round(random.uniform(58.0, 66.0), 1),
            "unit": "bpm",
            "start_time": (now - datetime.timedelta(hours=6)).isoformat(),
            "end_time": (now - datetime.timedelta(hours=5)).isoformat(),
            "source_record_id": f"HK-RHR-{int(now.timestamp())}-01",
        })

        # 2. Daily Step Count
        records.append({
            "metric_type": "step_count",
            "value": float(random.randint(6500, 11200)),
            "unit": "steps",
            "start_time": (now - datetime.timedelta(hours=14)).isoformat(),
            "end_time": now.isoformat(),
            "source_record_id": f"HK-STEPS-{int(now.timestamp())}-02",
        })

        # 3. Active Energy Burned
        records.append({
            "metric_type": "active_energy",
            "value": round(random.uniform(380.0, 620.0), 1),
            "unit": "kcal",
            "start_time": (now - datetime.timedelta(hours=14)).isoformat(),
            "end_time": now.isoformat(),
            "source_record_id": f"HK-ENERGY-{int(now.timestamp())}-03",
        })

        # 4. Nocturnal Sleep Duration
        records.append({
            "metric_type": "sleep_duration",
            "value": round(random.uniform(7.2, 8.4), 2),
            "unit": "hours",
            "start_time": (now - datetime.timedelta(hours=16)).isoformat(),
            "end_time": (now - datetime.timedelta(hours=8)).isoformat(),
            "source_record_id": f"HK-SLEEP-{int(now.timestamp())}-04",
        })

        # 5. Blood Oxygen Saturation (SpO2)
        records.append({
            "metric_type": "spo2",
            "value": round(random.uniform(97.5, 99.2), 1),
            "unit": "%",
            "start_time": (now - datetime.timedelta(hours=10)).isoformat(),
            "end_time": (now - datetime.timedelta(hours=10)).isoformat(),
            "source_record_id": f"HK-SPO2-{int(now.timestamp())}-05",
        })

        return {
            "platform": self.platform,
            "device_id": self.device_id,
            "records": records,
        }

    def sync_batch(self) -> Dict[str, Any]:
        """
        Post batch payload to backend ingestion API.
        """
        payload = self.generate_daily_batch()
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        print(f"\n=======================================================")
        print(f"  MediPredict AI - Wearable Sync Simulation")
        print(f"  Platform:    {self.platform.upper()}")
        print(f"  Device ID:   {self.device_id}")
        print(f"  Records:     {len(payload['records'])} entries")
        print(f"  Target:      {self.api_base}/ingestion/wearables")
        print(f"=======================================================\n")

        for r in payload["records"]:
            print(f"  - {r['metric_type']}: {r['value']} {r['unit']} (ID: {r['source_record_id']})")

        url = f"{self.api_base}/ingestion/wearables"
        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers, timeout=5.0)
            result = {
                "status_code": response.status_code,
                "response_body": response.json() if response.status_code < 500 else response.text,
            }

        print(f"\n[HTTP {result['status_code']}] Server Response:")
        print(json.dumps(result["response_body"], indent=2))
        return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Simulate Wearable Ecosystem Data Sync")
    parser.add_argument(
        "--platform",
        choices=["apple_health", "health_connect", "fitbit", "garmin"],
        default="apple_health",
        help="Wearable platform source",
    )
    parser.add_argument("--device-id", default="APPLE-WATCH-S9-HK", help="Device identifier")
    parser.add_argument("--token", default=None, help="Bearer JWT authentication token")

    args = parser.parse_args()
    sim = WearableBatchSyncSimulator(
        platform=args.platform,
        device_id=args.device_id,
        auth_token=args.token,
    )
    sim.sync_batch()
