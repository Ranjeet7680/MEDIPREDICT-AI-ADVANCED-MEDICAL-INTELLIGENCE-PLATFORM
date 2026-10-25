# MediPredict AI — Hardware & Connected Healthcare Simulators

This module provides reference simulators for embedded medical sensors, consumer wearables, and clinical IoT gateways conforming to the **Section 10 Unified Health Data Ingestion Standard**.

---

## 1. Architecture Overview

```
 [ESP32 + MAX30102] -----(BLE / WiFi)-------\
                                             +---> [POST /api/v1/ingestion/sensors]
 [Apple Watch / HealthKit] --(Batch Sync)---+---> [POST /api/v1/ingestion/wearables]
                                             |
 [Raspberry Pi Edge Gateway] -(MQTT/REST)---+---> [POST /api/v1/ingestion/iot]
                                             |
                                    [Section 10 Engine]
                                             |
                     +-----------------------+-----------------------+
                     |                       |                       |
            [SHA-256 Deduplication]  [Quality Calibration]   [Safety Interceptor]
                     |                       |                       |
                     +-----------------------+-----------------------+
                                             |
                                  [PostgreSQL Database]
```

---

## 2. Included Simulators

### A. ESP32 + MAX30102 Pulse Oximeter (`simulate_esp32_sensor.py`)
- Emulates an optical transducer measuring photoplethysmography (PPG) at 660nm (Red) and 880nm (Infrared).
- Models respiratory sinus arrhythmia (RSA) and signal-to-noise ratio (SNR > 28 dB).
- Streams live telemetry to `POST /api/v1/ingestion/sensors`.

**Usage:**
```bash
python hardware/simulators/simulate_esp32_sensor.py --packets 5 --interval 1.0
```

### B. Wearable Batch Synchronizer (`simulate_wearable_sync.py`)
- Emulates Apple HealthKit and Android Health Connect intraday batch export.
- Pushes resting heart rate, active energy expenditure, cumulative step counts, and nocturnal sleep stages to `POST /api/v1/ingestion/wearables`.

**Usage:**
```bash
python hardware/simulators/simulate_wearable_sync.py --platform apple_health
```

### C. Clinical Edge IoT Gateway (`simulate_iot_gateway.py`)
- Emulates a Raspberry Pi 5 edge aggregation hub streaming clinic ambient telemetry and bridged sensor health metrics to `POST /api/v1/ingestion/iot`.

**Usage:**
```bash
python hardware/simulators/simulate_iot_gateway.py --gateway-id GW-RPI5-CLINICAL-01
```

---

## 3. Section 10 Unified Ingestion Schema

Every incoming sensor telemetry packet conforms to:
```json
{
  "device_id": "ESP32-MAX30102-SPO2",
  "measurement_type": "pulse_oximetry",
  "value": 98.4,
  "secondary_value": 72.0,
  "unit": "% / bpm",
  "timestamp": "2026-10-25T12:00:00Z",
  "source": "esp32_max30102",
  "quality_status": "verified",
  "metadata": {
    "snr_db": 32.4,
    "motion_detected": false
  }
}
```

- **Duplicate Hash Algorithm:** SHA-256 of `device_id + measurement_type + value + timestamp_iso`.
- Duplicate submissions are rejected with HTTP 200/409 duplicate status counters.
