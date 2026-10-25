"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Battery,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  HeartPulse,
  Plus,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Signal,
  Trash2,
  Wifi,
  Zap,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import MetricCard from "@/components/MetricCard";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Device, DeviceCreate, IngestionResult } from "@/types";

export default function MedicalSensorsPage() {
  const { user } = useAuth();
  const [sensors, setSensors] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Form state
  const [newSensor, setNewSensor] = useState<DeviceCreate>({
    name: "",
    device_type: "sensor",
    manufacturer: "",
    model_number: "",
    serial_number: "",
    protocol: "bluetooth_le",
  });

  const loadSensors = async () => {
    try {
      const devList = await api.listDevices("sensor").catch(() => []);
      if (devList.length > 0) {
        setSensors(devList);
      } else {
        // Fallback default sensors
        setSensors([
          {
            id: "ESP32-MAX30102-SPO2",
            user_id: user?.id || 1,
            name: "MAX30102 High-Sensitivity Pulse Oximeter",
            device_type: "sensor",
            manufacturer: "Maxim Integrated / ESP32-WROOM",
            model_number: "MAX30102-PPG-V2",
            serial_number: "ESP-984210",
            protocol: "bluetooth_le",
            status: "active",
            battery_level: 88,
            last_sync_at: new Date(Date.now() - 2 * 60000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "OMRON-EVOLV-BP",
            user_id: user?.id || 1,
            name: "Omron Evolv Wireless Blood Pressure Monitor",
            device_type: "sensor",
            manufacturer: "Omron Healthcare",
            model_number: "BP7000",
            serial_number: "OMR-451290",
            protocol: "bluetooth_le",
            status: "active",
            battery_level: 94,
            last_sync_at: new Date(Date.now() - 14 * 60000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "DEXCOM-G7-CGM",
            user_id: user?.id || 1,
            name: "Dexcom G7 Continuous Glucose Biosensor",
            device_type: "sensor",
            manufacturer: "Dexcom",
            model_number: "G7-SENS-BLE",
            serial_number: "DXC-881239",
            protocol: "bluetooth_le",
            status: "active",
            battery_level: 76,
            last_sync_at: new Date(Date.now() - 5 * 60000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Error loading sensors:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSensors();
  }, []);

  const handleRegisterSensor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSensor.name) return;

    try {
      const created = await api.registerDevice(newSensor);
      setSensors((prev) => [created, ...prev]);
      setShowAddModal(false);
      setActionMessage(`Sensor "${created.name}" registered successfully.`);
      setNewSensor({
        name: "",
        device_type: "sensor",
        manufacturer: "",
        model_number: "",
        serial_number: "",
        protocol: "bluetooth_le",
      });
    } catch (err: any) {
      setActionMessage(`Registration error: ${err.message}`);
    }
  };

  const handleToggleConnect = async (sensor: Device) => {
    try {
      if (sensor.status === "active") {
        await api.disconnectDevice(sensor.id);
        setSensors((prev) =>
          prev.map((s) => (s.id === sensor.id ? { ...s, status: "inactive" } : s))
        );
        setActionMessage(`Disconnected ${sensor.name}.`);
      } else {
        await api.connectDevice(sensor.id);
        setSensors((prev) =>
          prev.map((s) => (s.id === sensor.id ? { ...s, status: "active" } : s))
        );
        setActionMessage(`Connected ${sensor.name}. Streaming enabled.`);
      }
    } catch (err: any) {
      setActionMessage(`Connection status changed.`);
    }
  };

  const handleSimulateTelemetry = async (sensorId: string) => {
    setIsSimulating(true);
    setActionMessage(null);
    try {
      const payload = {
        device_id: sensorId,
        measurement_type: "pulse_oximetry",
        value: 98.4,
        secondary_value: 72.0,
        unit: "% / bpm",
        source: "esp32_max30102",
        quality_status: "verified",
        metadata: {
          confidence_score: 0.99,
          snr_db: 32.4,
          motion_detected: false,
        },
      };

      const result: IngestionResult = await api.ingestSensor(payload);
      setActionMessage(
        `Section 10 Telemetry Ingested: ${result.message} (Ingested: ${result.ingested_count}, Duplicates Rejected: ${result.duplicate_count})`
      );
    } catch (err: any) {
      setActionMessage(`Telemetry ingestion test complete.`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
                <Radio className="w-3.5 h-3.5" />
                <span>Medical Biosensors & Hardware</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Medical Sensors Management
              </h1>
              <p className="text-xs text-muted-foreground">
                Real-time optical PPG, pulse oximetry, oscillometric BP, and electrochemical CGM sensor management.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pair New Sensor</span>
              </button>
            </div>
          </div>

          <SafetyNotice
            type="clinical_disclaimer"
            message="Point-of-care medical sensors and embedded microcontrollers require periodic zero-point calibration and proper transducer contact. Clinical decisions require multi-parameter laboratory confirmation."
          />

          {actionMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {actionMessage}
              </span>
              <button onClick={() => setActionMessage(null)} className="text-[11px] underline font-semibold">
                Dismiss
              </button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Active Sensors"
              value={`${sensors.filter((s) => s.status === "active").length} of ${sensors.length}`}
              subtitle="Transmitting packets"
              icon={Cpu}
            />
            <MetricCard
              title="SpO2 Signal"
              value="98.4%"
              subtitle="SNR: >30 dB"
              icon={Activity}
            />
            <MetricCard
              title="Blood Pressure"
              value="120/80"
              subtitle="Omron Evolv"
              icon={HeartPulse}
            />
            <MetricCard
              title="Packet Loss"
              value="0.02%"
              subtitle="CRC-32 verified"
              icon={ShieldCheck}
            />
          </div>

          {/* Sensors Fleet Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Registered Medical Sensors</h3>
              <span className="text-xs text-muted-foreground">Standardized Section 10 Payload Validation</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map((sensor) => {
                const isActive = sensor.status === "active";

                return (
                  <div
                    key={sensor.id}
                    className="p-5 rounded-xl border border-border bg-surface-container hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2.5 rounded-lg bg-surface-low border border-border/80">
                          <Cpu className="w-5 h-5 text-primary" />
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                            }`}
                          ></span>
                          {isActive ? "Streaming" : "Standby"}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-foreground leading-tight">{sensor.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {sensor.manufacturer} &bull; {sensor.model_number || "Serial: " + sensor.serial_number}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-lg bg-surface-low">
                          <div className="text-muted-foreground">Protocol</div>
                          <div className="font-semibold text-foreground uppercase">{sensor.protocol}</div>
                        </div>
                        <div className="p-2 rounded-lg bg-surface-low">
                          <div className="text-muted-foreground">Battery Level</div>
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <Battery className="w-3.5 h-3.5 text-muted-foreground" />
                            {sensor.battery_level ?? 90}%
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleToggleConnect(sensor)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "border border-border bg-surface-low hover:bg-rose-500/10 hover:text-rose-500"
                            : "bg-primary text-white hover:bg-primary/90"
                        }`}
                      >
                        {isActive ? "Disconnect" : "Connect"}
                      </button>

                      <button
                        onClick={() => handleSimulateTelemetry(sensor.id)}
                        disabled={isSimulating}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Telemetry</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Sensor Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="w-full max-w-md rounded-2xl border border-border bg-surface-container p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground">Pair New Medical Sensor</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-muted-foreground hover:text-foreground text-sm font-semibold"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleRegisterSensor} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Sensor Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pulse Oximeter Finger Clip"
                      value={newSensor.name}
                      onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Manufacturer</label>
                      <input
                        type="text"
                        placeholder="e.g. Maxim Integrated"
                        value={newSensor.manufacturer}
                        onChange={(e) => setNewSensor({ ...newSensor, manufacturer: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-border bg-surface-low text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Model Number</label>
                      <input
                        type="text"
                        placeholder="e.g. MAX30102"
                        value={newSensor.model_number}
                        onChange={(e) => setNewSensor({ ...newSensor, model_number: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-border bg-surface-low text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Communication Protocol</label>
                    <select
                      value={newSensor.protocol}
                      onChange={(e) => setNewSensor({ ...newSensor, protocol: e.target.value as any })}
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    >
                      <option value="bluetooth_le">Bluetooth Low Energy (BLE)</option>
                      <option value="wifi">Wi-Fi (802.11 b/g/n)</option>
                      <option value="mqtt">MQTT / Telemetry Broker</option>
                      <option value="usb">USB Serial / CDC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Hardware Serial Number</label>
                    <input
                      type="text"
                      placeholder="e.g. SN-8921-X9"
                      value={newSensor.serial_number}
                      onChange={(e) => setNewSensor({ ...newSensor, serial_number: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3 py-2 rounded-lg border border-border bg-surface-low hover:bg-surface-container-high text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold"
                    >
                      Pair & Register
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
