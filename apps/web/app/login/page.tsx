"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, KeyRound, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your email and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("demo@medipredict.ai");
    setPassword("MedicalAI2026!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface text-foreground">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              MediPredict <span className="text-primary">AI</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Sign In to Your Workspace</h2>
          <p className="text-xs text-muted-foreground">
            Enter your credentials to access laboratory reports, AI consultations, and research.
          </p>
        </div>

        {/* Demo Fast Login Pill */}
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <p className="font-semibold text-primary">Demo Clinician Account</p>
            <p className="text-[11px] text-muted-foreground">demo@medipredict.ai</p>
          </div>
          <button
            type="button"
            onClick={fillDemoAccount}
            className="px-3 py-1.5 rounded-lg bg-primary text-white font-semibold text-xs hover:bg-primary-container transition-all shadow-xs"
          >
            Auto-Fill
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@hospital.org"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Password</label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
