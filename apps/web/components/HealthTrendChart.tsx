"use client";

import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "@/lib/utils";

interface HealthTrendChartProps {
  data: Array<{
    recorded_at: string;
    value: number;
    secondary_value?: number;
  }>;
  unit: string;
  metricName: string;
  isDualValue?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export default function HealthTrendChart({
  data,
  unit,
  metricName,
  isDualValue = false,
  primaryLabel = "Value",
  secondaryLabel = "Diastolic",
}: HealthTrendChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validData = Array.isArray(data)
    ? data.filter((item) => item && item.recorded_at && typeof item.value === "number")
    : [];

  if (!isMounted || validData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground bg-surface-low/30 dark:bg-[#162732]/40 rounded-xl border border-dashed border-border">
        {!isMounted ? (
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        ) : (
          "No measurements recorded for this timeframe."
        )}
      </div>
    );
  }

  // Format and sort chronological
  const formattedData = [...validData]
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((item) => ({
      date: formatDate(item.recorded_at),
      value: item.value,
      secondary: item.secondary_value,
    }));

  return (
    <div className="w-full h-72 pt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/60" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 11 }}
            stroke="currentColor"
            className="text-muted-foreground"
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="p-2.5 rounded-lg border border-border bg-white dark:bg-[#162732] shadow-lg text-xs space-y-1">
                    <p className="font-semibold text-muted-foreground">{label}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground">
                        {primaryLabel}: {payload[0]?.value} {unit}
                      </span>
                    </div>
                    {isDualValue && payload[1] && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#167d78]" />
                        <span className="font-medium text-foreground">
                          {secondaryLabel}: {payload[1]?.value} {unit}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={primaryLabel}
            stroke="#00635e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#00635e" }}
            activeDot={{ r: 6, fill: "#70ded4" }}
          />
          {isDualValue && (
            <Line
              type="monotone"
              dataKey="secondary"
              name={secondaryLabel}
              stroke="#3573b3"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: "#3573b3" }}
              activeDot={{ r: 6, fill: "#9af2eb" }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
