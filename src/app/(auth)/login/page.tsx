"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SCHOOL_CONFIG } from "@/lib/config";
import { LangToggle } from "@/components/layout/LangToggle";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useI18n } from "@/lib/i18n";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { t } = useI18n();

  const [activeTab, setActiveTab] = React.useState<"staff" | "parent">("staff");
  const [email, setEmail] = React.useState("md@schoolpay.demo");
  const [password, setPassword] = React.useState("md123");
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error(t.auth.invalidCredentials);
      } else {
        toast.success(t.common.success);
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (email.startsWith("parent")) {
          router.push("/parent");
        } else if (email.startsWith("clerk") || email.startsWith("accountant")) {
          router.push("/collect-fee");
        } else {
          router.push("/");
        }
        router.refresh();
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (
    userEmail: string,
    userPass: string,
    roleTitle: string,
    targetRoute: string
  ) => {
    setEmail(userEmail);
    setPassword(userPass);
    setLoading(true);
    toast.loading(`Signing in as ${roleTitle}...`);

    try {
      const res = await signIn("credentials", {
        email: userEmail,
        password: userPass,
        redirect: false,
      });

      toast.dismiss();
      if (res?.error) {
        toast.error(t.auth.invalidCredentials);
      } else {
        toast.success(`${t.common.success} (${roleTitle})`);
        router.push(callbackUrl || targetRoute);
        router.refresh();
      }
    } catch {
      toast.dismiss();
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 transition-colors">
      {/* Top Bar Toggles */}
      <div className="w-full max-w-lg flex items-center justify-end gap-2 mb-4">
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* Brand Header */}
      <div className="w-full max-w-lg text-center mb-6">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-600 items-center justify-center text-white shadow-md mb-3">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          School<span className="text-blue-600 dark:text-blue-400">Pay</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {SCHOOL_CONFIG.schoolName} • Session {SCHOOL_CONFIG.academicSession}
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {t.auth.title}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            {t.auth.subtitle}
          </CardDescription>

          {/* Persona Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mt-3">
            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "staff"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {t.auth.staffTab}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("parent")}
              className={`py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === "parent"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              {t.auth.parentTab}
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Staff Quick Fills */}
          {activeTab === "staff" && (
            <div className="space-y-2">
              {/* MD */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickFill(
                    "md@schoolpay.demo",
                    "md123",
                    "Managing Director (MD)",
                    "/"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        1. Managing Director (MD)
                      </span>
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-blue-700">
                        Full Access
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      KPIs, defaulters, fee structures, import/export, student edit/delete
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              </button>

              {/* Clerk */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickFill(
                    "clerk@schoolpay.demo",
                    "clerk123",
                    "Accountant / Clerk",
                    "/collect-fee"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        2. Accountant / Clerk
                      </span>
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-emerald-700">
                        Operations
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Collect fee, view/admit students, dues & reminders, today's cash book
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>
            </div>
          )}

          {/* Parent Quick Fills */}
          {activeTab === "parent" && (
            <div className="space-y-2">
              {/* Parent 1 (Siblings: Rohan & Priya) */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickFill(
                    "parent1@schoolpay.demo",
                    "parent123",
                    "Suresh Sharma (2 Children)",
                    "/parent"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        Parent 1: Suresh Sharma
                      </span>
                      <Badge variant="default" className="text-[9px] px-1.5 py-0 bg-purple-700">
                        2 Siblings
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Rohan Sharma (Class 8) & Priya Sharma (Class 5)
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
              </button>

              {/* Parent 2 */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickFill(
                    "parent2@schoolpay.demo",
                    "parent123",
                    "Rajesh Roy",
                    "/parent"
                  )
                }
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Parent 2: Rajesh Roy
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Child: Aarav Roy (Class 1)
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>

              {/* Parent 3 */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickFill(
                    "parent3@schoolpay.demo",
                    "parent123",
                    "Amit Das",
                    "/parent"
                  )
                }
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Parent 3: Amit Das
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Child: Ananya Das (Class 2)
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>

              {/* Parent 4 */}
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  handleQuickFill(
                    "parent4@schoolpay.demo",
                    "parent123",
                    "Bikram Banerjee",
                    "/parent"
                  )
                }
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all cursor-pointer"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    Parent 4: Bikram Banerjee
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Child: Sourav Banerjee (Class 9)
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
              </button>
            </div>
          )}

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-medium">
                {t.auth.orSignInWithEmail}
              </span>
            </div>
          </div>

          {/* Manual Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>{t.auth.email}</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="md@schoolpay.demo"
                required
                className="h-9 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                <span>{t.auth.password}</span>
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-9 text-sm bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white mt-1"
            >
              {loading ? "Signing in..." : t.auth.signIn}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="border-t border-slate-100 dark:border-slate-800 py-3 text-center text-[11px] text-slate-500 dark:text-slate-400 justify-center">
          School Fee & Accounts Management System • Demo Mode
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading SchoolPay...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
