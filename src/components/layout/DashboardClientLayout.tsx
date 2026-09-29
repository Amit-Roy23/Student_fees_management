"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useApp } from "@/app/providers";

export function DashboardClientLayout({
  children,
  sessions,
  currentSessionId,
  defaulterCount,
}: {
  children: React.ReactNode;
  sessions: { id: string; name: string; code: string; isCurrent: boolean }[];
  currentSessionId: string;
  defaulterCount: number;
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { setSessions, setActiveSessionId, activeSessionId } = useApp();

  React.useEffect(() => {
    setSessions(sessions);
    if (!activeSessionId && currentSessionId) {
      setActiveSessionId(currentSessionId);
    }
  }, [sessions, currentSessionId, activeSessionId, setSessions, setActiveSessionId]);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar navigation */}
      <Sidebar
        defaulterCount={defaulterCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sessions={sessions}
          currentSessionId={currentSessionId}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/20">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
