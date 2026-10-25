import React from "react";
import { LucideIcon } from "lucide-react";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  secondaryValue?: string | number;
  secondaryUnit?: string;
  status?: string;
  icon: LucideIcon;
  subtitle?: string;
  className?: string;
}

export default function MetricCard({
  title,
  value,
  unit,
  secondaryValue,
  secondaryUnit,
  status,
  icon: Icon,
  subtitle,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-surface-low dark:bg-surface-variant/30 text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
        {secondaryValue !== undefined && (
          <span className="text-base font-semibold text-muted-foreground ml-1">
            / {secondaryValue} {secondaryUnit}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-[11px]">
        {subtitle && <span className="text-muted-foreground truncate">{subtitle}</span>}
        {status && <MedicalStatusBadge flag={status} />}
      </div>
    </div>
  );
}
