"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  Dna,
  FileCheck2,
  FileText,
  Globe,
  HeartPulse,
  Lock,
  MessageSquare,
  Microscope,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SafetyNotice from "@/components/SafetyNotice";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-foreground">
      <AppHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-border bg-gradient-to-b from-surface-low via-surface to-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-semibold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Evidence-Grounded Healthcare Intelligence • Research Decision Support</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                Understand Health Data With{" "}
                <span className="text-primary underline decoration-primary-fixed decoration-4 underline-offset-4">
                  Intelligent Medical Insights
                </span>
                .
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
                Explore medical information, organize laboratory reports, and discover research-backed health insights through a secure, AI-powered healthcare workspace.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-container transition-all shadow-md"
                >
                  <span>Explore Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/assistant"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#1a2e38] text-foreground font-semibold text-sm border border-border hover:bg-surface-low transition-all shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span>Try Medical Assistant</span>
                </Link>
              </div>

              {/* Trust disclaimer */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
                <span>For medical education and research decision support — not an autonomous diagnostic device.</span>
              </div>
            </div>

            {/* Right Column: Interactive Clinical Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-tertiary-fixed/30 blur-3xl pointer-events-none" />

              <div className="relative bg-white dark:bg-[#1a2e38] rounded-2xl p-6 shadow-xl border border-border space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-semibold text-xs text-foreground">
                      Clinical Biomarker & Gene Panel
                    </span>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-low text-primary font-bold">
                    rs1801133 [MTHFR] • HFE C282Y
                  </span>
                </div>

                {/* Extracted Lab Mock preview */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-low dark:bg-surface-variant/20 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Fasting Plasma Glucose</p>
                      <p className="text-[10px] text-muted-foreground">ADA 2024 Reference: 70 - 99 mg/dL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-700 dark:text-amber-400">108.0 mg/dL</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold">Elevated</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-low dark:bg-surface-variant/20 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Serum Ferritin</p>
                      <p className="text-[10px] text-muted-foreground">AASLD 2022 Reference: 30 - 300 ng/mL</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">145.0 ng/mL</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">Optimal</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-low dark:bg-surface-variant/20 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">Serum IgA (Celiac Screen)</p>
                      <p className="text-[10px] text-muted-foreground">ACG 2023 Guideline Reference: 0.8 - 3.0 g/L</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">2.1 g/L</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">Normal</span>
                    </div>
                  </div>
                </div>

                {/* Grounding Badge */}
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-[11px] text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Grounded in verified PubMed references and official clinical practice guidelines.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Emergency Notice */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        <SafetyNotice type="clinical_disclaimer" />
      </div>

      {/* Four Core Pillars */}
      <section className="py-16 border-b border-border bg-white dark:bg-[#162730]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built For Medical Precision & Patient Trust
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Combining advanced AI models with deterministic clinical evidence, laboratory extraction pipelines, and rigorous data privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-border bg-surface-low/40 hover:bg-surface-low transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Medical Assistant</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Answers clinical questions, explains medical jargon, and contextualizes measurements with genuine PubMed citations.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-border bg-surface-low/40 hover:bg-surface-low transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Report Intelligence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload laboratory PDFs, CSVs, or text reports. Automatically extracts test names, units, and flags out-of-range values with human-in-the-loop review.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-border bg-surface-low/40 hover:bg-surface-low transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">ML Research Models</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Trained Gradient Boosting pipeline on real clinical datasets with evaluated AUROC, Brier calibration scores, and transparent model cards.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-border bg-surface-low/40 hover:bg-surface-low transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Dna className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Genomics Explorer</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explore disease-gene associations for HFE, BMP2, FTH1, MTHFR, and BRCA1 with inheritance modes and explicit uncertainty guidance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & DPDP Compliance Section */}
      <section className="py-16 border-b border-border bg-surface-low/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Security & Healthcare Privacy By Design</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Your Health Records Belong To You.
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                MediPredict AI implements strict zero-trust data segregation. Every health measurement and report is protected against Insecure Direct Object References (IDOR), encrypted in transit, and mapped to auditable consent preferences designed to support India’s DPDP Act 2023 and HIPAA security requirements.
              </p>
              <ul className="space-y-2 text-xs text-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Argon2id and Bcrypt salted password cryptographic hashing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>One-click full data export (JSON/CSV) for data portability</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span>Full account erasure and permanent audit log compliance</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-[#1a2e38] border border-border shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Multi-Provider AI Architecture
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your choice of Google Gemini, OpenAI, or local private inference endpoints. If external credentials are not supplied, the platform seamlessly runs on our deterministic <strong>MediPredict Clinical Evidence Engine</strong> without interrupting functionality.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                <div className="p-3 rounded-lg border border-border bg-surface-low">
                  <p className="font-bold text-foreground">Gemini</p>
                  <p className="text-[10px] text-muted-foreground">Google Gen AI</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface-low">
                  <p className="font-bold text-foreground">OpenAI</p>
                  <p className="text-[10px] text-muted-foreground">GPT-4o Mini</p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-surface-low">
                  <p className="font-bold text-foreground">Offline</p>
                  <p className="text-[10px] text-muted-foreground">Clinical Evidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-16 border-b border-border bg-white dark:bg-[#162730]/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Transparent answers regarding AI capabilities, clinical limitations, and privacy.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-border bg-surface-low/30">
              <p className="font-bold text-foreground mb-1">
                Can MediPredict AI diagnose medical diseases or replace my physician?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                No. MediPredict AI is an educational, research, and clinical decision-support tool. It organizes information and calculates statistical risk indicators, but never formulates official medical diagnoses or prescribes medication.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-low/30">
              <p className="font-bold text-foreground mb-1">
                Where do the citations and research papers come from?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                All references are linked to authentic PubMed entries (PMID), Digital Object Identifiers (DOI), and verified clinical practice guidelines published by organizations like the American College of Gastroenterology (ACG), American Diabetes Association (ADA), and American Heart Association (AHA).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface-low/30">
              <p className="font-bold text-foreground mb-1">
                How does the laboratory report analyzer handle extraction errors?
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The platform displays an extraction confidence score and highlights values that require review. Users are required to verify the extracted numerical results and can correct values directly in the table before relying on them.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 bg-surface-container-high/40 border-t border-border text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary stroke-[2.2]" />
            <span className="font-bold text-foreground">MediPredict AI</span>
            <span>• Intelligent Healthcare Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/diseases" className="hover:text-foreground">Diseases</Link>
            <Link href="/genetics" className="hover:text-foreground">Genetics</Link>
            <Link href="/research" className="hover:text-foreground">Research</Link>
            <Link href="/settings/privacy" className="hover:text-foreground">Privacy (DPDP)</Link>
          </div>

          <p className="text-[11px]">
            © 2026 MediPredict AI. Research & Educational Decision Support.
          </p>
        </div>
      </footer>
    </div>
  );
}
