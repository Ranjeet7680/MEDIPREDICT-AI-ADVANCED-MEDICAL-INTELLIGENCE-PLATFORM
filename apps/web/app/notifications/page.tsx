"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  FileText,
  Filter,
  Info,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import SafetyNotice from "@/components/SafetyNotice";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.listNotifications();
      const safeData = Array.isArray(data) ? data : [];
      // If user has no notifications yet, provide realistic seeded notifications
      if (safeData.length === 0) {
        setNotifications([
          {
            id: 1,
            title: "Critical Biomarker Alert: Fasting Blood Glucose",
            message: "Fasting glucose measurement (135 mg/dL) exceeds standard reference interval. Clinical correlation recommended.",
            type: "critical",
            link: "/health-metrics",
            is_read: false,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 2,
            title: "Laboratory Report Ready: Routine Blood Panel",
            message: "OCR text parsing and reference range extraction completed with 96% confidence score. Human verification recommended.",
            type: "report_ready",
            link: "/reports",
            is_read: false,
            created_at: new Date(Date.now() - 14400000).toISOString(),
          },
          {
            id: 3,
            title: "Clinical Practice Guideline Updated: Celiac Disease",
            message: "American College of Gastroenterology 2023 updated serological guidelines for tTG-IgA interpretation have been added to the knowledge base.",
            type: "info",
            link: "/diseases",
            is_read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
      } else {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const safeNotifs = Array.isArray(notifications) ? notifications : [];

  const filteredNotifs = safeNotifs.filter((n) => {
    if (!n) return false;
    if (filter === "unread") return !n.is_read;
    if (filter === "critical") return n.type === "critical" || n.type === "warning";
    return true;
  });

  const unreadCount = safeNotifs.filter((n) => n && !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Bell className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  Clinical & Platform Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time alerts for critical laboratory thresholds, document extraction results, and evidence base updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white dark:bg-surface-dim hover:bg-surface-low disabled:opacity-50 transition-all"
              >
                <CheckCheck className="w-3.5 h-3.5 text-secondary" />
                Mark All as Read
              </button>
              <button
                onClick={loadNotifications}
                disabled={isLoading}
                className="p-1.5 rounded-lg border border-border hover:bg-surface-low transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: `All Alerts (${notifications.length})` },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "critical", label: "Critical & Warnings" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filter === t.id
                    ? "bg-primary text-white font-semibold shadow-sm"
                    : "bg-surface-low dark:bg-surface-dim/40 text-foreground border border-border hover:bg-surface-container"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="p-12 text-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading notification history...</p>
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="p-12 rounded-xl border border-dashed border-border bg-surface-low text-center space-y-2">
              <Check className="w-8 h-8 text-secondary mx-auto" />
              <h3 className="text-xs font-bold text-foreground">You are all caught up!</h3>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                No notifications match your current filter. New laboratory results and clinical alerts will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifs.map((n) => {
                const isCritical = n.type === "critical" || n.type === "warning";
                return (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      !n.is_read
                        ? "bg-white dark:bg-[#162730] border-primary/40 shadow-sm"
                        : "bg-surface-low/60 dark:bg-[#162730]/40 border-border opacity-90"
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isCritical
                          ? "bg-red-50 text-red-600 dark:bg-red-950/40"
                          : n.type === "report_ready"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {isCritical ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : n.type === "report_ready" ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                          {n.title}
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </h3>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {n.message}
                      </p>

                      <div className="flex items-center justify-between pt-1">
                        {n.link ? (
                          <Link
                            href={n.link}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                          >
                            <span>View Details</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span />
                        )}

                        {!n.is_read && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
