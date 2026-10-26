"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe, Loader2, Lock, Mail, ShieldAlert, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeConsent, setAgreeConsent] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeConsent) {
      setError("Please accept the medical data privacy and consent terms to proceed.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
    } catch (err: any) {
      setError(err.message || "Failed to register account.");
    } finally {
      setIsLoading(false);
    }
  };

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
          <h2 className="text-xl font-bold tracking-tight text-foreground">Create Your Health Account</h2>
          <p className="text-xs text-muted-foreground">
            Get started with AI-assisted laboratory analysis and clinical risk research.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Full Legal Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Jordan Hayes or Alex Rivera"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

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
                placeholder="user@hospital.org"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Password (min. 6 characters)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              id="consent"
              checked={agreeConsent}
              onChange={(e) => setAgreeConsent(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="consent" className="leading-relaxed">
              I agree to the{" "}
              <Link href="/settings/privacy" className="text-primary underline">
                Data Processing Terms
              </Link>{" "}
              and acknowledge that MediPredict AI provides decision support, not independent medical diagnosis.
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-container transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
