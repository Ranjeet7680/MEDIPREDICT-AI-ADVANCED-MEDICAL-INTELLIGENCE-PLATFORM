"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  BrainCircuit,
  Cpu,
  Dna,
  FileText,
  FolderHeart,
  HeartPulse,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  Microscope,
  Radio,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Watch,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Clinical Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/assistant", label: "AI Medical Assistant", icon: MessageSquare, badge: "AI" },
      { href: "/reports", label: "Laboratory Reports", icon: FileText },
      { href: "/health-metrics", label: "Health Metrics & Trends", icon: HeartPulse },
      { href: "/clinician", label: "Clinician Queue", icon: Stethoscope, badge: "MD" },
    ],
  },
  {
    title: "Connected Healthcare",
    items: [
      { href: "/devices/wearables", label: "Wearable Sync", icon: Watch, badge: "IoT" },
      { href: "/devices/sensors", label: "Medical Sensors", icon: Cpu, badge: "Live" },
      { href: "/devices/iot", label: "Hardware Gateways", icon: Wifi },
    ],
  },
  {
    title: "Intelligence & ML",
    items: [
      { href: "/analytics", label: "Analytics Engine", icon: LineChart },
      { href: "/ml-lab", label: "ML Research Lab", icon: BrainCircuit, badge: "Lab" },
      { href: "/diseases", label: "Disease Research", icon: Activity },
      { href: "/genetics", label: "Genes & Genetics", icon: Dna },
      { href: "/research", label: "Evidence Library", icon: BookOpen },
      { href: "/records", label: "Personal Health Records", icon: FolderHeart },
    ],
  },
  {
    title: "Account & Governance",
    items: [
      { href: "/notifications", label: "Notification Center", icon: Bell },
      { href: "/admin", label: "Platform Admin", icon: ShieldAlert, badge: "Sec" },
      { href: "/settings/profile", label: "Settings", icon: Settings },
      { href: "/settings/privacy", label: "Privacy & Consents", icon: ShieldCheck },
    ],
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-surface-low/50 dark:bg-[#162730]/40 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="py-4 px-3 space-y-6">
        {NAV_ITEMS.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h3>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                      isActive
                        ? "bg-secondary-container text-on-secondary-fixed dark:bg-primary/20 dark:text-primary font-semibold shadow-sm"
                        : "text-surface-onVariant hover:text-foreground hover:bg-white/80 dark:hover:bg-surface-variant/20"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide",
                          item.badge === "AI"
                            ? "bg-primary text-white"
                            : "bg-surface-container text-primary border border-primary/20"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Clinical Disclaimer Footnote in Sidebar */}
      <div className="p-3 m-3 rounded-lg bg-surface-container-high/60 border border-outline-variant/30 text-[10px] text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
          <Microscope className="w-3 h-3 text-primary" /> Clinical Decision Support
        </p>
        MediPredict AI provides educational and research insights. Never replaces professional medical care.
      </div>
    </aside>
  );
}
