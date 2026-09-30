import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SCHOOL_NAME } from "@/lib/config";
import { LangToggle } from "@/components/layout/LangToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, CreditCard, Users, History } from "lucide-react";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role;
  if (userRole !== "PARENT") {
    if (userRole === "CLERK") redirect("/collect-fee");
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Parent Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/parent" className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-blue-900 dark:text-blue-300">
                {SCHOOL_NAME}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5">
                Parent Fee Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Link
              href="/parent"
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Users className="h-4 w-4 text-slate-500" />
              <span>My Children</span>
            </Link>
            <Link
              href="/parent/pay"
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="h-4 w-4 text-slate-500" />
              <span>Pay Fees Online</span>
            </Link>
            <Link
              href="/parent/payments"
              className="px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <History className="h-4 w-4 text-slate-500" />
              <span>Payment History</span>
            </Link>
          </nav>

          {/* Right Controls: Lang, Theme, User, Logout */}
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />

            <div className="hidden sm:flex flex-col text-right pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {session.user.name}
              </span>
              <span className="text-[10px] text-slate-400">Parent</span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 gap-1 px-2"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 px-2 py-1 bg-slate-50/50 dark:bg-slate-900/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/parent" className="py-1.5 px-2 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>My Children</span>
          </Link>
          <Link href="/parent/pay" className="py-1.5 px-2 flex items-center gap-1 text-blue-700 dark:text-blue-400 font-bold">
            <CreditCard className="h-3.5 w-3.5" />
            <span>Pay Online</span>
          </Link>
          <Link href="/parent/payments" className="py-1.5 px-2 flex items-center gap-1">
            <History className="h-3.5 w-3.5" />
            <span>History</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-center text-xs text-slate-400">
        <p>© 2026 {SCHOOL_NAME} • Secure Parent Fee Portal (Razorpay Demo)</p>
      </footer>
    </div>
  );
}
