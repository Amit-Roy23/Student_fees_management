"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/app/providers";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Layers,
  AlertCircle,
  BellRing,
  BookOpen,
  Landmark,
  CalendarDays,
  Receipt,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  ExternalLink,
  GraduationCap,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Sidebar({
  defaulterCount = 42,
  isOpen = false,
  onClose,
}: {
  defaulterCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useApp();

  const navItems = [
    {
      title: t("dashboard"),
      href: "/",
      icon: LayoutDashboard,
      highlight: false,
    },
    {
      title: t("collectFee"),
      href: "/collect-fee",
      icon: CreditCard,
      highlight: true,
      badge: "Fast",
    },
    {
      title: t("students"),
      href: "/students",
      icon: Users,
    },
    {
      title: t("feeStructures"),
      href: "/fee-structures",
      icon: Layers,
    },
    {
      title: t("dues"),
      href: "/dues",
      icon: AlertCircle,
      badge: defaulterCount > 0 ? String(defaulterCount) : undefined,
      badgeVariant: "overdue" as const,
    },
    {
      title: t("reminders"),
      href: "/reminders",
      icon: BellRing,
    },
  ];

  const accountItems = [
    {
      title: t("cashBook"),
      href: "/accounts/cash-book",
      icon: BookOpen,
    },
    {
      title: t("bankBook"),
      href: "/accounts/bank-book",
      icon: Landmark,
    },
    {
      title: t("dayBook"),
      href: "/accounts/day-book",
      icon: CalendarDays,
    },
    {
      title: t("expenses"),
      href: "/accounts/expenses",
      icon: Receipt,
    },
  ];

  const adminItems = [
    {
      title: t("reports"),
      href: "/reports",
      icon: FileSpreadsheet,
    },
    {
      title: t("auditLogs"),
      href: "/audit-logs",
      icon: ShieldCheck,
    },
    {
      title: t("settings"),
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r bg-card/95 backdrop-blur-md transition-transform duration-300 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  School<span className="text-blue-600">Pay</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[140px]">
                Arohon Vidya Mandir
              </span>
            </div>
          </Link>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Core Operations */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Core Operations
            </div>
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                    item.highlight
                      ? isActive
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-600/20"
                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15 border border-emerald-500/20"
                      : isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                        item.highlight && !isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : isActive
                          ? "text-white"
                          : "text-muted-foreground"
                      )}
                    />
                    <span>{item.title}</span>
                  </div>

                  {item.badge && (
                    <Badge
                      variant={
                        (item.badgeVariant as any) ||
                        (isActive ? "secondary" : "default")
                      }
                      className={cn(
                        "text-[10px] px-1.5 py-0 font-bold",
                        isActive && "bg-white text-blue-700 hover:bg-white"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Accounts & Cash Books */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {t("accounts")}
            </div>
            {accountItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>

          {/* Reports & System Admin */}
          <div className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Management & Logs
            </div>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Parent Portal Showcase Card */}
        <div className="p-3 border-t">
          <Link
            href="/pay"
            target="_blank"
            className="flex items-center justify-between rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 p-3 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-950 dark:text-indigo-200">
                <span>Parent Payment Portal</span>
                <ExternalLink className="h-3 w-3 text-indigo-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                Public online checkout demo
              </span>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
