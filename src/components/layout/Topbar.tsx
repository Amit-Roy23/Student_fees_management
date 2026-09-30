"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, CreditCard, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SCHOOL_CONFIG } from "@/lib/config";
import { LangToggle } from "@/components/layout/LangToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SessionSelector } from "@/components/layout/SessionSelector";
import { useI18n } from "@/lib/i18n";

export function Topbar({
  onMenuToggle,
  user,
}: {
  onMenuToggle: () => void;
  user?: any;
}) {
  const { t } = useI18n();
  const userRole = user?.role;

  const roleLabel =
    userRole === "MD"
      ? t.common.roleMD
      : userRole === "CLERK"
      ? t.common.roleClerk
      : t.common.roleParent;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 shadow-xs">
      {/* Left side: Hamburger (mobile) & Academic Session Selector Dropdown */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9 text-slate-700 dark:text-slate-300"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </Button>

        <SessionSelector />
      </div>

      {/* Right side: LangToggle, ThemeToggle, Collect Fee (if clerk/MD), User Role, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LangToggle />
        <ThemeToggle />

        {userRole !== "PARENT" && (
          <Link href="/collect-fee" className="hidden sm:inline-flex">
            <Button size="sm" className="gap-1.5 h-8 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <CreditCard className="h-3.5 w-3.5" />
              <span>{t.nav.collectFee}</span>
            </Button>
          </Link>
        )}

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="h-6 w-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-[10px]">
            {user?.name ? user.name[0] : "U"}
          </div>
          <div className="hidden md:block text-left">
            <div className="font-bold text-slate-900 dark:text-slate-100 leading-tight">{user?.name || "User"}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{roleLabel}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 gap-1.5 h-8 px-2"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.common.logout}</span>
        </Button>
      </div>
    </header>
  );
}
