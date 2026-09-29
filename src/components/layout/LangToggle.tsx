"use client";

import { useApp } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LangToggle() {
  const { locale, setLocale } = useApp();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-2.5 font-medium">
          <Languages className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase font-semibold">{locale === "bn" ? "বাংলা" : "EN"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("en")} className={locale === "en" ? "font-bold bg-accent" : ""}>
          🇬🇧 English (EN)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("bn")} className={locale === "bn" ? "font-bold bg-accent" : ""}>
          🇮🇳 বাংলা (Bengali)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
