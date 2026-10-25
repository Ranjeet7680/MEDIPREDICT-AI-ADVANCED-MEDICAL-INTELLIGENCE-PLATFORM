"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Dna,
  ExternalLink,
  HelpCircle,
  Microscope,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { GeneAssociation } from "@/types";

export default function GeneticsPage() {
  const [genes, setGenes] = useState<GeneAssociation[]>([]);
  const [selectedGene, setSelectedGene] = useState<GeneAssociation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGenes();
  }, [searchQuery]);

  const loadGenes = async () => {
    setIsLoading(true);
    try {
      const data = await api.listGenes(searchQuery || undefined);
      setGenes(data);
      if (data.length > 0 && !selectedGene) {
        setSelectedGene(data[0]);
      }
    } catch (err) {
      console.error("Load genes error:", err);
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
                <Dna className="w-6 h-6 text-primary" /> Gene & Genetics Intelligence Explorer
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Curated gene-disease associations, inheritance modes, and clinical variant uncertainty guidelines.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search symbol (e.g. HFE, BMP2)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-white dark:bg-[#1a2e38] text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <SafetyNotice
            type="research_warning"
            message="Genetic variant associations and rsIDs are presented strictly for scientific education and genomic literacy. Incomplete penetrance and environmental cofactors mean a genetic variant is NOT a personal disease diagnosis."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gene Symbols Catalog */}
            <div className="lg:col-span-4 space-y-2.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block px-1">
                Genetic Loci & Markers ({genes.length})
              </span>

              {isLoading ? (
                <div className="space-y-2">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : genes.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#1a2e38] rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                  No matching genetic loci found.
                </div>
              ) : (
                genes.map((g) => {
                  const isSelected = selectedGene?.id === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGene(g)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white dark:bg-[#1a2e38] border-primary shadow-sm ring-1 ring-primary/20"
                          : "bg-surface-low/50 hover:bg-surface-low border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {g.gene_symbol}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {g.chromosome || "Genome"}
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-xs">{g.gene_name}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                        {g.associated_condition}
                      </p>
                      <div className="mt-2 pt-1 border-t border-border/50 text-[10px] text-muted-foreground flex justify-between">
                        <span>{g.inheritance_pattern || "Complex / Multifactorial"}</span>
                        <span className="text-primary font-semibold">Inspect Details</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Gene Detail Workspace */}
            <div className="lg:col-span-8 space-y-5">
              {selectedGene ? (
                <div className="p-6 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm space-y-6">
                  {/* Top Header */}
                  <div className="pb-4 border-b border-border space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                        {selectedGene.gene_symbol}
                      </span>
                      {selectedGene.chromosome && (
                        <span className="text-xs font-mono text-muted-foreground bg-surface-low px-2 py-0.5 rounded border border-border">
                          Chr: {selectedGene.chromosome}
                        </span>
                      )}
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-semibold">
                        {selectedGene.inheritance_pattern}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-foreground">
                      {selectedGene.gene_name}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {selectedGene.description}
                    </p>
                  </div>

                  {/* Associated Clinical Phenotype */}
                  <div className="p-4 rounded-xl border border-border bg-surface-low/30 space-y-2 text-xs">
                    <h4 className="font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-primary" /> Associated Clinical Condition
                    </h4>
                    <p className="font-semibold text-foreground text-sm">
                      {selectedGene.associated_condition}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                      {selectedGene.doid && (
                        <span className="font-mono bg-white dark:bg-[#1a2e38] px-2 py-0.5 rounded border border-border">
                          DOID: {selectedGene.doid}
                        </span>
                      )}
                      {selectedGene.omim_id && (
                        <span className="font-mono bg-white dark:bg-[#1a2e38] px-2 py-0.5 rounded border border-border">
                          {selectedGene.omim_id}
                        </span>
                      )}
                      {selectedGene.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${selectedGene.pmid}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-primary hover:underline flex items-center gap-1"
                        >
                          <span>PMID: {selectedGene.pmid}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Inherited Pedigree Model Visualization */}
                  <div className="p-4 rounded-xl border border-border bg-surface-low/50 dark:bg-surface-variant/20 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-muted-foreground">
                      <span>Inheritance Pedigree Model Reference</span>
                      <span className="text-primary">{selectedGene.inheritance_pattern}</span>
                    </div>

                    {/* SVG Pedigree Chart */}
                    <svg
                      className="w-full h-32 select-none bg-white dark:bg-[#162730] rounded-lg p-2 border border-border"
                      viewBox="0 0 320 120"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M 90 30 L 230 30" stroke="#bdc9c7" strokeWidth="2" />
                      <path d="M 160 30 L 160 60" stroke="#bdc9c7" strokeWidth="2" />
                      <path d="M 60 60 L 260 60" stroke="#bdc9c7" strokeWidth="2" />
                      <path d="M 60 60 L 60 80" stroke="#bdc9c7" strokeWidth="2" />
                      <path d="M 160 60 L 160 80" stroke="#bdc9c7" strokeWidth="2" />
                      <path d="M 260 60 L 260 80" stroke="#bdc9c7" strokeWidth="2" />

                      {/* Parent 1 (Carrier Father) */}
                      <rect x="72" y="12" width="36" height="36" rx="4" fill="#d1e7e3" stroke="#00635e" strokeWidth="2" />
                      <path d="M 72 12 L 108 48" stroke="#00635e" strokeWidth="2" />
                      <text x="90" y="58" textAnchor="middle" fontSize="8" fill="#3e4948">Carrier Parent 1</text>

                      {/* Parent 2 (Carrier Mother) */}
                      <circle cx="230" cy="30" r="18" fill="#d1e7e3" stroke="#00635e" strokeWidth="2" />
                      <path d="M 217 17 L 243 43" stroke="#00635e" strokeWidth="2" />
                      <text x="230" y="58" textAnchor="middle" fontSize="8" fill="#3e4948">Carrier Parent 2</text>

                      {/* Child 1: Unaffected */}
                      <rect x="44" y="80" width="32" height="32" rx="4" fill="#ffffff" stroke="#6e7978" strokeWidth="1.5" />
                      <text x="60" y="118" textAnchor="middle" fontSize="8" fill="#3e4948">Wildtype (25%)</text>

                      {/* Child 2: Carrier */}
                      <circle cx="160" cy="96" r="16" fill="#9af2eb" stroke="#00635e" strokeWidth="2" />
                      <text x="160" y="118" textAnchor="middle" fontSize="8" fill="#00635e" fontWeight="bold">Carrier (50%)</text>

                      {/* Child 3: Homozygous */}
                      <rect x="244" y="80" width="32" height="32" rx="4" fill="#ffdad6" stroke="#ba1a1a" strokeWidth="2" />
                      <text x="260" y="118" textAnchor="middle" fontSize="8" fill="#93000a">Affected (25%)</text>
                    </svg>
                  </div>

                  {/* Clinical Uncertainty Note */}
                  {selectedGene.clinical_uncertainty_note && (
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4 text-amber-600" /> Clinical Uncertainty & Penetrance Guidance
                      </p>
                      <p className="leading-relaxed">
                        {selectedGene.clinical_uncertainty_note}
                      </p>
                    </div>
                  )}

                  {/* Approved Databases External Links */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-border">
                    <span className="text-muted-foreground">Scientific Databases:</span>
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/gene/?term=${selectedGene.gene_symbol}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>NCBI Gene</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/clinvar/?term=${selectedGene.gene_symbol}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <span>ClinVar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center p-8 text-center bg-white dark:bg-[#1a2e38] rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                  Select a genetic marker to explore biological mechanisms and pedigree models.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
