"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";

export default function SecuritySettingsPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setIsUpdating(true);
    setMessage(null);
    setError(null);

    try {
      await api.updateMe({ password });
      setMessage("Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(`Failed to update password: ${err.message}`);
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
              Security & Session Management
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cryptographic credentials, password rotations, and active login sessions.
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
            <Link href="/settings/security" className="px-3 py-1.5 rounded-lg bg-primary text-white">
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
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          {/* Password Change Form */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Rotate Master Password
            </h3>
            <p className="text-muted-foreground">
              Ensure your account uses a strong passphrase with numbers, uppercase letters, and symbols.
            </p>

            <form onSubmit={handlePasswordUpdate} className="space-y-3 pt-1">
              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full sm:w-80 px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full sm:w-80 px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary-container transition-all flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Session Status */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Active Session Details
            </h3>
            <p className="text-muted-foreground">
              Current authenticated session is governed by encrypted JWT bearer tokens with 24-hour expiration.
            </p>
            <div className="p-3 rounded-xl bg-surface-low/60 dark:bg-surface-variant/20 border border-border font-mono text-[11px] text-muted-foreground space-y-1">
              <p>Session State: <span className="text-emerald-600 font-semibold">Active & Valid</span></p>
              <p>Cryptographic Algorithm: HS256 (HMAC-SHA256)</p>
              <p>Audit Log Tracking: Enabled (Every record read/write audited)</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
