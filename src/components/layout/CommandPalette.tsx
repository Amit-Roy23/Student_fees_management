"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  AlertCircle,
  BellRing,
  BookOpen,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  ExternalLink,
  PlusCircle,
  Receipt,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/60 hover:bg-muted border border-border rounded-lg transition-colors w-64 justify-between"
      >
        <span className="flex items-center gap-1.5">
          <Receipt className="h-3.5 w-3.5 text-primary" />
          <span>Quick search or jump to...</span>
        </span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command, page name, or student..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="⚡ Quick Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/collect-fee"))}>
              <CreditCard className="mr-2 h-4 w-4 text-emerald-600" />
              <span>Collect Fee (Instant Payment Entry)</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/students?action=new"))}>
              <PlusCircle className="mr-2 h-4 w-4 text-blue-600" />
              <span>New Student Admission</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/reminders"))}>
              <BellRing className="mr-2 h-4 w-4 text-amber-600" />
              <span>Send Due Reminders (WhatsApp/SMS)</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/accounts/cash-book"))}>
              <BookOpen className="mr-2 h-4 w-4 text-indigo-600" />
              <span>Open Cash Book & Verify Balance</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/pay"))}>
              <ExternalLink className="mr-2 h-4 w-4 text-purple-600" />
              <span>Open Parent Fee Payment Portal</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="📂 Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>MD Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/students"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Students & Profiles</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/fee-structures"))}>
              <Layers className="mr-2 h-4 w-4" />
              <span>Fee Structures & Heads</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dues"))}>
              <AlertCircle className="mr-2 h-4 w-4 text-rose-500" />
              <span>Dues & Defaulters</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/accounts/cash-book"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Cash Book</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/accounts/bank-book"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Bank Book</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/accounts/expenses"))}>
              <Receipt className="mr-2 h-4 w-4" />
              <span>Expenses</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/reports"))}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span>Financial Reports</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings & Configuration</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/audit-logs"))}>
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Audit Logs</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
