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
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import LabResultsTable from "@/components/LabResultsTable";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import ReportUploader from "@/components/ReportUploader";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton, TableSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { MedicalReport } from "@/types";

export default function ReportsPage() {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

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
    setIsAnalyzing(true);
    try {
      const result = await api.analyzeReport(selectedReport.id);
      setAnalysisResult(result);
      setSelectedReport((prev) =>
        prev ? { ...prev, ai_interpretation: result.ai_interpretation } : null
      );
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateMeasurement = async (
    measId: number,
    data: { value?: number; unit?: string; flag?: string; user_verified?: boolean }
  ) => {
    if (!selectedReport) return;
    try {
      const updatedMeas = await api.updateMeasurement(selectedReport.id, measId, data);
      setSelectedReport((prev) => {
        if (!prev || !prev.measurements) return prev;
        return {
          ...prev,
          measurements: prev.measurements.map((m) => (m.id === measId ? updatedMeas : m)),
        };
      });
    } catch (err) {
      console.error("Update measurement error:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl overflow-y-auto">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FileCheck2 className="w-6 h-6 text-primary" /> Laboratory Report Intelligence
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automated biomarker extraction, reference range comparison, and human-in-the-loop verification.
              </p>
            </div>

            <button
              onClick={() => setShowUploader(!showUploader)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{showUploader ? "Close Uploader" : "Upload New Report"}</span>
            </button>
          </div>

          {/* Collapsible Uploader */}
          {showUploader && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <ReportUploader onSuccess={handleUploadSuccess} />
            </div>
          )}

          <SafetyNotice
            type="clinical_disclaimer"
            message="Laboratory interpretations are informational guides. An out-of-range flag does not equate to an autonomous clinical diagnosis. Please review all extracted values with your physician."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Report Navigator List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Report History ({reports.length})
                </span>
                <button onClick={loadReports} className="text-xs text-primary hover:underline">
                  Refresh
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#1a2e38] rounded-xl border border-dashed border-border text-xs">
                  <FileText className="w-8 h-8 text-primary mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-foreground">No Reports On Record</p>
                  <p className="text-muted-foreground mt-1 mb-3">
                    Upload your first laboratory report to view extracted measurements.
                  </p>
                  <button
                    onClick={() => setShowUploader(true)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    Upload Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => {
                    const isSelected = selectedReport?.id === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => selectReport(r.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-white dark:bg-[#1a2e38] border-primary shadow-sm ring-1 ring-primary/20"
                            : "bg-surface-low/50 hover:bg-surface-low border-border"
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
                          {r.report_type} • {r.measurement_count} tests
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                          <span className="font-medium text-foreground">
                            Confidence: {Math.round(r.extraction_confidence * 100)}%
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
                  <div className="p-5 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-4">
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
                          <span>Extraction Confidence: {Math.round(selectedReport.extraction_confidence * 100)}%</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Download Export Link */}
                        <a
                          href={api.getReportExportUrl(selectedReport.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-low text-xs font-semibold hover:bg-surface-container transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Summary</span>
                        </a>

                        <button
                          onClick={handleRunAiAnalysis}
                          disabled={isAnalyzing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-xs disabled:opacity-50"
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
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AI Clinical Interpretation Box */}
                    {analysisResult && (
                      <div className="p-4 rounded-xl bg-surface-low/80 dark:bg-surface-variant/20 border border-primary/20 space-y-2 text-xs">
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground">
                          Extracted Biomarkers & Numerical Values ({selectedReport.measurements?.length || 0})
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Click &quot;Correct&quot; to review or adjust any measurement.
                        </span>
                      </div>

                      <LabResultsTable
                        measurements={selectedReport.measurements || []}
                        onUpdateMeasurement={handleUpdateMeasurement}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-96 flex items-center justify-center p-8 text-center bg-white dark:bg-[#1a2e38] rounded-2xl border border-dashed border-border text-xs">
                  <p className="text-muted-foreground">Select a report from the list to view detailed biomarkers.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
