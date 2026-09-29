"use client";

import { useApp } from "@/app/providers";
import { Calendar, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SessionSwitcher({
  sessions = [],
  currentSessionId,
}: {
  sessions: { id: string; name: string; code: string; isCurrent: boolean }[];
  currentSessionId: string;
}) {
  const { activeSessionId, setActiveSessionId } = useApp();

  const activeId = activeSessionId || currentSessionId || (sessions[0]?.id ?? "");
  const currentSession = sessions.find((s) => s.id === activeId) || sessions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200 font-medium hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50"
        >
          <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold">
            {currentSession ? currentSession.code : "2026-27"}
          </span>
          {currentSession?.isCurrent && (
            <Badge variant="success" className="px-1.5 py-0 text-[10px] leading-tight">
              Active
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Academic Sessions
        </div>
        {sessions.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => setActiveSessionId(s.id)}
            className={`flex items-center justify-between cursor-pointer ${
              s.id === activeId ? "bg-indigo-50 dark:bg-indigo-950/50 font-medium" : ""
            }`}
          >
            <div className="flex flex-col">
              <span className="text-sm">{s.code}</span>
              <span className="text-[11px] text-muted-foreground">{s.name}</span>
            </div>
            {s.isCurrent && (
              <Badge variant="success" className="text-[10px]">
                Current
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
