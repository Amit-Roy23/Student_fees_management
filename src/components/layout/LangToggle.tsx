"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { Locale } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

export function LangToggle() {
  const { locale, setLocale } = useI18n();

  const languages: { code: Locale; label: string; nativeName: string }[] = [
    { code: "en", label: "English", nativeName: "English" },
    { code: "bn", label: "Bengali", nativeName: "বাংলা" },
    { code: "hi", label: "Hindi", nativeName: "हिन्दी" },
  ];

  const current = languages.find((l) => l.code === locale) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-xs font-semibold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>{current.nativeName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-slate-100">{lang.nativeName}</span>
              <span className="text-[10px] text-slate-400">{lang.label}</span>
            </div>
            {locale === lang.code && <Check className="h-3.5 w-3.5 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
