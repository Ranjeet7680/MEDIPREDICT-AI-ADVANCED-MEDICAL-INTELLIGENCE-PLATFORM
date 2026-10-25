import React from "react";
import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SafetyNoticeProps {
  type?: "emergency" | "clinical_disclaimer" | "research_warning";
  message?: string;
  className?: string;
}

export default function SafetyNotice({
  type = "clinical_disclaimer",
  message,
  className,
}: SafetyNoticeProps) {
  if (type === "emergency") {
    return (
      <div
        className={cn(
          "p-4 rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-sm",
          className
        )}
      >
        <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-red-800 dark:text-red-300 uppercase tracking-wide">
            Critical Emergency Guidance
          </p>
          <p className="leading-relaxed">
            {message ||
              "If you or someone nearby is experiencing chest pain, difficulty breathing, stroke symptoms (facial droop, arm weakness, slurred speech), severe allergic reactions, or acute trauma, dial emergency services (112 / 911 / 999) or proceed to the nearest hospital immediately."}
          </p>
        </div>
      </div>
    );
  }

  if (type === "research_warning") {
    return (
      <div
        className={cn(
          "p-3.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs",
          className
        )}
      >
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-amber-800 dark:text-amber-300">
            Investigational Clinical Model
          </p>
          <p className="leading-relaxed text-muted-foreground dark:text-amber-200/80">
            {message ||
              "Statistical disease risk estimations and algorithmic classifications are provided strictly for research and clinical education. They are NOT definitive medical diagnoses and must not be used to guide therapy without licensed physician evaluation."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border border-border bg-surface-low/80 dark:bg-surface-dim/20 text-surface-onVariant text-[11px] flex items-center gap-2.5",
        className
      )}
    >
      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
      <p className="leading-relaxed">
        <span className="font-semibold text-foreground">Medical Disclaimer:</span> MediPredict AI is
        an intelligent decision-support and health education platform. Content is grounded in
        peer-reviewed medical evidence and structured laboratory reference intervals. It does not
        substitute for professional clinical diagnosis or consultation with a qualified doctor.
      </p>
    </div>
  );
}
