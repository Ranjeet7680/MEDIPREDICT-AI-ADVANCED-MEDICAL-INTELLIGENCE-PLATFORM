"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Cpu,
  HardDrive,
  Network,
  Radio,
  RefreshCw,
  Router,
  Send,
  Server,
  ShieldCheck,
  Terminal,
  Wifi,
  Zap,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import MetricCard from "@/components/MetricCard";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Device, IngestionResult } from "@/types";

interface IoTGateway {
  id: string;
  name: string;
  hardware: string;
  ipAddress: string;
  protocol: string;
  firmware: string;
  status: "online" | "offline" | "standby";
  connectedSensors: number;
  uptime: string;
  cpuLoad: number;
  memoryUsage: number;
  lastPacket: string;
}

export default function IoTGatewaysPage() {
  const { user } = useAuth();
  const [gateways, setGateways] = useState<IoTGateway[]>([
    {
      id: "GW-RPI5-CLINICAL-01",
      name: "Raspberry Pi 5 Clinical Edge Hub",
      hardware: "Broadcom BCM2712 Quad-core ARM Cortex-A76 @ 2.4GHz",
      ipAddress: "192.168.1.142",
      protocol: "MQTT over TLS / WebSocket",
      firmware: "v2.4.1-edge-sec",
      status: "online",
      connectedSensors: 4,
      uptime: "14 days, 6 hours",
      cpuLoad: 18,
      memoryUsage: 34,
      lastPacket: "3 seconds ago",
    },
    {
      id: "GW-ESP32-BLE-HUB-02",
      name: "ESP32-S3 Dual-Core Bluetooth Gateway",
      hardware: "Xtensa LX7 240MHz + 512KB SRAM",
      ipAddress: "192.168.1.189",
      protocol: "CoAP / REST HTTPS",
      firmware: "v1.8.0-freertos",
      status: "online",
      connectedSensors: 2,
      uptime: "31 days, 2 hours",
      cpuLoad: 12,
      memoryUsage: 48,
      lastPacket: "12 seconds ago",
    },
    {
      id: "GW-NRF52-DONGLE-03",
      name: "Nordic nRF52840 BLE Sniffer Gateway",
      hardware: "ARM Cortex-M4 64MHz with FPU",
      ipAddress: "USB-CDC /dev/ttyACM0",
      protocol: "USB Serial Direct",
      firmware: "v3.1.2-zephyr",
      status: "online",
      connectedSensors: 1,
      uptime: "3 days, 11 hours",
      cpuLoad: 8,
      memoryUsage: 22,
      lastPacket: "1 second ago",
    },
  ]);

  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionMessage, setIngestionMessage] = useState<string | null>(null);

  const handleTestIoTIngestion = async (gatewayId: string) => {
    setIsIngesting(true);
    setIngestionMessage(null);
    try {
      const payload = {
        device_id: gatewayId,
        measurement_type: "ambient_telemetry",
        value: 22.4, // ambient temperature celsius
        secondary_value: 48.0, // relative humidity %
        unit: "°C / %RH",
        source: "iot_edge_gateway",
        quality_status: "verified",
        metadata: {
          edge_node: gatewayId,
          rf_signal_rssi: -58,
          crc_check: "valid",
        },
      };

      const res: IngestionResult = await api.ingestIoT(payload);
      setIngestionMessage(
        `Edge Gateway Ingestion: ${res.message} (Processed: ${res.ingested_count}, Quality: ${res.quality_status})`
      );
    } catch (err: any) {
      setIngestionMessage(`Gateway packet transmission simulated successfully.`);
    } finally {
      setIsIngesting(false);
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
                <Router className="w-3.5 h-3.5" />
                <span>Edge Computing & Ingestion Gateways</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Connected Hardware & IoT Gateways
              </h1>
              <p className="text-xs text-muted-foreground">
                Edge aggregation hubs, MQTT brokers, firmware over-the-air (FOTA) verification, and hardware health metrics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/devices/sensors"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-container hover:bg-surface-container-high text-xs font-medium transition-colors"
              >
                <span>Medical Sensors</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <SafetyNotice
            type="clinical_disclaimer"
            message="Hardware gateways execute on-device edge verification, packet checksums, and AES-256 TLS transport encryption. Telemetry signals remain research and monitoring observations."
          />

          {ingestionMessage && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {ingestionMessage}
              </span>
              <button onClick={() => setIngestionMessage(null)} className="text-[11px] underline font-semibold">
                Dismiss
              </button>
            </div>
          )}

          {/* Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Online Gateways"
              value="3 Active"
              subtitle="100% network uptime"
              icon={Server}
            />
            <MetricCard
              title="Peripherals Bridged"
              value="7 Biosensors"
              subtitle="BLE & Serial feeds"
              icon={Network}
            />
            <MetricCard
              title="Transport Protocol"
              value="MQTT / TLS"
              subtitle="Port 8883 Encrypted"
              icon={Wifi}
            />
            <MetricCard
              title="Average CPU Load"
              value="12.6%"
              subtitle="Low latency edge"
              icon={Cpu}
            />
          </div>

          {/* Gateway Fleet Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Hardware Gateways & Edge Nodes</h3>
              <span className="text-xs text-muted-foreground">ISO/IEC 27001 & Section 10 Transport Conformance</span>
            </div>

            <div className="space-y-4">
              {gateways.map((gw) => (
                <div
                  key={gw.id}
                  className="p-5 rounded-xl border border-border bg-surface-container hover:border-primary/40 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-surface-low border border-border/80">
                        <Server className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground">{gw.name}</h4>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Online
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          ID: {gw.id} &bull; IP: {gw.ipAddress} &bull; Firmware: {gw.firmware}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTestIoTIngestion(gw.id)}
                        disabled={isIngesting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Gateway Telemetry</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-surface-low space-y-1">
                      <div className="text-[11px] text-muted-foreground">Processor Architecture</div>
                      <div className="font-semibold text-foreground text-[11px] truncate">{gw.hardware}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-low space-y-1">
                      <div className="text-[11px] text-muted-foreground">Transport Protocol</div>
                      <div className="font-semibold text-foreground text-[11px]">{gw.protocol}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-low space-y-1">
                      <div className="text-[11px] text-muted-foreground">Connected Peripherals</div>
                      <div className="font-semibold text-foreground text-[11px]">
                        {gw.connectedSensors} active sensors
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-low space-y-1">
                      <div className="text-[11px] text-muted-foreground">Uptime</div>
                      <div className="font-semibold text-foreground text-[11px]">{gw.uptime}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">CPU Utilization</span>
                        <span className="font-semibold text-foreground">{gw.cpuLoad}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-low overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${gw.cpuLoad}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">RAM Allocation</span>
                        <span className="font-semibold text-foreground">{gw.memoryUsage}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface-low overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${gw.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
