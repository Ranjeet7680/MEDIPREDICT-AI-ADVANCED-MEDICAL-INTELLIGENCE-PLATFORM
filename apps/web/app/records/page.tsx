"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Download,
  FileCheck2,
  FilePlus,
  FolderHeart,
  Hospital,
  Plus,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { PersonalRecord } from "@/types";

export default function RecordsPage() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal to add personal health record
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Clinical Consultation",
    doctor_or_facility: "",
    summary: "",
    tagsString: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [selectedCategory]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const catParam = selectedCategory === "All" ? undefined : selectedCategory;
      const data = await api.listRecords(catParam);
      setRecords(data);
    } catch (err) {
      console.error("Load records error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tags = formData.tagsString
        ? formData.tagsString.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      await api.createRecord({
        title: formData.title,
        category: formData.category,
        doctor_or_facility: formData.doctor_or_facility || undefined,
        summary: formData.summary || undefined,
        tags,
      });
      setShowAddModal(false);
      setFormData({
        title: "",
        category: "Clinical Consultation",
        doctor_or_facility: "",
        summary: "",
        tagsString: "",
      });
      loadRecords();
    } catch (err) {
      console.error("Create record error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm("Are you sure you want to delete this personal health record?")) return;
    try {
      await api.deleteRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Delete record error:", err);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      (r.summary && r.summary.toLowerCase().includes(q)) ||
      (r.doctor_or_facility && r.doctor_or_facility.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl overflow-y-auto animate-fade-in-up">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <FolderHeart className="w-6 h-6 text-primary" /> Personal Health Records (PHR)
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centralized vault for immunizations, consultation summaries, prescriptions, and radiology notes.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Health Record</span>
            </button>
          </div>

          <SafetyNotice
            type="clinical_disclaimer"
            message="Health records are stored under strict user-level encryption and data segregation rules. Private health records are completely isolated and inaccessible to other users."
          />

          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
              {["All", "Immunization Record", "Clinical Consultation", "Radiology", "Pathology"].map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                      selectedCategory === cat
                        ? "bg-primary text-white shadow-xs"
                        : "bg-white dark:bg-[#1a2e38] border border-border text-foreground hover:bg-surface-low"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search records or facilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-white dark:bg-[#1a2e38] text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Records Grid */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block px-1">
              Stored Records ({filteredRecords.length})
            </span>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1a2e38] rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No personal health records found. Add your immunization cards, clinical notes, or doctor letters above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm smooth-card flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                          {r.category}
                        </span>
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-sm text-foreground">{r.title}</h3>

                      {r.doctor_or_facility && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <Hospital className="w-3.5 h-3.5 text-primary" />
                          <span>{r.doctor_or_facility}</span>
                        </p>
                      )}

                      {r.summary && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {r.summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(r.record_date)}
                      </span>
                      {r.tags && r.tags.length > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-low border border-border">
                          {r.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in transition-all">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1a2e38] p-6 border border-border shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-sm font-bold text-foreground">Add Personal Health Record</h3>

            <form onSubmit={handleCreateRecord} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Record Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Annual Influenza & Tdap Vaccine"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                >
                  <option value="Immunization Record">Immunization Record</option>
                  <option value="Clinical Consultation">Clinical Consultation</option>
                  <option value="Radiology">Radiology / Imaging</option>
                  <option value="Pathology">Pathology & Biopsy</option>
                  <option value="Prescription">Prescription</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">
                  Physician / Clinic Facility
                </label>
                <input
                  type="text"
                  value={formData.doctor_or_facility}
                  onChange={(e) => setFormData({ ...formData, doctor_or_facility: e.target.value })}
                  placeholder="e.g. Memorial Health Medical Center"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">
                  Summary / Clinical Details
                </label>
                <textarea
                  rows={3}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="Notes, recommendations, or clinical impressions..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={formData.tagsString}
                  onChange={(e) => setFormData({ ...formData, tagsString: e.target.value })}
                  placeholder="Vaccine, Annual, Preventative"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-surface-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-container"
                >
                  {isSubmitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
