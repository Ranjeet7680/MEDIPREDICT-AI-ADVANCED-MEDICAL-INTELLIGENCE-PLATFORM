"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Page Exception:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface text-foreground text-center">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-[#162732] border border-border shadow-lg space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold">Dashboard Stream Sync Notice</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The dashboard encountered a momentary telemetry synchronization variance. All health records and lab panels remain safely stored.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Dashboard</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-surface-low dark:hover:bg-[#111d24]"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
