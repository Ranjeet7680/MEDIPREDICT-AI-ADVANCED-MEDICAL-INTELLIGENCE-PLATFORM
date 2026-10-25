"use client";

import React from "react";
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
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground bg-surface-low/20 rounded-xl border border-dashed border-border">
        No measurements recorded for this timeframe.
      </div>
    );
  }

  // Format and sort chronological
  const formattedData = [...data]
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(110, 121, 120, 0.15)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6e7978" }}
            axisLine={{ stroke: "rgba(110, 121, 120, 0.2)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6e7978" }}
            axisLine={false}
            tickLine={false}
            unit={` ${unit}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "0.5rem",
              border: "1px solid #bdc9c7",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name={primaryLabel}
            stroke="#00635e"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#00635e" }}
            activeDot={{ r: 6 }}
          />
          {isDualValue && (
            <Line
              type="monotone"
              dataKey="secondary"
              name={secondaryLabel}
              stroke="#0f5a98"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 4, fill: "#0f5a98" }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
