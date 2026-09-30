"use client";

import * as React from "react";
import { useAcademicSession } from "@/lib/session-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronDown, Check } from "lucide-react";

export function SessionSelector() {
  const { currentSession, setSession, availableSessions } = useAcademicSession();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        <span>Session: {currentSession}</span>
      </div>
    );
  }

  const activeSessionObj = availableSessions.find((s) => s.code === currentSession);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
        >
          <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Session: <strong className="text-blue-700 dark:text-blue-300 font-bold">{currentSession}</strong></span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DropdownMenuLabel className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Select Academic Session
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />

        {availableSessions.map((session) => {
          const isSelected = session.code === currentSession;

          return (
            <DropdownMenuItem
              key={session.code}
              onClick={() => setSession(session.code)}
              className="flex items-center justify-between py-2 px-2.5 cursor-pointer text-xs focus:bg-slate-100 dark:focus:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold ${isSelected ? "text-blue-700 dark:text-blue-400" : "text-slate-800 dark:text-slate-200"}`}>
                  {session.code}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 py-0 font-medium ${
                    session.status === "Active"
                      ? "border-emerald-300 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
                      : session.status === "Upcoming"
                      ? "border-blue-300 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                      : "border-slate-200 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {session.status}
                </Badge>
              </div>

              {isSelected && (
                <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
