"""
Edge Computing & IoT Hardware Gateway Simulator.

Simulates a Raspberry Pi 5 / ESP32-S3 Medical Gateway running edge packet verification.
Transmits ambient clinic telemetry (room temperature, relative humidity, air quality index)
and bridges peripheral multiplexed sensor packets to the MediPredict AI
Section 10 IoT Ingestion Endpoint.
"""

import datetime
import json
import random
import sys
import time
from typing import Dict, Any, Optional

try:
    import httpx
except ImportError:
    print("Error: httpx is required. Run 'pip install httpx'.")
    sys.exit(1)

API_BASE_URL = "http://127.0.0.1:8000/api/v1"
DEFAULT_GATEWAY_ID = "GW-RPI5-CLINICAL-01"


class IoTGatewaySimulator:
    def __init__(
        self,
        gateway_id: str = DEFAULT_GATEWAY_ID,
        api_base: str = API_BASE_URL,
        auth_token: Optional[str] = None,
    ):
        self.gateway_id = gateway_id
        self.api_base = api_base
        self.auth_token = auth_token
        self.packet_seq = 0

    def generate_gateway_packet(self) -> Dict[str, Any]:
        """
        Generate edge node packet with environmental telemetry and bridged sensor metadata.
        """
        self.packet_seq += 1
        ambient_temp = round(random.uniform(21.5, 23.5), 1)
        relative_humidity = round(random.uniform(42.0, 52.0), 1)

        return {
            "device_id": self.gateway_id,
            "measurement_type": "ambient_clinic_telemetry",
            "value": ambient_temp,
            "secondary_value": relative_humidity,
            "unit": "degC / %RH",
            "source": "iot_edge_gateway",
            "quality_status": "verified",
            "metadata": {
                "sequence_number": self.packet_seq,
                "hardware_profile": "Raspberry Pi 5 ARM Cortex-A76",
                "firmware_version": "v2.4.1-edge-sec",
                "bridged_sensors_active": 4,
                "edge_cpu_load_pct": round(random.uniform(12.0, 24.0), 1),
                "ram_usage_pct": 34.2,
                "transport": "MQTT/TLS_v1.3",
                "checksum_crc32": f"0x{random.randint(0x10000000, 0xFFFFFFFF):X}",
            },
        }

    def transmit(self) -> Dict[str, Any]:
        payload = self.generate_gateway_packet()
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        print(f"\n=======================================================")
        print(f"  MediPredict AI - Edge IoT Gateway Telemetry")
        print(f"  Gateway ID:  {self.gateway_id}")
        print(f"  Metrics:     Temp={payload['value']}°C | Humidity={payload['secondary_value']}%")
        print(f"  Target:      {self.api_base}/ingestion/iot")
        print(f"=======================================================\n")

        url = f"{self.api_base}/ingestion/iot"
        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers, timeout=5.0)
            result = {
                "status_code": response.status_code,
                "response_body": response.json() if response.status_code < 500 else response.text,
            }

        print(f"[HTTP {result['status_code']}] Server Response:")
        print(json.dumps(result["response_body"], indent=2))
        return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Simulate IoT Medical Gateway Telemetry")
    parser.add_argument("--gateway-id", default=DEFAULT_GATEWAY_ID, help="Gateway identifier")
    parser.add_argument("--token", default=None, help="Bearer JWT authentication token")

    args = parser.parse_args()
    sim = IoTGatewaySimulator(gateway_id=args.gateway_id, auth_token=args.token)
    sim.transmit()
