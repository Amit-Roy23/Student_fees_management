"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";
import { AcademicSessionProvider } from "@/lib/session-context";
import { Toaster } from "sonner";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange
      >
        <I18nProvider>
          <AcademicSessionProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AcademicSessionProvider>
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
