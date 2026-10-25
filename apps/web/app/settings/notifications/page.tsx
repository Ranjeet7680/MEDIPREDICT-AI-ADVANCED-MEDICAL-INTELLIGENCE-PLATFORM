"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Bell, Check, Mail, ShieldAlert } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";

export default function NotificationsSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [reportReady, setReportReady] = useState(true);
  const [criticalVitals, setCriticalVitals] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl overflow-y-auto">
          <div className="pb-4 border-b border-border">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Notification Preferences
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control clinical notifications, lab report extraction alerts, and security digests.
            </p>
          </div>

          {saved && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Notification preferences saved successfully.</span>
            </div>
          )}

          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Notification Channels
            </h3>

            <div className="space-y-4 divide-y divide-border">
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Critical Lab Outlier Alerts</p>
                  <p className="text-muted-foreground text-[11px]">
                    Immediate alerts when an uploaded laboratory test value is flagged as markedly critical.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={criticalVitals}
                  onChange={(e) => setCriticalVitals(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Report Extraction Completed</p>
                  <p className="text-muted-foreground text-[11px]">
                    Notifies you as soon as document OCR or CSV parsing finishes.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reportReady}
                  onChange={(e) => setReportReady(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Weekly Clinical Digest</p>
                  <p className="text-muted-foreground text-[11px]">
                    Summary of longitudinal health metrics, blood pressure averages, and newly published PubMed papers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-container transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
