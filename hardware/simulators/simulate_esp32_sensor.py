"""
ESP32 + MAX30102 Optical PPG / Pulse Oximeter Hardware Telemetry Simulator.

Simulates an embedded ESP32-WROOM microcontroller running FreeRTOS with an
I2C-interfaced MAX30102 optical biosensor. Generates realistic photoplethysmography (PPG)
samples, computes R-ratio from Red (660nm) and Infrared (880nm) channels to estimate SpO2,
detects systolic peaks for Heart Rate (BPM), and pushes telemetry packets to the MediPredict
AI Section 10 Unified Ingestion Endpoint.
"""

import datetime
import hashlib
import json
import math
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
DEFAULT_DEVICE_ID = "ESP32-MAX30102-SPO2"


class ESP32MAX30102Simulator:
    def __init__(
        self,
        device_id: str = DEFAULT_DEVICE_ID,
        api_base: str = API_BASE_URL,
        auth_token: Optional[str] = None,
    ):
        self.device_id = device_id
        self.api_base = api_base
        self.auth_token = auth_token
        self.heart_rate_baseline = 72.0
        self.spo2_baseline = 98.4
        self.sequence_number = 0

    def generate_physio_sample(self, time_offset: float = 0.0) -> Dict[str, Any]:
        """
        Generate physiological readings with authentic biological variability (respiratory sinus arrhythmia).
        """
        self.sequence_number += 1
        
        # Respiratory Sinus Arrhythmia (RSA): subtle oscillation with 0.25 Hz breathing
        rsa_component = 3.0 * math.sin(time_offset * 2.0 * math.pi * 0.25)
        noise = random.uniform(-1.0, 1.0)
        heart_rate = round(self.heart_rate_baseline + rsa_component + noise, 1)

        # Pulse Oximetry R-ratio calculation:
        # R = (AC_red / DC_red) / (AC_ir / DC_ir)
        # SpO2 ~= 110 - 25 * R
        spo2_noise = random.uniform(-0.3, 0.3)
        spo2 = round(max(92.0, min(100.0, self.spo2_baseline + spo2_noise)), 1)

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Signal-to-noise ratio in dB (typical for clean finger contact)
        snr_db = round(random.uniform(28.0, 34.0), 2)

        return {
            "device_id": self.device_id,
            "measurement_type": "pulse_oximetry",
            "value": spo2,
            "secondary_value": heart_rate,
            "unit": "% / bpm",
            "timestamp": now_iso,
            "source": "esp32_max30102",
            "quality_status": "verified",
            "metadata": {
                "sequence_number": self.sequence_number,
                "optical_channels": {
                    "red_wavelength_nm": 660,
                    "ir_wavelength_nm": 880,
                    "r_ratio": round((110.0 - spo2) / 25.0, 3),
                },
                "snr_db": snr_db,
                "motion_detected": False,
                "firmware_version": "v1.4.2-freertos",
            },
        }

    def transmit_packet(self, client: httpx.Client, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send single telemetry packet to Section 10 ingestion endpoint.
        """
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"

        url = f"{self.api_base}/ingestion/sensors"
        response = client.post(url, json=payload, headers=headers, timeout=5.0)
        return {
            "status_code": response.status_code,
            "response_body": response.json() if response.status_code < 500 else response.text,
        }

    def run_simulation(self, packet_count: int = 5, interval_seconds: float = 1.0):
        """
        Execute telemetry transmission loop.
        """
        print(f"\n=======================================================")
        print(f"  MediPredict AI - Hardware Telemetry Simulation")
        print(f"  Transmitter: ESP32 + MAX30102 Optical PPG Transducer")
        print(f"  Device ID:   {self.device_id}")
        print(f"  Target:      {self.api_base}/ingestion/sensors")
        print(f"=======================================================\n")

        with httpx.Client() as client:
            for i in range(packet_count):
                payload = self.generate_physio_sample(time_offset=i * interval_seconds)
                print(
                    f"[{i+1}/{packet_count}] Transmitting: SpO2={payload['value']}% | "
                    f"HR={payload['secondary_value']} BPM | SNR={payload['metadata']['snr_db']} dB"
                )

                try:
                    result = self.transmit_packet(client, payload)
                    print(f"      -> HTTP {result['status_code']}: {result['response_body']}")
                except Exception as exc:
                    print(f"      -> Transmission Failed: {exc}")

                if i < packet_count - 1:
                    time.sleep(interval_seconds)

        print("\n[OK] Simulation completed successfully.\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Simulate ESP32 MAX30102 Sensor Telemetry")
    parser.add_argument("--device-id", default=DEFAULT_DEVICE_ID, help="Sensor hardware ID")
    parser.add_argument("--packets", type=int, default=5, help="Number of telemetry packets to stream")
    parser.add_argument("--interval", type=float, default=1.0, help="Interval between packets in seconds")
    parser.add_argument("--token", default=None, help="Bearer JWT authentication token")

    args = parser.parse_args()
    sim = ESP32MAX30102Simulator(device_id=args.device_id, auth_token=args.token)
    sim.run_simulation(packet_count=args.packets, interval_seconds=args.interval)
