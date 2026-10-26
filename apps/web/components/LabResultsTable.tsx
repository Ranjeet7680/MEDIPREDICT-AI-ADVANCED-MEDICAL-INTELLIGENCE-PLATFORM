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
    <div className="w-full overflow-hidden rounded-xl border border-border bg-white dark:bg-[#162732] shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-low/60 dark:bg-[#111d24]/60 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
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
                className="hover:bg-surface-low/40 dark:hover:bg-[#1c303d]/40 transition-colors"
              >
                <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-1.5">
                  {m.test_name}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{m.category}</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-sm text-foreground">{m.value}</span>{" "}
                  <span className="text-[11px] text-muted-foreground">{m.unit}</span>
                </td>
                <td className="py-3 px-4 text-muted-foreground font-mono text-[11px]">
                  {m.reference_text || (m.reference_low ? `${m.reference_low} - ${m.reference_high} ${m.unit}` : "Standard")}
                </td>
                <td className="py-3 px-4">
                  <MedicalStatusBadge flag={m.flag} />
                </td>
                <td className="py-3 px-4">
                  {m.user_verified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <HelpCircle className="w-3.5 h-3.5" /> Auto-Parsed
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  {onUpdateMeasurement && (
                    <button
                      onClick={() => startEdit(m)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-[#162732] border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">
              Verify / Edit {editingItem.test_name}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Observed Value</label>
                <input
                  type="number"
                  step="any"
                  value={editValue}
                  onChange={(e) => setEditValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Unit</label>
                <input
                  type="text"
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                />
              </div>
              <div>
                <label className="block text-muted-foreground font-medium mb-1">Clinical Flag</label>
                <select
                  value={editFlag}
                  onChange={(e) => setEditFlag(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-[#111d24] text-foreground"
                >
                  <option value="normal">Normal (Within Reference)</option>
                  <option value="elevated">Elevated / High</option>
                  <option value="critical_high">Critical High</option>
                  <option value="critical_low">Critical Low</option>
                  <option value="inconclusive">Inconclusive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-surface-low dark:hover:bg-[#111d24]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={saveEdit}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Save Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
