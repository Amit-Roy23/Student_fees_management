"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Plus, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionSwitcher } from "./SessionSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { CommandPalette } from "./CommandPalette";
import { UserNav } from "./UserNav";

export function Topbar({
  onMenuToggle,
  sessions = [],
  currentSessionId = "",
}: {
  onMenuToggle: () => void;
  sessions?: { id: string; name: string; code: string; isCurrent: boolean }[];
  currentSessionId?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 shadow-xs">
      {/* Left side: Hamburger (mobile) & Session switcher */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation</span>
        </Button>

        <SessionSwitcher
          sessions={sessions}
          currentSessionId={currentSessionId}
        />

        <div className="hidden sm:block">
          <CommandPalette />
        </div>
      </div>

      {/* Right side: Fast Action, Language, Theme, User Nav */}
      <div className="flex items-center gap-2">
        <Link href="/collect-fee" className="hidden sm:inline-flex">
          <Button size="sm" variant="success" className="gap-1.5 h-9 font-semibold">
            <CreditCard className="h-4 w-4" />
            <span>Collect Fee</span>
          </Button>
        </Link>

        <LangToggle />
        <ThemeToggle />
        <div className="h-5 w-px bg-border mx-1" />
        <UserNav />
      </div>
    </header>
  );
}
