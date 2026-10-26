"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Download,
  Filter,
  HeartPulse,
  Plus,
  Radio,
  Scale,
  Sparkles,
  Thermometer,
  Trash2,
  Volume2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import HealthTrendChart from "@/components/HealthTrendChart";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import MetricCard from "@/components/MetricCard";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton, TableSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { formatDate, formatDateTime } from "@/lib/utils";
import { HealthMeasurement, HealthMetricSummary } from "@/types";

const METRIC_TABS = [
  { key: "all", label: "All Metrics" },
  { key: "blood_pressure", label: "Blood Pressure" },
  { key: "blood_glucose", label: "Blood Glucose" },
  { key: "heart_rate", label: "Heart Rate" },
  { key: "hba1c", label: "HbA1c" },
  { key: "weight", label: "Body Weight" },
];

export default function HealthMetricsPage() {
  const [metrics, setMetrics] = useState<HealthMeasurement[]>([]);
  const [summaries, setSummaries] = useState<HealthMetricSummary[]>([]);
  const [activeMetricTab, setActiveMetricTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Live ECG Telemetry Simulation
  const [isLiveTelemetry, setIsLiveTelemetry] = useState(true);
  const [bpm, setBpm] = useState(72);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Modal for new measurement
  const [showLogModal, setShowLogModal] = useState(false);
  const [formData, setFormData] = useState({
    metric_type: "blood_glucose",
    value: 100.0,
    secondary_value: undefined as number | undefined,
    unit: "mg/dL",
    source: "Fasting Glucometer",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeMetricTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const filterType = activeMetricTab === "all" ? undefined : activeMetricTab;
      const [list, sums] = await Promise.all([
        api.listMetrics(filterType),
        api.getMetricsSummary(),
      ]);
      setMetrics(list);
      setSummaries(sums);
    } catch (err) {
      console.error("Load metrics error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Canvas ECG Waveform Animation
  useEffect(() => {
    if (!isLiveTelemetry) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let step = 0;
    const points: number[] = new Array(canvas.width || 300).fill(40);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Grid background
      ctx.strokeStyle = "rgba(0, 99, 94, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // ECG rhythm generator (P-Q-R-S-T wave)
      const phase = step % 80;
      let val = height / 2;
      if (phase === 15) val -= 5; // P wave
      else if (phase === 25) val += 4; // Q wave
      else if (phase === 28) val -= 28; // R peak
      else if (phase === 31) val += 12; // S trough
      else if (phase === 45) val -= 8; // T wave
      else val += (Math.random() - 0.5) * 1.5; // slight baseline drift

      points.shift();
      points.push(val);

      // Draw trace
      ctx.beginPath();
      ctx.strokeStyle = "#10b981"; // clinical emerald
      ctx.lineWidth = 2;
      ctx.shadowColor = "#10b981";
      ctx.shadowBlur = 4;

      for (let i = 0; i < points.length; i++) {
        if (i === 0) ctx.moveTo(i, points[i]);
        else ctx.lineTo(i, points[i]);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      step++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isLiveTelemetry]);

  const handleMetricTypeChange = (type: string) => {
    let defaultUnit = "mg/dL";
    let defaultSource = "Manual Entry";
    if (type === "blood_pressure") {
      defaultUnit = "mmHg";
      defaultSource = "Clinical Sphygmomanometer";
    } else if (type === "heart_rate") {
      defaultUnit = "bpm";
      defaultSource = "Wearable ECG Sensor";
    } else if (type === "hba1c") {
      defaultUnit = "%";
      defaultSource = "Laboratory Venipuncture";
    } else if (type === "weight") {
      defaultUnit = "kg";
      defaultSource = "Smart Scale";
    }
    setFormData({
      ...formData,
      metric_type: type,
      unit: defaultUnit,
      source: defaultSource,
    });
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setIsSubmitting(true);
    try {
      await api.createMetric({
        metric_type: formData.metric_type,
        value: Number(formData.value),
        secondary_value: formData.secondary_value ? Number(formData.secondary_value) : undefined,
        unit: formData.unit,
        source: formData.source,
        notes: formData.notes,
      });
      sound.playSuccess();
      setShowLogModal(false);
      loadData();
    } catch (err) {
      sound.playAlert();
      console.error("Create metric error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async (id: number) => {
    sound.playClick();
    try {
      await api.deleteMetric(id);
      setMetrics((prev) => prev.filter((m) => m.id !== id));
      api.getMetricsSummary().then(setSummaries);
    } catch (err) {
      console.error("Delete metric error:", err);
    }
  };

  const safeMetrics = Array.isArray(metrics) ? metrics : [];
  const safeSummaries = Array.isArray(summaries) ? summaries : [];

  // Filtered readings for chart
  const chartData = safeMetrics.filter(
    (m) => m && (activeMetricTab === "all" || m.metric_type === activeMetricTab)
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground transition-colors duration-200">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl overflow-y-auto">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <HeartPulse className="w-6 h-6 text-primary" /> Health Metrics & Longitudinal Trends
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track blood pressure, fasting glucose, HbA1c, and vitals over time with Section 10 IoT ingestion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={api.getMetricsExportCsvUrl()}
                target="_blank"
                rel="noreferrer"
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white dark:bg-[#162732] text-xs font-semibold hover:bg-surface-low dark:hover:bg-[#1c303d] transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </a>

              <button
                onClick={() => {
                  sound.playClick();
                  setShowLogModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Log Measurement</span>
              </button>
            </div>
          </div>

          {/* Live ECG Waveform Telemetry Banner */}
          <div className="p-4 rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-foreground">
                  Continuous Lead-II Telemetry Monitor (Section 10 IoT)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono font-semibold">
                  STREAM ACTIVE
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-foreground font-bold">
                  <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>{bpm} BPM</span>
                </div>
                <div className="text-muted-foreground hidden sm:block">
                  SpO2: <span className="font-bold text-foreground">98.4%</span>
                </div>
                <button
                  onClick={() => sound.playHeartbeat()}
                  title="Auditory tone cue"
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Waveform */}
            <div className="relative w-full h-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
              <canvas
                ref={canvasRef}
                width={800}
                height={80}
                className="w-full h-full block"
              />
              <div className="absolute top-2 right-3 text-[10px] text-emerald-400/80 font-mono">
                25mm/s &bull; 10mm/mV &bull; Notch: 50Hz
              </div>
            </div>
          </div>

          <SafetyNotice
            type="clinical_disclaimer"
            message="Health metrics are recorded for personal tracking and clinical discussion. A single elevated measurement should be confirmed with clinical protocol before establishing diagnosis."
          />

          {/* Metric Summary Cards Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : safeSummaries.length > 0 ? (
              safeSummaries.map((s) => (
                <div
                  key={s.metric_type}
                  onClick={() => {
                    sound.playClick();
                    setActiveMetricTab(s.metric_type);
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    activeMetricTab === s.metric_type
                      ? "border-primary bg-white dark:bg-[#162732] shadow-sm ring-1 ring-primary/20 scale-[1.02]"
                      : "bg-surface-low/50 dark:bg-[#111d24]/50 hover:bg-surface-low dark:hover:bg-[#162732] border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-muted-foreground capitalize text-[10px]">
                      {s.metric_type.replace("_", " ")}
                    </span>
                    <MedicalStatusBadge flag={s.status} />
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-bold text-foreground">{s.latest_value}</span>
                    {s.latest_secondary && (
                      <span className="text-sm font-semibold text-muted-foreground">
                        / {s.latest_secondary}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{s.unit}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>Avg: {s.average}</span>
                    <span>Range: {s.min_value} - {s.max_value}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-4 rounded-xl border border-dashed border-border bg-surface-low/30 dark:bg-[#111d24]/30 text-center text-xs text-muted-foreground">
                No health summaries available yet. Log your first measurement above.
              </div>
            )}
          </div>

          {/* Tabs Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  sound.playClick();
                  setActiveMetricTab(tab.key);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                  activeMetricTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-white dark:bg-[#162732] border border-border text-foreground hover:bg-surface-low dark:hover:bg-[#1c303d]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Time Series Visualization */}
          <div className="p-5 rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs space-y-3 transition-colors duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Trajectory & Trend Analysis
                </h3>
                <p className="text-xs text-muted-foreground">
                  Chronological data points recorded across consultations and home monitoring.
                </p>
              </div>
            </div>

            {chartData.length > 0 ? (
              <HealthTrendChart
                data={chartData}
                unit={chartData[0]?.unit || ""}
                metricName={activeMetricTab.replace("_", " ")}
                isDualValue={activeMetricTab === "blood_pressure"}
                primaryLabel={activeMetricTab === "blood_pressure" ? "Systolic" : "Reading"}
                secondaryLabel="Diastolic"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
                No data points found for this selection.
              </div>
            )}
          </div>

          {/* Detailed Measurement Log Table */}
          <div className="rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs overflow-hidden transition-colors duration-200">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                Measurement Audit Log ({metrics.length})
              </h3>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-low/50 dark:bg-[#111d24]/60 text-[10px] font-semibold text-muted-foreground uppercase">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Parameter</th>
                    <th className="py-3 px-4">Measurement</th>
                    <th className="py-3 px-4">Recorded Source</th>
                    <th className="py-3 px-4">Clinical Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-low/30 dark:hover:bg-[#1c303d]/30 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {formatDateTime(m.recorded_at)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground capitalize">
                        {m.metric_type.replace("_", " ")}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-foreground">
                          {m.value}
                          {m.secondary_value !== undefined && ` / ${m.secondary_value}`}
                        </span>{" "}
                        <span className="text-[11px] text-muted-foreground">{m.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{m.source}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {m.notes || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteMetric(m.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#162732] p-6 border border-border shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-foreground">Log New Health Measurement</h3>

            <form onSubmit={handleSaveMetric} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Parameter</label>
                <select
                  value={formData.metric_type}
                  onChange={(e) => handleMetricTypeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                >
                  <option value="blood_pressure">Blood Pressure</option>
                  <option value="blood_glucose">Blood Glucose</option>
                  <option value="heart_rate">Heart Rate</option>
                  <option value="hba1c">HbA1c</option>
                  <option value="weight">Body Weight</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">
                    {formData.metric_type === "blood_pressure" ? "Systolic" : "Value"}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground font-mono"
                  />
                </div>
                {formData.metric_type === "blood_pressure" && (
                  <div>
                    <label className="block font-medium text-muted-foreground mb-1">Diastolic</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.secondary_value || 80}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          secondary_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Source / Device</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Clinical Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Post-exercise, fasting for 10 hours, morning reading..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-surface-low dark:hover:bg-[#111d24]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
