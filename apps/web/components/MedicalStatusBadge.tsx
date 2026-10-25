import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MedicalStatusBadgeProps {
  flag: "normal" | "low" | "high" | "critical" | "elevated" | "irregular" | string;
  className?: string;
}

export default function MedicalStatusBadge({ flag, className }: MedicalStatusBadgeProps) {
  const normalized = flag.toLowerCase();

  switch (normalized) {
    case "critical":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/40 dark:text-red-300",
            className
          )}
        >
          <AlertCircle className="w-3 h-3 text-red-600" />
          Critical Alert
        </span>
      );
    case "high":
    case "elevated":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300",
            className
          )}
        >
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          Elevated
        </span>
      );
    case "low":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300",
            className
          )}
        >
          <Info className="w-3 h-3 text-blue-600" />
          Low
        </span>
      );
    case "irregular":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300",
            className
          )}
        >
          <AlertTriangle className="w-3 h-3 text-purple-600" />
          Irregular
        </span>
      );
    case "normal":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300",
            className
          )}
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Normal
        </span>
      );
  }
}
