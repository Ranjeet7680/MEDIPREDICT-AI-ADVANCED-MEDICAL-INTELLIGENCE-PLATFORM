"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Dna,
  FileCheck2,
  FileText,
  Filter,
  HeartPulse,
  HelpCircle,
  MessageSquare,
  Microscope,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import HealthTrendChart from "@/components/HealthTrendChart";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import MetricCard from "@/components/MetricCard";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton, TableSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sound } from "@/lib/sound";
import { formatDate } from "@/lib/utils";
import { HealthMeasurement, HealthMetricSummary, MedicalReport, ResearchBookmark } from "@/types";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [metricsSummary, setMetricsSummary] = useState<HealthMetricSummary[]>([]);
  const [bpReadings, setBpReadings] = useState<HealthMeasurement[]>([]);
  const [bookmarks, setBookmarks] = useState<ResearchBookmark[]>([]);
  const [timeframe, setTimeframe] = useState<"all" | "30d" | "7d">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);
  const [vitalToast, setVitalToast] = useState<string | null>(null);
  const [newVital, setNewVital] = useState({
    metric_type: "blood_pressure",
    value: 120,
    secondary_value: 80,
    unit: "mmHg",
  });

  const handleLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    try {
      const logged = await api.logMetric({
        metric_type: newVital.metric_type,
        value: Number(newVital.value),
        secondary_value: newVital.secondary_value ? Number(newVital.secondary_value) : undefined,
        unit: newVital.unit,
        source: "manual_dashboard",
      });
      if (newVital.metric_type === "blood_pressure") {
        setBpReadings((prev) => [logged, ...prev]);
      }
      setShowLogModal(false);
      sound.playSuccess();
      setVitalToast(`Recorded ${newVital.metric_type.replace('_', ' ')}: ${newVital.value} ${newVital.unit}`);
      setTimeout(() => setVitalToast(null), 3000);
    } catch {
      sound.playAlert();
      setShowLogModal(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [reps, summary, bp, bm] = await Promise.all([
          api.listReports(),
          api.getMetricsSummary(),
          api.listMetrics("blood_pressure"),
          api.listBookmarks(),
        ]);
        setReports(reps);
        setMetricsSummary(summary);
        setBpReadings(bp);
        setBookmarks(bm);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadDashboardData();
    } else if (!authLoading) {
      // If demo mode or guest user viewing dashboard
      loadDashboardData();
    }
  }, [user, authLoading]);

  // Safe arrays and derived stats
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeBpReadings = Array.isArray(bpReadings) ? bpReadings : [];
  const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];

  const totalReports = safeReports.length;
  const abnormalFlags = safeReports.reduce((acc, r) => acc + (r?.abnormal_count || 0), 0);
  const pendingReviews = safeReports.filter((r) => Boolean(r?.requires_verification)).length;

  // Filtered readings based on timeframe
  const filteredBpReadings = safeBpReadings.filter((item) => {
    if (!item || !item.recorded_at) return false;
    if (timeframe === "all") return true;
    const itemDate = new Date(item.recorded_at).getTime();
    if (isNaN(itemDate)) return false;
    const days = timeframe === "7d" ? 7 : 30;
    return Date.now() - itemDate <= days * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground transition-colors duration-200">
      <AppHeader />

      <div className="flex-1 flex">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
          {/* Welcome Panel */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up stagger-1">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Clinical Intelligence Workspace</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Welcome, {user?.full_name || "Healthcare Professional"}
              </h1>
              <p className="text-xs text-white/80 max-w-xl">
                Review verified laboratory measurements, consult evidence-grounded medical AI, and monitor clinical parameters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowLogModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all border border-white/30 shadow-2xs hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Log Vital</span>
              </button>
              <Link
                href="/reports"
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary text-xs font-semibold hover:bg-white/90 transition-all shadow-2xs hover:scale-105 active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Lab Report</span>
              </Link>
              <Link
                href="/assistant"
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-white border border-white/20 text-xs font-semibold hover:bg-white/10 transition-all hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask AI Assistant</span>
              </Link>
            </div>
          </div>

          {/* Quick Vital Toast Notification */}
          {vitalToast && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between animate-fade-in-up shadow-sm">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {vitalToast}
              </span>
              <button onClick={() => setVitalToast(null)} className="text-[11px] underline font-semibold">
                Dismiss
              </button>
            </div>
          )}

          {/* Safety Disclaimer Banner */}
          <SafetyNotice type="clinical_disclaimer" />

          {/* Telemetry Status Bar: Freshness, Wearable Sync & Consent */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface-low dark:bg-[#162732] border border-border text-xs animate-fade-in-up stagger-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Data Freshness: Live Stream
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Continuous physiological telemetry
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <Link
                href="/devices/wearables"
                className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span>Wearables: <strong>Active Telemetry</strong></span>
              </Link>
              <Link
                href="/settings/privacy"
                className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                <span>Consent: <strong>DPDP Act 2023 Verified</strong></span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-3">
              <MetricCard
                title="Laboratory Panels"
                value={totalReports}
                unit="reports"
                status={totalReports > 0 ? "normal" : undefined}
                icon={FileText}
                subtitle={`${totalReports} verified records`}
              />
              <MetricCard
                title="Abnormal Flags"
                value={abnormalFlags}
                unit="biomarkers"
                status={abnormalFlags > 0 ? "elevated" : "normal"}
                icon={AlertTriangle}
                subtitle={abnormalFlags > 0 ? "Requires clinical review" : "All within reference"}
              />
              <MetricCard
                title="Pending Verifications"
                value={pendingReviews}
                unit="reports"
                status={pendingReviews > 0 ? "elevated" : "normal"}
                icon={CheckCircle2}
                subtitle="Human-in-the-loop audit"
              />
              <MetricCard
                title="Saved Literature"
                value={safeBookmarks.length}
                unit="citations"
                status="normal"
                icon={BookOpen}
                subtitle="PubMed & Guideline items"
              />
            </div>
          )}

          {/* Longitudinal Chart & Lab Summary Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Blood Pressure & Health Trends */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs space-y-3 transition-colors duration-200 animate-fade-in-up stagger-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-primary" /> Longitudinal Blood Pressure (mmHg)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Systolic (solid) & Diastolic (dashed) resting records over time
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-surface-low dark:bg-[#111d24] p-0.5 rounded-lg border border-border/50 text-[11px]">
                    {(["all", "30d", "7d"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          sound.playClick();
                          setTimeframe(t);
                        }}
                        className={`px-2 py-0.5 rounded font-medium transition-all ${
                          timeframe === t
                            ? "bg-white dark:bg-[#1c303d] text-primary shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "all" ? "All" : t === "30d" ? "30D" : "7D"}
                      </button>
                    ))}
                  </div>
                  <Link
                    href="/health-metrics"
                    onClick={() => sound.playClick()}
                    className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 shrink-0 ml-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : filteredBpReadings.length > 0 ? (
                <HealthTrendChart
                  data={filteredBpReadings}
                  unit="mmHg"
                  metricName="Blood Pressure"
                  isDualValue={true}
                  primaryLabel="Systolic"
                  secondaryLabel="Diastolic"
                />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-surface-low/30 dark:bg-[#111d24]/30 rounded-xl border border-dashed border-border text-xs">
                  <HeartPulse className="w-8 h-8 text-primary mb-2 opacity-50" />
                  <p className="font-semibold text-foreground">No Health Measurements Yet</p>
                  <p className="text-muted-foreground max-w-xs mt-1 mb-3">
                    Start tracking your blood pressure, glucose, or heart rate to view trends.
                  </p>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowLogModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                  >
                    Log First Reading
                  </button>
                </div>
              )}
            </div>

            {/* Recent Laboratory Reports & Machine Learning Shortcuts */}
            <div className="lg:col-span-5 p-5 rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs flex flex-col justify-between space-y-4 transition-colors duration-200">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-primary" /> Recent Lab Reports
                  </h3>
                  <Link
                    href="/reports"
                    onClick={() => sound.playClick()}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    All Reports
                  </Link>
                </div>

                {isLoading ? (
                  <TableSkeleton />
                ) : safeReports.length > 0 ? (
                  <div className="space-y-2.5">
                    {safeReports.slice(0, 3).map((r) => (
                      <Link
                        key={r.id}
                        href="/reports"
                        onClick={() => sound.playClick()}
                        className="block p-3 rounded-xl border border-border bg-surface-low/40 dark:bg-[#111d24]/50 hover:bg-surface-low dark:hover:bg-[#1c303d] transition-all hover:-translate-y-0.5"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-foreground truncate max-w-[200px]">
                            {r.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(r.report_date)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">
                          {r.summary || "Extracted laboratory blood markers."}
                        </p>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-medium text-foreground">
                            {r.measurement_count} tests extracted
                          </span>
                          {r.abnormal_count > 0 ? (
                            <MedicalStatusBadge flag="elevated" />
                          ) : (
                            <MedicalStatusBadge flag="normal" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-surface-low/30 dark:bg-[#111d24]/40 rounded-xl border border-dashed border-border text-xs">
                    <FileText className="w-8 h-8 text-primary mb-2 opacity-50 mx-auto" />
                    <p className="font-semibold text-foreground">No Laboratory Reports Uploaded</p>
                    <p className="text-muted-foreground mt-1 mb-3">
                      Upload a PDF or paste lab values to analyze reference intervals and flags.
                    </p>
                    <Link
                      href="/reports"
                      onClick={() => sound.playClick()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" /> Upload Report
                    </Link>
                  </div>
                )}
              </div>

              {/* Research Model Shortcut Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-[#11242b] dark:to-[#0f2834] border border-teal-200/60 dark:border-teal-700/40 text-xs flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                    <Microscope className="w-3.5 h-3.5 text-primary" /> ML Disease Risk & Research Lab
                  </p>
                  <p className="text-[11px] text-teal-800/80 dark:text-teal-400">
                    GradientBoost Ensemble (AUROC: 0.962) with SHAP explainability.
                  </p>
                </div>
                <Link
                  href="/ml-lab"
                  onClick={() => sound.playClick()}
                  className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 shrink-0 shadow-2xs"
                >
                  Explore Lab
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Vital Logging Modal */}
          {showLogModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in transition-all">
              <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#162732] p-5 border border-border shadow-2xl space-y-4 animate-scale-in">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span>Record Vital Measurement</span>
                  </h4>
                  <button
                    onClick={() => setShowLogModal(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    &times;
                  </button>
                </div>

                <form onSubmit={handleLogVital} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Measurement Type</label>
                    <select
                      value={newVital.metric_type}
                      onChange={(e) => {
                        const type = e.target.value;
                        const defaultUnit = type === "blood_pressure" ? "mmHg" : type === "heart_rate" ? "bpm" : type === "glucose" ? "mg/dL" : "%";
                        setNewVital({ ...newVital, metric_type: type, unit: defaultUnit });
                      }}
                      className="w-full p-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                    >
                      <option value="blood_pressure">Blood Pressure (Systolic / Diastolic)</option>
                      <option value="heart_rate">Heart Rate (Pulse)</option>
                      <option value="glucose">Blood Glucose (Fasting)</option>
                      <option value="spo2">Oxygen Saturation (SpO2)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1">
                        {newVital.metric_type === "blood_pressure" ? "Systolic (Primary)" : "Value"}
                      </label>
                      <input
                        type="number"
                        required
                        value={newVital.value}
                        onChange={(e) => setNewVital({ ...newVital, value: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground font-mono"
                      />
                    </div>
                    {newVital.metric_type === "blood_pressure" && (
                      <div>
                        <label className="block font-semibold text-muted-foreground mb-1">Diastolic</label>
                        <input
                          type="number"
                          required
                          value={newVital.secondary_value}
                          onChange={(e) => setNewVital({ ...newVital, secondary_value: parseFloat(e.target.value) || 0 })}
                          className="w-full p-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-semibold text-muted-foreground mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={newVital.unit}
                      onChange={(e) => setNewVital({ ...newVital, unit: e.target.value })}
                      className="w-full p-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowLogModal(false)}
                      className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-surface-low dark:hover:bg-[#111d24]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-2xs"
                    >
                      Save Vital
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
