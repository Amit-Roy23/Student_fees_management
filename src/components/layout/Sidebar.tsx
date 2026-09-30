"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  CreditCard,
  BookOpen,
  Globe,
  AlertCircle,
  GraduationCap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SCHOOL_CONFIG } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { hasPermission } from "@/lib/permissions";
import { useAcademicSession } from "@/lib/session-context";

export function Sidebar({
  defaulterCount = 0,
  isOpen = false,
  onClose,
  userRole,
}: {
  defaulterCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  userRole?: string;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const { currentSession } = useAcademicSession();

  const isClerk = userRole === "CLERK";

  const allNavItems = [
    {
      title: t.nav.dashboard,
      href: "/",
      icon: LayoutDashboard,
      capability: "DASHBOARD_VIEW" as const,
    },
    {
      title: t.nav.students,
      href: "/students",
      icon: Users,
      capability: "STUDENTS_VIEW_ALL" as const,
    },
    {
      title: t.nav.feeStructure,
      href: "/fee-structures",
      icon: Layers,
      capability: "FEE_STRUCTURE_MANAGE" as const,
    },
    {
      title: t.nav.collectFee,
      href: "/collect-fee",
      icon: CreditCard,
      highlight: true,
      capability: "COLLECT_FEE" as const,
    },
    {
      title: t.nav.cashBook,
      href: "/cash-book",
      icon: BookOpen,
      capability: isClerk ? ("CASH_BOOK_TODAY_ONLY" as const) : ("CASH_BOOK_ANY_DATE" as const),
    },
    {
      title: "Online Book",
      href: "/online-book",
      icon: Globe,
      capability: isClerk ? ("CASH_BOOK_TODAY_ONLY" as const) : ("CASH_BOOK_ANY_DATE" as const),
    },
    {
      title: t.nav.dues,
      href: "/dues",
      icon: AlertCircle,
      badge: defaulterCount > 0 ? String(defaulterCount) : undefined,
      capability: "DUES_VIEW_REMIND" as const,
    },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    hasPermission(userRole, item.capability)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0 shadow-xs",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <Link href={isClerk ? "/collect-fee" : "/"} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                  School<span className="text-blue-600 dark:text-blue-400">Pay</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                  {currentSession}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                {SCHOOL_CONFIG.schoolName}
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
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleNavItems.map((item) => {
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
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  item.highlight
                    ? isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800"
                    : isActive
                    ? "bg-blue-700 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      item.highlight && !isActive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : isActive
                        ? "text-white"
                        : "text-slate-500 dark:text-slate-400"
                    )}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "default"}
                    className={cn(
                      "text-[10px] px-1.5 py-0 font-bold",
                      !isActive && "bg-rose-600 text-white hover:bg-rose-600"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="font-semibold text-slate-700 dark:text-slate-300">
            {userRole === "MD" ? t.common.roleMD : t.common.roleClerk}
          </div>
          <div>Session: <span className="font-mono font-semibold">{currentSession}</span></div>
        </div>
      </aside>
    </>
  );
}
