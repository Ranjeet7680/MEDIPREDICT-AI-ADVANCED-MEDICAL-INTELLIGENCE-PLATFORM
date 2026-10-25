"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2, Lock, ShieldCheck, User as UserIcon } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      await api.updateMe({ full_name: fullName });
      await refreshUser();
      setMessage("Profile information updated successfully.");
    } catch (err: any) {
      setMessage(`Update failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
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
              Account & Profile Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your personal identity, credentials, and notification settings.
            </p>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-border pb-1 text-xs font-semibold">
            <Link href="/settings/profile" className="px-3 py-1.5 rounded-lg bg-primary text-white">
              Profile
            </Link>
            <Link
              href="/settings/security"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-surface-low"
            >
              Security & Sessions
            </Link>
            <Link
              href="/settings/privacy"
              className="px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-surface-low"
            >
              Privacy & Consents (DPDP)
            </Link>
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-surface-low border border-border text-xs text-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {/* Profile Form */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-6 text-xs">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                {user?.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{user?.full_name}</h3>
                <p className="text-muted-foreground">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-surface-low border border-border font-mono text-[10px] capitalize">
                  Role: {user?.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full sm:w-80 px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Email Address (Primary Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full sm:w-80 px-3 py-2 rounded-lg border border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Email address changes require clinical administrator verification.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">Account Creation Date</label>
                <input
                  type="text"
                  disabled
                  value={formatDate(user?.created_at)}
                  className="w-full sm:w-80 px-3 py-2 rounded-lg border border-border bg-muted/40 text-muted-foreground cursor-not-allowed font-mono text-[11px]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
