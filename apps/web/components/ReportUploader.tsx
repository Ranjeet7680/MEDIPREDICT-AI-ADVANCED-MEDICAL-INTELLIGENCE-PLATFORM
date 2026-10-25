"use client";

import React, { useState } from "react";
import { FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";
import { MedicalReport } from "@/types";

interface ReportUploaderProps {
  onSuccess: (report: MedicalReport) => void;
}

const SAMPLE_PANELS = [
  {
    name: "Comprehensive Metabolic & Lipid Panel",
    text: `Fasting Glucose: 114 mg/dL
HbA1c: 6.1 %
Total Cholesterol: 228 mg/dL
LDL Cholesterol: 142 mg/dL
HDL Cholesterol: 46 mg/dL
Triglycerides: 185 mg/dL
Hemoglobin: 14.2 g/dL
Platelets: 235 x10^9/L
ALT: 32 U/L
AST: 28 U/L
Ferritin: 190 ng/mL`,
  },
  {
    name: "Celiac Disease Serology & Immunoglobulins",
    text: `Serum IgA: 2.8 g/L
Serum IgG: 13.5 g/L
Serum IgM: 1.1 g/L
tTG-IgA: 45 U/mL
EMA-IgA: Positive
Hemoglobin: 11.2 g/dL`,
  },
  {
    name: "Hepatic & Iron Studies Panel",
    text: `Ferritin: 480 ng/mL
Fasting Glucose: 96 mg/dL
ALT: 58 U/L
AST: 44 U/L
Total Cholesterol: 180 mg/dL`,
  },
];

export default function ReportUploader({ onSuccess }: ReportUploaderProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [title, setTitle] = useState("Comprehensive Blood Analysis");
  const [reportType, setReportType] = useState("Laboratory Blood Panel");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("report_type", reportType);

      if (activeTab === "file" && selectedFile) {
        formData.append("file", selectedFile);
      } else if (rawText.trim()) {
        formData.append("raw_text", rawText.trim());
      } else {
        throw new Error("Please select a file or paste laboratory test measurements.");
      }

      const report = await api.uploadReport(formData);
      onSuccess(report);
    } catch (err: any) {
      setError(err.message || "Failed to process medical report.");
    } finally {
      setIsUploading(false);
    }
  };

  const loadSample = (sample: typeof SAMPLE_PANELS[0]) => {
    setActiveTab("text");
    setTitle(sample.name);
    setRawText(sample.text);
  };

  return (
    <div className="rounded-xl border border-border bg-white dark:bg-[#1a2e38] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground">Upload & Analyze Medical Report</h3>
          <p className="text-xs text-muted-foreground">
            Supports PDF, CSV, and clinical text format. Extracted data requires verification.
          </p>
        </div>
        <div className="flex bg-surface-low dark:bg-surface-variant/20 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === "file"
                ? "bg-white dark:bg-[#20333d] text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              activeTab === "text"
                ? "bg-white dark:bg-[#20333d] text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Direct Text Input
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-medium text-muted-foreground mb-1">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 focus:ring-1 focus:ring-primary text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-medium text-muted-foreground mb-1">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 focus:ring-1 focus:ring-primary text-foreground"
            >
              <option value="Comprehensive Blood Analysis">Comprehensive Blood Analysis</option>
              <option value="Lipid & Cardiovascular Panel">Lipid & Cardiovascular Panel</option>
              <option value="Immunological & Serological Panel">Immunological & Serological Panel</option>
              <option value="Hepatic & Metabolic Function">Hepatic & Metabolic Function</option>
            </select>
          </div>
        </div>

        {activeTab === "file" ? (
          <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-8 text-center bg-surface-low/30 dark:bg-surface-variant/10">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.csv,.txt,.png,.jpg,.jpeg"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-primary mb-2" />
              <span className="text-xs font-semibold text-foreground">
                {selectedFile ? selectedFile.name : "Click to select or drag and drop a laboratory report"}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1">
                PDF, CSV, TXT, or scanned images up to 15MB
              </span>
            </label>
          </div>
        ) : (
          <div>
            <label className="block font-medium text-xs text-muted-foreground mb-1">
              Paste Report Biomarkers & Numerical Values
            </label>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. Fasting Glucose: 110 mg/dL&#10;HbA1c: 5.8 %&#10;Total Cholesterol: 215 mg/dL"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-low dark:bg-surface-variant/20 font-mono text-xs text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        {/* Sample presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Or try verified clinical sample:
          </span>
          {SAMPLE_PANELS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadSample(p)}
              className="px-2.5 py-1 rounded-md border border-border bg-surface-low hover:bg-surface-container text-[11px] font-medium text-foreground transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-sm disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Parsing Laboratory Data...
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                Process & Extract Measurements
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
