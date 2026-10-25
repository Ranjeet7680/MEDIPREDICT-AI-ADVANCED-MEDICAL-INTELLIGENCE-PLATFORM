"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle,
  Dna,
  FileText,
  FolderHeart,
  HelpCircle,
  Loader2,
  LogOut,
  Moon,
  Search,
  ShieldAlert,
  Stethoscope,
  Sun,
  User as UserIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SearchResultItem } from "@/types";

export default function AppHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.search(searchQuery.trim());
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Disease":
        return <Stethoscope className="w-3.5 h-3.5 text-primary" />;
      case "Genetics":
        return <Dna className="w-3.5 h-3.5 text-secondary" />;
      case "Research":
        return <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return <FolderHeart className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#162730]/90 backdrop-blur-md border-b border-border shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-tight">
                MediPredict <span className="text-primary font-semibold">AI</span>
              </span>
              <span className="text-[11px] text-muted-foreground leading-none hidden sm:inline">
                Intelligent Healthcare. Earlier Insights.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Global Search & Emergency Alert */}
        <div ref={searchRef} className="hidden md:flex items-center gap-4 flex-1 max-w-md mx-6 relative">
          <div className="relative w-full">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-2.5 h-4 w-4 text-primary animate-spin" />
            ) : (
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchResults(true);
              }}
              placeholder="Search diseases, laboratory tests, genes, or research..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-surface-low dark:bg-surface-dim/20 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white dark:bg-[#1a2e38] rounded-xl shadow-xl border border-border p-2 z-50 animate-in fade-in slide-in-from-top-1 max-h-96 overflow-y-auto">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Search Results ({searchResults.length})
              </div>
              <div className="space-y-1">
                {searchResults.map((item) => (
                  <button
                    key={`${item.category}-${item.id}`}
                    onClick={() => {
                      setShowSearchResults(false);
                      setSearchQuery("");
                      router.push(item.link);
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-surface-low transition-colors group"
                  >
                    <div className="p-1.5 rounded-md bg-surface-container mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-surface-container text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Button */}
          <Link
            href="/notifications"
            title="Notification Center"
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-surface-low hover:text-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </Link>

          {/* Emergency Helpline Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency: 112 / 911</span>
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleDarkMode}
            title="Toggle theme"
            className="p-2 rounded-lg text-muted-foreground hover:bg-surface-low hover:text-foreground transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-low transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/20">
                  {user.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[120px]">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize leading-tight">
                    {user.role}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#1a2e38] shadow-lg border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-foreground">{user.full_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-surface-low transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Profile & Account
                  </Link>
                  <Link
                    href="/settings/privacy"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-surface-low transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    Privacy & Consents (DPDP)
                  </Link>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-container transition-all shadow-sm"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
