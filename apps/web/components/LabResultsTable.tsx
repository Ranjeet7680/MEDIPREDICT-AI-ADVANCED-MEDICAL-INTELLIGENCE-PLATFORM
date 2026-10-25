"use client";

import React, { useState } from "react";
import { Check, Edit2, HelpCircle, ShieldCheck } from "lucide-react";
import MedicalStatusBadge from "@/components/MedicalStatusBadge";
import { LaboratoryMeasurement } from "@/types";

interface LabResultsTableProps {
  measurements: LaboratoryMeasurement[];
  onUpdateMeasurement?: (
    id: number,
    data: { value?: number; unit?: string; flag?: string; user_verified?: boolean }
  ) => Promise<void>;
}

export default function LabResultsTable({
  measurements,
  onUpdateMeasurement,
}: LabResultsTableProps) {
  const [editingItem, setEditingItem] = useState<LaboratoryMeasurement | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<string>("");
  const [editFlag, setEditFlag] = useState<string>("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (m: LaboratoryMeasurement) => {
    setEditingItem(m);
    setEditValue(m.value);
    setEditUnit(m.unit);
    setEditFlag(m.flag);
  };

  const saveEdit = async () => {
    if (!editingItem || !onUpdateMeasurement) return;
    setIsSubmitting(true);
    try {
      await onUpdateMeasurement(editingItem.id, {
        value: Number(editValue),
        unit: editUnit,
        flag: editFlag,
        user_verified: true,
      });
      setEditingItem(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-low/60 dark:bg-surface-variant/20 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
              <th className="py-3 px-4">Biomarker / Test</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Observed Value</th>
              <th className="py-3 px-4">Reference Interval</th>
              <th className="py-3 px-4">Clinical Flag</th>
              <th className="py-3 px-4">Verification</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {measurements.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-surface-low/30 dark:hover:bg-surface-variant/10 transition-colors"
              >
                <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-1.5">
                  {m.test_name}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{m.category}</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-sm text-foreground">{m.value}</span>{" "}
                  <span className="text-[11px] text-muted-foreground">{m.unit}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {m.reference_text || (m.reference_low ? `${m.reference_low} - ${m.reference_high} ${m.unit}` : "Standard")}
                </td>
                <td className="py-3 px-4">
                  <MedicalStatusBadge flag={m.flag} />
                </td>
                <td className="py-3 px-4">
                  {m.user_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Needs Review
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => startEdit(m)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-primary hover:bg-surface-low dark:hover:bg-surface-variant/30 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Correct
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* In-place Correction Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#1a2e38] p-5 border border-border shadow-2xl">
            <h3 className="text-sm font-bold text-foreground mb-1">
              Verify / Correct Extracted Value
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Biomarker: <span className="font-semibold text-foreground">{editingItem.test_name}</span>. Original extraction was {editingItem.value} {editingItem.unit}.
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Measured Value</label>
                <input
                  type="number"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Clinical Flag</label>
                <select
                  value={editFlag}
                  onChange={(e) => setEditFlag(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value="normal">Normal (Within Reference)</option>
                  <option value="low">Low (Below Reference)</option>
                  <option value="high">High (Elevated)</option>
                  <option value="critical">Critical (Markedly Abnormal)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-surface-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {isSubmitting ? "Saving..." : "Confirm & Verify"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
