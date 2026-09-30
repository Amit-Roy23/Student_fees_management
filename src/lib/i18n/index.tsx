"use client";

import * as React from "react";
import { Locale, Dictionary, dictionaries } from "./dictionaries";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = React.createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: dictionaries.en,
});

export function I18nProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  React.useEffect(() => {
    // Read from cookie if available
    const match = document.cookie.match(new RegExp("(^| )locale=([^;]+)"));
    if (match && (match[2] === "en" || match[2] === "bn" || match[2] === "hi")) {
      setLocaleState(match[2] as Locale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Save in cookie for 1 year
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const t = dictionaries[locale] || dictionaries.en;

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return React.useContext(I18nContext);
}

export function getDictionary(locale: Locale = "en"): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}
