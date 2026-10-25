import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 dark:bg-surface-variant/30",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-border bg-white dark:bg-[#1a2e38] space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full space-y-2">
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  );
}
