"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import EmptyState from "@/components/EmptyState";
import LabResultsTable from "@/components/LabResultsTable";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import ReportUploader from "@/components/ReportUploader";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton, TableSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { sound } from "@/lib/sound";
import { formatDate } from "@/lib/utils";
import { LaboratoryMeasurement, MedicalReport } from "@/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [tableFilter, setTableFilter] = useState<"all" | "abnormal" | "normal">("all");
  const [signOffToast, setSignOffToast] = useState<string | null>(null);

  // Add Biomarker Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBiomarker, setNewBiomarker] = useState<{
    test_name: string;
    value: number;
    unit: string;
    reference_text: string;
    flag: "normal" | "critical" | "low" | "high";
  }>({
    test_name: "",
    value: 100.0,
    unit: "mg/dL",
    reference_text: "70 - 99 mg/dL",
    flag: "normal",
  });
  const [isAddingBiomarker, setIsAddingBiomarker] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await api.listReports();
      setReports(data);
      if (data.length > 0) {
        selectReport(data[0].id);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error("Load reports error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectReport = async (id: number) => {
    try {
      const detailed = await api.getReport(id);
      setSelectedReport(detailed);
      setAnalysisResult(
        detailed.ai_interpretation
          ? {
              ai_interpretation: detailed.ai_interpretation,
              summary: detailed.summary,
              key_findings: [],
              potential_abnormalities: [],
            }
          : null
      );
    } catch (err) {
      console.error("Select report error:", err);
    }
  };

  const handleUploadSuccess = (newReport: MedicalReport) => {
    setShowUploader(false);
    setReports((prev) => [newReport, ...prev]);
    setSelectedReport(newReport);
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Are you sure you want to delete this laboratory report?")) return;
    sound.playClick();
    try {
      await api.deleteReport(id);
      const remaining = reports.filter((r) => r.id !== id);
      setReports(remaining);
      if (remaining.length > 0) {
        selectReport(remaining[0].id);
      } else {
        setSelectedReport(null);
      }
    } catch (err) {
      console.error("Delete report error:", err);
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!selectedReport) return;
    sound.playClick();
    setIsAnalyzing(true);
    try {
      const result = await api.analyzeReport(selectedReport.id);
      setAnalysisResult(result);
      setSelectedReport((prev) =>
        prev ? { ...prev, ai_interpretation: result.ai_interpretation } : null
      );
      sound.playSuccess();
    } catch (err: any) {
      sound.playAlert();
      alert(`AI Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateMeasurement = async (
    mId: number,
    data: { value?: number; unit?: string; flag?: string; user_verified?: boolean }
  ) => {
    if (!selectedReport) return;
    sound.playClick();
    try {
      const updated = await api.updateMeasurement(selectedReport.id, mId, data);
      setSelectedReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          measurements: (prev.measurements || []).map((m) =>
            m.id === mId ? { ...m, ...updated } : m
          ),
        };
      });
      sound.playSuccess();
    } catch (err: any) {
      sound.playAlert();
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleAddBiomarker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    sound.playClick();
    setIsAddingBiomarker(true);
    try {
      const created = await api.addMeasurement(selectedReport.id, {
        test_name: newBiomarker.test_name.trim(),
        value: Number(newBiomarker.value),
        unit: newBiomarker.unit.trim(),
        reference_text: newBiomarker.reference_text.trim(),
        flag: newBiomarker.flag,
      });
      sound.playSuccess();
      setSelectedReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          measurements: [...(prev.measurements || []), created],
        };
      });
      setShowAddModal(false);
      setNewBiomarker({
        test_name: "",
        value: 100.0,
        unit: "mg/dL",
        reference_text: "70 - 99 mg/dL",
        flag: "normal",
      });
    } catch (err: any) {
      sound.playAlert();
      alert(`Failed to add biomarker: ${err.message}`);
    } finally {
      setIsAddingBiomarker(false);
    }
  };

  const handleSignOffAll = async () => {
    if (!selectedReport || !selectedReport.measurements) return;
    sound.playClick();
    try {
      for (const m of selectedReport.measurements) {
        if (!m.user_verified) {
          await api.updateMeasurement(selectedReport.id, m.id, { user_verified: true });
        }
      }
      setSelectedReport((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          measurements: (prev.measurements || []).map((m) => ({ ...m, user_verified: true })),
        };
      });
      sound.playSuccess();
      setSignOffToast("All laboratory measurements marked verified by patient / clinician.");
      setTimeout(() => setSignOffToast(null), 4000);
    } catch (err: any) {
      sound.playAlert();
      alert(`Sign-off error: ${err.message}`);
    }
  };

  const formatConfidence = (val?: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "0%";
    const normalized = val > 1 ? val : val * 100;
    return `${Math.min(100, Math.max(0, Math.round(normalized)))}%`;
  };

  const filteredMeasurements = (selectedReport?.measurements || []).filter((m) => {
    if (tableFilter === "abnormal") return m.is_abnormal;
    if (tableFilter === "normal") return !m.is_abnormal;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
          {/* Page Title & Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Laboratory Report Analysis & Extraction
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated multi-pass extraction for CBC, metabolic panels, serology, and lipid biomarkers with clinical reference intervals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowUploader(!showUploader);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New Report</span>
              </button>
            </div>
          </div>

          {/* Safety Notice */}
          <SafetyNotice
            type="clinical_disclaimer"
            message="Extracted values require verification. Automated optical and rule-based parsers extract laboratory figures into structured records. Please verify extracted numerical values against your physical laboratory paper before clinical reliance."
          />

          {/* Toast Notification */}
          {signOffToast && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{signOffToast}</span>
            </div>
          )}

          {/* Upload Modal / Collapsible Section */}
          {showUploader && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <ReportUploader onSuccess={handleUploadSuccess} />
            </div>
          )}

          {/* Main Grid: Left Report History / Right Report Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Report History List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold text-foreground">Report History ({reports.length})</span>
                <span>Sorted by Date</span>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : reports.length === 0 ? (
                <EmptyState
                  title="No Laboratory Reports Found"
                  description="Upload a medical report in PDF, image, CSV, or text format to begin automated clinical biomarker extraction."
                  icon={FileText}
                  actionText="Upload First Report"
                  onAction={() => setShowUploader(true)}
                />
              ) : (
                <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
                  {reports.map((r) => {
                    const isSelected = selectedReport?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => {
                          sound.playClick();
                          selectReport(r.id);
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer smooth-card transition-all ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30 translate-x-1"
                            : "bg-surface-low/50 dark:bg-[#111d24]/50 hover:bg-surface-low dark:hover:bg-[#162732] border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-foreground truncate max-w-[180px]">
                            {r.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(r.report_date)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                          {r.report_type} • {r.measurement_count || 0} tests
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                          <span className="font-medium text-foreground">
                            Confidence: {formatConfidence(r.extraction_confidence)}
                          </span>
                          {r.abnormal_count > 0 ? (
                            <MedicalStatusBadge flag="elevated" />
                          ) : (
                            <MedicalStatusBadge flag="normal" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Selected Report Detail */}
            <div className="lg:col-span-8 space-y-5">
              {selectedReport ? (
                <>
                  {/* Report Summary Card */}
                  <div className="p-5 rounded-2xl border border-border bg-white dark:bg-[#162732] shadow-2xs space-y-4 transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {selectedReport.report_type}
                        </span>
                        <h2 className="text-lg font-bold text-foreground">
                          {selectedReport.title}
                        </h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                          <span>Date: {formatDate(selectedReport.report_date)}</span>
                          <span>•</span>
                          <span>Extraction Confidence: {formatConfidence(selectedReport.extraction_confidence)}</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Download Export Links */}
                        <a
                          href={api.getReportExportPdfUrl(selectedReport.id)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => sound.playClick()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-xs font-semibold hover:bg-surface-container dark:hover:bg-[#1c303d] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" />
                          <span>PDF</span>
                        </a>

                        <a
                          href={api.getReportExportCsvUrl(selectedReport.id)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => sound.playClick()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-xs font-semibold hover:bg-surface-container dark:hover:bg-[#1c303d] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-secondary" />
                          <span>CSV</span>
                        </a>

                        <button
                          onClick={handleSignOffAll}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all shadow-2xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify All</span>
                        </button>

                        <button
                          onClick={handleRunAiAnalysis}
                          disabled={isAnalyzing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all shadow-2xs disabled:opacity-50"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5" />
                              <span>Interpret with AI</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteReport(selectedReport.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AI Clinical Interpretation Box */}
                    {analysisResult && (
                      <div className="p-4 rounded-xl bg-surface-low/80 dark:bg-[#111d24]/60 border border-primary/20 space-y-2 text-xs">
                        <div className="flex items-center justify-between font-bold text-primary">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4" /> AI Clinical Interpretation Summary
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Physiological Context
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed">
                          {analysisResult.ai_interpretation}
                        </p>
                      </div>
                    )}

                    {/* Verified Extracted Table */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            Extracted Biomarkers & Numerical Values ({filteredMeasurements.length})
                          </span>
                          <button
                            onClick={() => {
                              sound.playClick();
                              setShowAddModal(true);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            Add Biomarker
                          </button>
                        </div>

                        <div className="flex items-center gap-1 bg-surface-low dark:bg-[#111d24] p-0.5 rounded-lg border border-border/50 text-[11px]">
                          {(["all", "abnormal", "normal"] as const).map((f) => (
                            <button
                              key={f}
                              onClick={() => {
                                sound.playClick();
                                setTableFilter(f);
                              }}
                              className={`px-2 py-0.5 rounded font-medium transition-all ${
                                tableFilter === f
                                  ? "bg-white dark:bg-[#1c303d] text-primary shadow-2xs font-semibold"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {f === "all" ? "All Tests" : f === "abnormal" ? "Abnormal Flags" : "Normal Tests"}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filteredMeasurements.length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-border bg-surface-low/30 dark:bg-[#111d24]/30 space-y-2 text-xs">
                          <p className="font-semibold text-foreground">No Biomarkers Found for This Filter</p>
                          <p className="text-muted-foreground text-[11px]">
                            Click &ldquo;Add Biomarker&rdquo; above to manually insert laboratory test values.
                          </p>
                        </div>
                      ) : (
                        <LabResultsTable
                          measurements={filteredMeasurements}
                          onUpdateMeasurement={handleUpdateMeasurement}
                        />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center p-8 text-center bg-white dark:bg-[#162732] rounded-2xl border border-dashed border-border text-xs">
                  <p className="text-muted-foreground">Select a report from the list to view detailed biomarkers.</p>
                </div>
              )}
            </div>
          </div>

          {/* Add Biomarker Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in transition-all">
              <div className="bg-white dark:bg-[#162732] border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-scale-in">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Add Custom Laboratory Biomarker</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddBiomarker} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Test / Biomarker Name</label>
                    <input
                      type="text"
                      value={newBiomarker.test_name}
                      onChange={(e) => setNewBiomarker({ ...newBiomarker, test_name: e.target.value })}
                      placeholder="e.g. Fasting Glucose, HbA1c, Serum Ferritin..."
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Observed Value</label>
                      <input
                        type="number"
                        step="any"
                        value={newBiomarker.value}
                        onChange={(e) => setNewBiomarker({ ...newBiomarker, value: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Unit</label>
                      <input
                        type="text"
                        value={newBiomarker.unit}
                        onChange={(e) => setNewBiomarker({ ...newBiomarker, unit: e.target.value })}
                        placeholder="e.g. mg/dL, g/L, %"
                        className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Reference Range Interval</label>
                    <input
                      type="text"
                      value={newBiomarker.reference_text}
                      onChange={(e) => setNewBiomarker({ ...newBiomarker, reference_text: e.target.value })}
                      placeholder="e.g. 70.0 - 99.0 mg/dL"
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Clinical Flag</label>
                    <select
                      value={newBiomarker.flag}
                      onChange={(e) =>
                        setNewBiomarker({
                          ...newBiomarker,
                          flag: e.target.value as "normal" | "critical" | "low" | "high",
                        })
                      }
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                    >
                      <option value="normal">Normal / In-Range</option>
                      <option value="high">High / Elevated</option>
                      <option value="low">Low / Below Reference</option>
                      <option value="critical">Critical / Panic Value</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-low text-foreground hover:bg-surface-container"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingBiomarker}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-container shadow-xs flex items-center gap-1.5"
                    >
                      {isAddingBiomarker ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add Measurement
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
