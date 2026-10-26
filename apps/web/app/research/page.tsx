"use client";

import React, { useEffect, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Calendar,
  Check,
  ExternalLink,
  Filter,
  Microscope,
  Search,
  Sparkles,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { CardSkeleton } from "@/components/SkeletonLoader";
import { api } from "@/lib/api";
import { MedicalReference, ResearchBookmark } from "@/types";

const CATEGORIES = [
  "All Categories",
  "Gastroenterology",
  "Endocrinology",
  "Hepatology",
  "Cardiology",
  "Nephrology",
  "Medical Genetics",
  "Oncology",
];

export default function ResearchPage() {
  const [references, setReferences] = useState<MedicalReference[]>([]);
  const [bookmarks, setBookmarks] = useState<ResearchBookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResearch();
  }, [searchQuery, selectedCategory]);

  const loadResearch = async () => {
    setIsLoading(true);
    try {
      const catParam = selectedCategory === "All Categories" ? undefined : selectedCategory;
      const [refs, bms] = await Promise.all([
        api.searchResearch(searchQuery || undefined, catParam),
        api.listBookmarks(),
      ]);
      setReferences(refs);
      setBookmarks(bms);
    } catch (err) {
      console.error("Load research error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const isBookmarked = (refId: number) => {
    return bookmarks.some((b) => b.reference_id === refId);
  };

  const toggleBookmark = async (refId: number) => {
    const existing = bookmarks.find((b) => b.reference_id === refId);
    try {
      if (existing) {
        await api.removeBookmark(existing.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      } else {
        const created = await api.addBookmark(refId);
        setBookmarks((prev) => [created, ...prev]);
      }
    } catch (err) {
      console.error("Toggle bookmark error:", err);
    }
  };

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
                <BookOpen className="w-6 h-6 text-primary" /> Medical Research & Evidence Library
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Peer-reviewed clinical guidelines, randomized controlled trials, and PubMed reference abstracts.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search PubMed ID or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-white dark:bg-[#1a2e38] text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <SafetyNotice
            type="clinical_disclaimer"
            message="MediPredict AI grounds information exclusively in peer-reviewed scientific databases. Citations are verified against authoritative PubMed (NCBI) metadata."
          />

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {CATEGORIES.map((cat) => (
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
            ))}
          </div>

          {/* Research Articles Grid */}
          <div className="space-y-4">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block px-1">
              Curated Scientific Literature ({references.length})
            </span>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : references.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#1a2e38] rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No matching research articles found. Try a different search term.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {references.map((r) => {
                  const bookmarked = isBookmarked(r.id);
                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-2xl border border-border bg-white dark:bg-[#1a2e38] shadow-sm smooth-card flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {r.category} • {r.evidence_level}
                          </span>
                          <button
                            onClick={() => toggleBookmark(r.id)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              bookmarked
                                ? "bg-primary text-white border-primary"
                                : "text-muted-foreground hover:text-foreground border-border bg-surface-low"
                            }`}
                            title={bookmarked ? "Bookmarked" : "Bookmark article"}
                          >
                            {bookmarked ? (
                              <BookmarkCheck className="w-4 h-4" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <h3 className="font-bold text-sm text-foreground leading-snug">
                          {r.title}
                        </h3>

                        {r.authors && (
                          <p className="text-[11px] text-muted-foreground italic truncate">
                            {r.authors}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {r.abstract}
                        </p>
                      </div>

                      {/* Key Findings Box */}
                      {r.key_findings && (
                        <div className="p-3 rounded-xl bg-surface-low/60 dark:bg-surface-variant/20 border border-border/60 text-xs space-y-1">
                          <p className="font-semibold text-foreground text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-primary" /> Key Takeaway
                          </p>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            {r.key_findings}
                          </p>
                        </div>
                      )}

                      {/* Footer Metadata */}
                      <div className="flex items-center justify-between pt-3 border-t border-border text-[11px]">
                        <span className="text-muted-foreground">
                          {r.journal && `${r.journal} `}
                          {r.publication_year && `(${r.publication_year})`}
                        </span>

                        {r.url && (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <span>View Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
