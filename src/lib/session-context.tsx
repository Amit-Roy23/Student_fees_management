"use client";

import * as React from "react";
import { SCHOOL_CONFIG, AVAILABLE_ACADEMIC_SESSIONS } from "@/lib/config";
import { toast } from "sonner";

interface AcademicSessionContextType {
  currentSession: string;
  setSession: (sessionCode: string) => void;
  availableSessions: typeof AVAILABLE_ACADEMIC_SESSIONS;
}

const AcademicSessionContext = React.createContext<AcademicSessionContextType>({
  currentSession: SCHOOL_CONFIG.academicSession,
  setSession: () => {},
  availableSessions: AVAILABLE_ACADEMIC_SESSIONS,
});

export function AcademicSessionProvider({ children }: { children: React.ReactNode }) {
  const [currentSession, setCurrentSession] = React.useState(SCHOOL_CONFIG.academicSession);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("schoolpay_academic_session");
    if (saved && AVAILABLE_ACADEMIC_SESSIONS.some((s) => s.code === saved)) {
      setCurrentSession(saved);
    }
  }, []);

  const setSession = (code: string) => {
    if (code === currentSession) return;
    setCurrentSession(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("schoolpay_academic_session", code);
    }
    toast.info(`Active Academic Session switched to ${code}`);
  };

  return (
    <AcademicSessionContext.Provider
      value={{
        currentSession,
        setSession,
        availableSessions: AVAILABLE_ACADEMIC_SESSIONS,
      }}
    >
      {children}
    </AcademicSessionContext.Provider>
  );
}

export function useAcademicSession() {
  return React.useContext(AcademicSessionContext);
}
