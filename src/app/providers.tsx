"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { translations, Locale, TranslationKey } from "@/lib/i18n";

interface AppContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
  sessions: { id: string; name: string; code: string; isCurrent: boolean }[];
  setSessions: (sessions: { id: string; name: string; code: string; isCurrent: boolean }[]) => void;
}

const AppContext = React.createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = React.useState<Locale>("en");
  const [activeSessionId, setActiveSessionId] = React.useState<string>("");
  const [sessions, setSessions] = React.useState<{ id: string; name: string; code: string; isCurrent: boolean }[]>([]);

  // Initialize locale from localStorage if available
  React.useEffect(() => {
    const saved = localStorage.getItem("schoolpay_locale") as Locale;
    if (saved && (saved === "en" || saved === "bn")) {
      setLocale(saved);
    }
  }, []);

  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("schoolpay_locale", newLocale);
  };

  const t = (key: TranslationKey): string => {
    return translations[locale][key] || translations.en[key] || key;
  };

  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppContext.Provider
          value={{
            locale,
            setLocale: handleSetLocale,
            t,
            activeSessionId,
            setActiveSessionId,
            sessions,
            setSessions,
          }}
        >
          {children}
          <Toaster richColors position="top-right" />
        </AppContext.Provider>
      </NextThemesProvider>
    </SessionProvider>
  );
}

export function useApp() {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
