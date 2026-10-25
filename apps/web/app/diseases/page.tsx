"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  Filter,
  Microscope,
  Search,
  Stethoscope,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DiseaseCondition } from "@/types";

const SPECIALTIES = [
  "All Specialties",
  "Gastroenterology",
  "Hepatology",
  "Endocrinology",
  "Cardiology",
  "Oncology",
];

export default function DiseasesPage() {
  const [diseases, setDiseases] = useState<DiseaseCondition[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseCondition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All Specialties");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDiseases();
  }, [searchQuery, selectedSpecialty]);

  const loadDiseases = async () => {
    setIsLoading(true);
    try {
      const specialtyParam =
        selectedSpecialty === "All Specialties" ? undefined : selectedSpecialty;
      const data = await api.listDiseases(searchQuery || undefined, specialtyParam);
      setDiseases(data);
      if (data.length > 0 && !selectedDisease) {
        setSelectedDisease(data[0]);
      }
    } catch (err) {
      console.error("Load diseases error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-primary" /> Disease Research Explorer
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evidence-based pathophysiology, clinical diagnostic concepts, and guideline summaries.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conditions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-white dark:bg-[#1a2e38] text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <SafetyNotice
            type="clinical_disclaimer"
            message="The Disease Research Explorer organizes validated medical literature for clinical education and research. It does not provide self-diagnostic evaluation."
          />

          {/* Specialty Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {SPECIALTIES.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                  selectedSpecialty === spec
                    ? "bg-primary text-white shadow-xs"
                    : "bg-white dark:bg-[#1a2e38] border border-border text-foreground hover:bg-surface-low"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Condition List */}
            <div className="lg:col-span-4 space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block px-1">
                Medical Conditions ({diseases.length})
              </span>

              {isLoading ? (
                <div className="space-y-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : diseases.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#1a2e38] rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                  No matching medical conditions found.
                </div>
              ) : (
                diseases.map((d) => {
                  const isSelected = selectedDisease?.id === d.id;
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDisease(d)}
                      className={`p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white dark:bg-[#1a2e38] border-primary shadow-sm ring-1 ring-primary/20"
                          : "bg-surface-low/50 hover:bg-surface-low border-border"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {d.specialty}
                      </span>
                      <h4 className="font-bold text-sm text-foreground mt-0.5">{d.name}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">
                        {d.summary}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2 pt-2 border-t border-border/50">
                        <span>Reviewed: {formatDate(d.last_reviewed)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-primary" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Condition Detail Workspace */}
            <div className="lg:col-span-8 space-y-5">
              {selectedDisease ? (
                <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-6">
                  {/* Title & Overview */}
                  <div className="pb-4 border-b border-border space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded bg-primary/10">
                        {selectedDisease.specialty}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Last Reviewed: {formatDate(selectedDisease.last_reviewed)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
                      {selectedDisease.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-1">
                      {selectedDisease.summary}
                    </p>
                  </div>

                  {/* Symptoms & Risk Factors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Symptoms */}
                    <div className="p-4 rounded-xl border border-border bg-surface-low/40 dark:bg-surface-variant/20 space-y-2">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-primary" /> Characteristic Symptoms
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                        {selectedDisease.symptoms?.map((s, i) => (
                          <li key={i} className="leading-snug">{s}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Risk Factors */}
                    <div className="p-4 rounded-xl border border-border bg-surface-low/40 dark:bg-surface-variant/20 space-y-2">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Established Risk Factors
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                        {selectedDisease.risk_factors?.map((rf, i) => (
                          <li key={i} className="leading-snug">{rf}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Diagnostic Tests */}
                  <div className="p-4 rounded-xl border border-border bg-surface-low/30 space-y-2 text-xs">
                    <h4 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-primary" /> Standard Diagnostic Modalities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {selectedDisease.diagnostic_tests?.map((test, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg border border-border bg-white dark:bg-[#1a2e38] font-medium text-foreground flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span>{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clinical Guidelines & References */}
                  {selectedDisease.clinical_guidelines && (
                    <div className="p-4 rounded-xl border border-teal-200 bg-teal-50 dark:bg-teal-950/20 text-xs space-y-2 text-teal-950 dark:text-teal-200">
                      <h4 className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-primary">
                        <BookOpen className="w-4 h-4" /> Professional Practice Guidelines
                      </h4>
                      <p className="leading-relaxed">
                        {selectedDisease.clinical_guidelines}
                      </p>
                      {selectedDisease.pmid_references && selectedDisease.pmid_references.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            PubMed IDs:
                          </span>
                          {selectedDisease.pmid_references.map((pmid) => (
                            <a
                              key={pmid}
                              href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded bg-white dark:bg-[#1a2e38] border border-border text-[11px] font-mono text-primary hover:underline inline-flex items-center gap-1"
                            >
                              <span>PMID: {pmid}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ask Assistant Shortcut */}
                  <div className="pt-2 flex justify-end">
                    <Link
                      href={`/assistant`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-container transition-all shadow-xs"
                    >
                      <span>Inquire About {selectedDisease.name} in AI Chat</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center p-8 text-center bg-white dark:bg-[#1a2e38] rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                  Select a condition to view diagnostic and pathophysiological details.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
