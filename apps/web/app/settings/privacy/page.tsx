"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Download,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { UserConsent } from "@/types";

export default function PrivacySettingsPage() {
  const { logout } = useAuth();
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      const data = await api.getConsents();
      setConsents(data);
    } catch (err) {
      console.error("Load consents error:", err);
    }
  };

  const handleToggleConsent = async (consentType: string, currentGranted: boolean) => {
    try {
      const updated = await api.updateConsent(consentType, !currentGranted);
      setConsents((prev) =>
        prev.map((c) => (c.consent_type === consentType ? updated : c))
      );
      setMessage(`Consent preference updated for ${consentType}.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Toggle consent error:", err);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportJson = await api.exportPrivacyData();
      const blob = new Blob([JSON.stringify(exportJson, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medipredict_personal_data_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export data error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
    } catch (err) {
      console.error("Delete account error:", err);
      setIsDeleting(false);
    }
  };

  const isConsentGranted = (type: string) => {
    const c = consents.find((item) => item.consent_type === type);
    return c ? c.granted : true;
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl overflow-y-auto">
          {/* Header */}
          <div className="pb-4 border-b border-border">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Privacy, Governance & Consents
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Governed under India&apos;s Digital Personal Data Protection (DPDP) Act 2023 & global health privacy principles.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-border pb-1 text-xs font-semibold">
            <Link
              href="/settings/profile"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-surface-low"
            >
              Profile
            </Link>
            <Link
              href="/settings/security"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-surface-low"
            >
              Security & Sessions
            </Link>
            <Link href="/settings/privacy" className="px-3 py-1.5 rounded-lg bg-primary text-white">
              Privacy & Consents (DPDP)
            </Link>
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* DPDP Consent Center */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Active Consent Preferences
              </h3>
              <p className="text-muted-foreground mt-0.5">
                Manage how your clinical data, laboratory measurements, and queries are processed.
              </p>
            </div>

            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {/* Consent 1 */}
              <div className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#1a2e38]">
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">AI Medical Analysis & Query Processing</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Permits the AI provider to summarize your laboratory reports and provide contextual medical information.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleConsent("ai_data_analysis", isConsentGranted("ai_data_analysis"))
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    isConsentGranted("ai_data_analysis") ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isConsentGranted("ai_data_analysis") ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Consent 2 */}
              <div className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#1a2e38]">
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">Health Records Vault Persistence</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Enables persistent database storage for your laboratory reports, health metrics, and immunization cards.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleConsent(
                      "health_records_storage",
                      isConsentGranted("health_records_storage")
                    )
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    isConsentGranted("health_records_storage") ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isConsentGranted("health_records_storage") ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Consent 3 */}
              <div className="p-4 flex items-center justify-between gap-4 bg-white dark:bg-[#1a2e38]">
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">De-identified Scientific Research Aggregation</p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Contributes strictly anonymized numerical laboratory ranges to open clinical research cohorts.
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleToggleConsent(
                      "anonymized_research",
                      isConsentGranted("anonymized_research")
                    )
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    isConsentGranted("anonymized_research") ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      isConsentGranted("anonymized_research") ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Data Portability (Export) */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" /> Right to Data Portability (Export)
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with DPDP Act Sec. 12 and GDPR Art. 20, you can export your complete personal health record, including profile details, laboratory measurements, health metric logs, and active consents in standardized JSON format.
            </p>
            <div className="pt-1">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface-low hover:bg-surface-container text-foreground font-semibold transition-colors"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Download Complete Personal Data Archive (.json)</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Account Deletion */}
          <div className="p-6 rounded-2xl border border-red-200 bg-red-50/50 dark:bg-red-950/10 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-red-900 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" /> Danger Zone: Permanent Account Deletion
            </h3>
            <p className="text-red-800/80 dark:text-red-300/80 leading-relaxed">
              Requesting account erasure permanently purges all uploaded laboratory reports, numerical metrics, consultations, and profile records. This action cannot be reversed.
            </p>

            <div className="pt-1">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account & Erase Records</span>
              </button>
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a2e38] p-6 border border-border shadow-2xl space-y-4 text-xs">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Confirm Account Deletion</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Are you absolutely certain? This will immediately delete your account credentials, all stored laboratory measurements, historical blood pressure/glucose readings, and audit events.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-surface-low"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="px-4 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center gap-1"
                  >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Confirm Permanent Erasure</span>
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
