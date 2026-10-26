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
  Globe,
  HelpCircle,
  Loader2,
  LogOut,
  Moon,
  Search,
  ShieldAlert,
  Stethoscope,
  Sun,
  User as UserIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sound } from "@/lib/sound";
import { useTheme } from "@/lib/theme";
import { SearchResultItem } from "@/types";

export default function AppHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsAudioMuted(sound.muted);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Keyboard shortcut Alt + N for Night Mode toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "n" || e.key === "N" || e.key === "d" || e.key === "D")) {
        e.preventDefault();
        sound.playClick();
        toggleTheme();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme]);

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

  const handleToggleTheme = () => {
    sound.playClick();
    toggleTheme();
  };

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsAudioMuted(muted);
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
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#111d24]/90 backdrop-blur-md border-b border-border shadow-xs transition-colors duration-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground leading-tight flex items-center gap-1">
                MediPredict <span className="text-primary font-bold">AI</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono font-semibold hidden sm:inline-block">
                  v2.4
                </span>
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
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-surface-low dark:bg-[#162732] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs"
            />
          </div>

          {/* Search Dropdown Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white dark:bg-[#162732] rounded-xl shadow-xl border border-border p-2 z-50 animate-in fade-in slide-in-from-top-1 max-h-96 overflow-y-auto">
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
                    className="w-full flex items-start gap-2.5 p-2 rounded-lg text-left hover:bg-surface-low dark:hover:bg-surface-high/30 transition-colors group"
                  >
                    <div className="p-1.5 rounded-md bg-surface-container dark:bg-surface-high/40 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-surface-container dark:bg-surface-high/50 text-muted-foreground">
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
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <Link
            href="/notifications"
            title="Notification Center"
            className="relative p-2 rounded-lg text-muted-foreground hover:bg-surface-low dark:hover:bg-[#1a2c38] hover:text-foreground transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
          </Link>

          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            title={isAudioMuted ? "Enable Sound FX" : "Mute Sound FX"}
            className="p-2 rounded-lg text-muted-foreground hover:bg-surface-low dark:hover:bg-[#1a2c38] hover:text-foreground transition-colors"
          >
            {isAudioMuted ? (
              <VolumeX className="w-4 h-4 text-muted-foreground/60" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
          </button>

          {/* Theme Switcher (Night / Clinical Calm) */}
          <button
            onClick={handleToggleTheme}
            title={isDark ? "Switch to Clinical Calm (Light) [Alt+N]" : "Switch to Night Mode (Dark) [Alt+N]"}
            className="p-2 rounded-lg text-muted-foreground hover:bg-surface-low dark:hover:bg-[#1a2c38] hover:text-foreground transition-all group relative"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200 group-hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Emergency Helpline Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[11px] font-medium">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Emergency: 112 / 911</span>
          </div>

          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-low dark:hover:bg-[#1a2c38] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs border border-primary/30">
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
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-[#162732] shadow-xl border border-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowProfileMenu(false)}
                >
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-foreground">{user.full_name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-surface-low dark:hover:bg-surface-high/30 transition-colors"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <UserIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    Profile & Account
                  </Link>
                  <Link
                    href="/settings/privacy"
                    className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-surface-low dark:hover:bg-surface-high/30 transition-colors"
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
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
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
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm"
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
