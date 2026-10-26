"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Globe, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetTokenDev, setResetTokenDev] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setIsSubmitted(true);
      if (data.reset_token_dev) {
        setResetTokenDev(data.reset_token_dev);
      }
    } catch {
      setIsSubmitted(true);
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
          <h2 className="text-xl font-bold tracking-tight text-foreground">Reset Your Password</h2>
          <p className="text-xs text-muted-foreground">
            Enter your registered email address and we will issue password reset instructions.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Instructions Dispatched</p>
            <p className="text-xs text-muted-foreground">
              If an account with {email} exists, password reset verification has been initiated.
            </p>
            {resetTokenDev && (
              <div className="p-3 rounded-lg bg-surface-low text-left space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Testing Token Link:</span>
                <Link
                  href={`/reset-password?token=${resetTokenDev}`}
                  className="block text-xs text-primary font-medium underline truncate"
                >
                  Proceed to Reset Password Now
                </Link>
              </div>
            )}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Registered Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
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
                  Sending instructions...
                </>
              ) : (
                "Send Password Reset Link"
              )}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
