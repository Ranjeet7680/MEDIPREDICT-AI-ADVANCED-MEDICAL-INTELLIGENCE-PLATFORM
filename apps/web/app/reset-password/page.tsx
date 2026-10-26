"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Globe, KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Password reset failed");
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Password Successfully Updated</p>
        <p className="text-xs text-muted-foreground">
          Your password has been changed. You can now sign in using your new credentials.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-container transition-all shadow-sm w-full"
        >
          <span>Sign In Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Reset Verification Token
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste reset token"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary font-mono"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          New Password (min. 6 characters)
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
          Confirm New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Updating password...
          </>
        ) : (
          "Save New Password"
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface text-foreground">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
              <Globe className="w-6 h-6 stroke-[2.2]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              MediPredict <span className="text-primary">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Choose a New Password</h2>
          <p className="text-xs text-muted-foreground">
            Enter your new secure password below to regain access.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Loading reset form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
