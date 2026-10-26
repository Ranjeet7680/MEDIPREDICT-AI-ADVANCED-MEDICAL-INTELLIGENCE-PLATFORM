"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Award,
  Check,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  History,
  Loader2,
  Lock,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import LabResultsTable from "@/components/LabResultsTable";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sound } from "@/lib/sound";
import { ClinicianReportItem } from "@/types";

const SPECIALIST_DEPARTMENTS = [
  "Endocrinology & Diabetes Clinic",
  "Pediatric Gastroenterology",
  "Cardiology Acute Care",
  "Hematology & Oncology",
  "Nephrology & Renal Dialysis",
  "Internal Medicine MDT",
];

const ESCALATION_REASONS = [
  "Critical panic biomarker threshold (STAT attention required)",
  "Strongly positive autoimmune serology meeting diagnostic criteria",
  "Conflicting clinical presentation or unexpected laboratory variance",
  "Complex multi-morbidity requiring multi-disciplinary review",
  "Secondary physician opinion requested before immunosuppressive therapy",
];

export default function ClinicianWorkspacePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ClinicianReportItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<ClinicianReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [clinicianNotes, setClinicianNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Escalation Modal State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(SPECIALIST_DEPARTMENTS[0]);
  const [selectedReason, setSelectedReason] = useState(ESCALATION_REASONS[0]);

  // Audit Logs State
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const filter = statusFilter === "all" ? undefined : statusFilter;
      const data = await api.listClinicianReports(filter);
      setReports(data);
      if (data.length > 0 && !selectedReport) {
        setSelectedReport(data[0]);
        setClinicianNotes(data[0].clinician_notes || "");
      } else if (selectedReport) {
        const found = data.find((r: ClinicianReportItem) => r.id === selectedReport.id);
        if (found) setSelectedReport(found);
      }
    } catch (err) {
      console.error("Failed to load clinician queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await api.getClinicianAuditLogs(40);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to load clinician audit logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSelectReport = (rep: ClinicianReportItem) => {
    sound.playClick();
    setSelectedReport(rep);
    setClinicianNotes(rep.clinician_notes || "");
    setActionSuccess(null);
  };

  const handleSignOff = async (status: "approved" | "reviewed") => {
    if (!selectedReport) return;
    sound.playClick();
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      const updated = await api.reviewClinicianReport(
        selectedReport.id,
        clinicianNotes || "Clinically reviewed and verified in accordance with diagnostic guidelines.",
        status
      );
      sound.playSuccess();
      setActionSuccess("Report successfully signed off and marked Verified in patient record.");
      setSelectedReport(updated);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch (err: any) {
      sound.playAlert();
      alert(`Sign-off failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEscalation = async () => {
    if (!selectedReport) return;
    sound.playClick();
    setIsSubmitting(true);
    setActionSuccess(null);
    try {
      const updated = await api.reviewClinicianReport(
        selectedReport.id,
        clinicianNotes || `Case escalated to ${selectedDept}. Reason: ${selectedReason}`,
        "escalated",
        selectedReason,
        selectedDept
      );
      sound.playSuccess();
      setActionSuccess(`Case successfully escalated to ${selectedDept}.`);
      setSelectedReport(updated);
      setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setShowEscalateModal(false);
    } catch (err: any) {
      sound.playAlert();
      alert(`Escalation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderTriageBadge = (priority?: string) => {
    if (priority === "stat_critical") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          STAT CRITICAL
        </span>
      );
    }
    if (priority === "urgent") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          URGENT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
        ROUTINE
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Stethoscope className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Clinician Review & Diagnostic Sign-Off Queue
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white uppercase tracking-wider">
                  CDS Workspace
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Clinical decision support environment for licensed medical officers. Validate extracted biomarker measurements, review panic flags, and execute electronic sign-offs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  loadAuditLogs();
                  setShowAuditLogs(true);
                }}
                className="smooth-button flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white dark:bg-[#162732] text-foreground hover:bg-surface-low transition-all"
              >
                <History className="w-3.5 h-3.5 text-secondary" />
                Audit Trail
              </button>

              <button
                onClick={loadReports}
                disabled={isLoading}
                className="smooth-button flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-container transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Queue
              </button>
            </div>
          </div>

          {/* Clinical Ethics & Decision Notice */}
          <SafetyNotice
            type="research_warning"
            message="Biomarker parsing and AI summaries are advisory decision support tools. Clinical diagnosis, critical laboratory validation, and diagnostic escalation remain the exclusive responsibility of the licensed attending clinician."
          />

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            {[
              { id: "all", label: "All Cases" },
              { id: "pending", label: "Pending Review" },
              { id: "approved", label: "Verified & Signed-Off" },
              { id: "escalated", label: "Escalated to Specialist" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  sound.playClick();
                  setStatusFilter(f.id);
                }}
                className={`smooth-button px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === f.id
                    ? "bg-primary text-white shadow-xs font-semibold scale-102"
                    : "bg-surface-low dark:bg-[#162732] text-foreground border border-border hover:bg-surface-container"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Main Layout: Left Queue Table / Right Sign-Off Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Queue (5 Cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold text-foreground">Cases in Queue ({reports.length})</span>
                <span>Sorted by Urgency</span>
              </div>

              {isLoading ? (
                <div className="p-8 rounded-xl border border-border bg-surface-low dark:bg-[#162732] text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground">Loading clinical verification queue...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-border bg-surface-low dark:bg-[#162732] text-center space-y-2">
                  <CheckCircle className="w-8 h-8 text-secondary mx-auto" />
                  <p className="text-xs font-semibold text-foreground">Queue is Clear</p>
                  <p className="text-[11px] text-muted-foreground">
                    No clinical reports match the selected queue filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                  {reports.map((rep, idx) => {
                    const isSelected = selectedReport?.id === rep.id;
                    const hasAbnormal = (rep.abnormal_count || 0) > 0;
                    return (
                      <div
                        key={rep.id}
                        onClick={() => handleSelectReport(rep)}
                        className={`p-4 rounded-xl border cursor-pointer smooth-card transition-all ${
                          idx < 5 ? `stagger-${idx + 1}` : ""
                        } ${
                          isSelected
                            ? "bg-primary/5 border-primary shadow-xs ring-1 ring-primary/30 translate-x-1"
                            : "bg-white dark:bg-[#162732] border-border hover:border-primary/40 hover:bg-surface-low"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {renderTriageBadge(rep.triage_priority)}
                              <span className="text-[10px] font-mono text-muted-foreground">#{rep.id}</span>
                            </div>
                            <h3 className="text-xs font-bold text-foreground line-clamp-1">{rep.title}</h3>
                          </div>
                          <MedicalStatusBadge
                            flag={
                              rep.clinician_status === "approved"
                                ? "normal"
                                : rep.clinician_status === "escalated"
                                ? "critical"
                                : "irregular"
                            }
                          />
                        </div>

                        <div className="text-[11px] text-muted-foreground space-y-0.5 mb-2">
                          <p className="flex items-center gap-1 font-medium text-foreground">
                            <UserCheck className="w-3 h-3 text-secondary" />
                            {rep.patient_name || "Patient Record"}
                          </p>
                          <p className="flex items-center gap-1 text-[10px]">
                            <Clock className="w-3 h-3" />
                            Report Date: {new Date(rep.report_date).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/50">
                          <span className="text-muted-foreground">
                            Biomarkers: <strong className="text-foreground">{rep.measurement_count || 0}</strong>
                          </span>
                          {hasAbnormal ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              {rep.abnormal_count} Panic / Abnormal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              All Physiological Range
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Diagnostic & Sign-Off Details (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedReport ? (
                <div className="p-5 rounded-xl border border-border bg-white dark:bg-[#162732] space-y-5 shadow-xs">
                  {/* Report Card Header */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {renderTriageBadge(selectedReport.triage_priority)}
                        <h2 className="text-sm font-bold text-foreground">{selectedReport.title}</h2>
                        <MedicalStatusBadge
                          flag={
                            selectedReport.clinician_status === "approved"
                              ? "normal"
                              : selectedReport.clinician_status === "escalated"
                              ? "critical"
                              : "irregular"
                          }
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Patient: <strong className="text-foreground">{selectedReport.patient_name}</strong> • Record #{selectedReport.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={api.getReportExportPdfUrl(selectedReport.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground hover:bg-surface-container flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 text-primary" />
                        PDF
                      </a>
                      <a
                        href={api.getReportExportCsvUrl(selectedReport.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground hover:bg-surface-container flex items-center gap-1"
                      >
                        <Download className="w-3 h-3 text-secondary" />
                        CSV
                      </a>
                    </div>
                  </div>

                  {/* Success Alert */}
                  {actionSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{actionSuccess}</span>
                    </div>
                  )}

                  {/* Escalation Alert if already escalated */}
                  {selectedReport.clinician_status === "escalated" && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Case Escalated for Specialist Review
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Target Service: <strong>{selectedReport.escalation_department || "Specialist MDT"}</strong>
                        {selectedReport.escalation_reason && ` • Rationale: ${selectedReport.escalation_reason}`}
                      </p>
                    </div>
                  )}

                  {/* AI Generated Clinical Interpretation */}
                  {selectedReport.ai_interpretation && (
                    <div className="p-3.5 rounded-lg bg-surface-low dark:bg-[#111d24] border border-border text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        Automated Clinical Triaging Summary (Advisory)
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedReport.ai_interpretation}
                      </p>
                    </div>
                  )}

                  {/* Laboratory Measurements Breakdown */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-secondary" />
                      Extracted Laboratory Biomarkers ({selectedReport.measurements?.length || 0})
                    </h3>
                    <LabResultsTable
                      measurements={selectedReport.measurements || []}
                      onUpdateMeasurement={async (mId, updates) => {
                        try {
                          await api.updateMeasurement(selectedReport.id, mId, updates);
                          sound.playSuccess();
                          loadReports();
                        } catch (err: any) {
                          alert(`Update failed: ${err.message}`);
                        }
                      }}
                    />
                  </div>

                  {/* Clinician Review & Attestation Box */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-primary" />
                        Attending Clinician Observations & Diagnostic Notes
                      </label>
                      {selectedReport.clinician_reviewed_at && (
                        <span className="text-[10px] text-muted-foreground">
                          Last sign-off: {new Date(selectedReport.clinician_reviewed_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <textarea
                      value={clinicianNotes}
                      onChange={(e) => setClinicianNotes(e.target.value)}
                      placeholder="Add diagnostic impressions, clinical correlation, required follow-up tests, or physician recommendations..."
                      rows={4}
                      className="w-full p-3 text-xs rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />

                    {/* Action Sign-Off Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Lock className="w-3.5 h-3.5 text-secondary" />
                        <span>Sign-off logged in audit trail under HIPAA / DPDP Act.</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            sound.playClick();
                            setShowEscalateModal(true);
                          }}
                          disabled={isSubmitting}
                          className="smooth-button px-3.5 py-2 text-xs font-semibold rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Escalate to Specialist
                        </button>
                        <button
                          onClick={() => handleSignOff("approved")}
                          disabled={isSubmitting}
                          className="smooth-button px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-container shadow-xs transition-all flex items-center gap-1.5"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Approve & Electronically Sign
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 rounded-xl border border-dashed border-border bg-surface-low dark:bg-[#162732] text-center space-y-2">
                  <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto" />
                  <h3 className="text-xs font-bold text-foreground">Select a Laboratory Report</h3>
                  <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                    Select a patient report from the queue on the left to review parsed biomarkers, evaluate abnormal thresholds, and record diagnostic sign-off.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Specialist Escalation Modal */}
          {showEscalateModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in">
              <div className="bg-white dark:bg-[#162732] border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 animate-scale-in">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-foreground">Escalate Case to Specialist Service</h3>
                  </div>
                  <button
                    onClick={() => setShowEscalateModal(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Target Specialist Department</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                    >
                      {SPECIALIST_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Clinical Rationale for Escalation</label>
                    <select
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                    >
                      {ESCALATION_REASONS.map((reason) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Additional Attending Notes</label>
                    <textarea
                      value={clinicianNotes}
                      onChange={(e) => setClinicianNotes(e.target.value)}
                      placeholder="Specific clinical findings or patient symptoms to highlight for the specialist team..."
                      rows={3}
                      className="w-full p-2.5 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setShowEscalateModal(false)}
                    className="smooth-button px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface-low text-foreground hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmEscalation}
                    disabled={isSubmitting}
                    className="smooth-button px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-xs flex items-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Confirm Escalation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audit Logs Drawer / Modal */}
          {showAuditLogs && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in">
              <div className="bg-white dark:bg-[#162732] border border-border rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 animate-scale-in">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <History className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm font-bold text-foreground">Clinician Review Audit Trail</h3>
                  </div>
                  <button
                    onClick={() => setShowAuditLogs(false)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Immutable regulatory audit records for electronic signatures, verifications, and diagnostic escalations under DPDP Act 2023 / HIPAA compliance.
                </p>

                {loadingLogs ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Loading audit records...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No clinician audit events recorded yet.
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary uppercase">
                              {log.action}
                            </span>
                            <span>Report #{log.resource_id}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Clinician ID: {log.user_id} • Status: {log.details?.status || "Reviewed"}
                            {log.details?.department && ` • Escalated to: ${log.details.department}`}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-border">
                  <button
                    onClick={() => setShowAuditLogs(false)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-container"
                  >
                    Close Audit Trail
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
