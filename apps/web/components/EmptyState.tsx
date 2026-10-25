import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-border bg-surface-low/30 dark:bg-surface-variant/10">
      <div className="p-3.5 rounded-full bg-surface-container text-primary mb-3 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {actionText && (
        actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
}
