"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Eye,
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  Sparkles,
  School,
  CheckCircle2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = React.useState("admin@schoolpay.demo");
  const [password, setPassword] = React.useState("admin123");
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
        toast.error("Invalid email or password. Please use the quick-fill buttons.");
      } else {
        toast.success("Welcome back to SchoolPay!");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = async (userEmail: string, userPass: string, roleTitle: string) => {
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
        toast.error("Login failed.");
      } else {
        toast.success(`Signed in as ${roleTitle}`);
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.dismiss();
      toast.error("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      {/* Top Banner */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">School<span className="text-blue-600">Pay</span></h1>
              <Badge variant="success" className="text-[11px] font-bold">Interactive Sales Demo</Badge>
            </div>
            <p className="text-xs text-muted-foreground">Arohon Vidya Mandir • Academic Session 2026-27</p>
          </div>
        </div>

        <Link href="/pay">
          <Button variant="outline" size="sm" className="gap-2 bg-white dark:bg-slate-900 font-semibold text-xs border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-xs">
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Parent Fee Portal →</span>
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Demo Value Pitch & Highlights */}
        <div className="lg:col-span-6 space-y-6 hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>Complete School Fee & Accounts ERP</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl leading-tight">
            Stop losing hours in registers & Excel sheets.
          </h2>

          <p className="text-muted-foreground text-sm leading-relaxed">
            Move your entire annual accounting—admission fee, monthly installments, late fines, WhatsApp reminders, Cash Book, and MD reports—into one lightning-fast system.
          </p>

          <div className="grid grid-cols-1 gap-3 pt-2">
            {[
              "Instant fee collection in 3 clicks with printed PDF receipts & WhatsApp share",
              "Public parent payment portal with 1-click UPI, Card & NetBanking simulation",
              "Automated late fine engine with customizable grace days & caps",
              "Automatic cash book balancing with day-end closing locks",
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 shrink-0">
              <School className="h-5 w-5" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-foreground">Pre-loaded with 300 Indian Students & 15 Classes</p>
              <p className="text-muted-foreground">Includes 6 months of payment history, overdue dues, and expense ledgers.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form & Role Persona Quick-Fills */}
        <div className="lg:col-span-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold">Sign In to Demo</CardTitle>
              <CardDescription className="text-xs">
                Click any role persona button below for instant one-click access:
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Quick Persona Buttons */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Select User Persona:
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {/* Admin / MD */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickFill("admin@schoolpay.demo", "admin123", "Admin / MD")}
                    className="flex items-center justify-between p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">1. Admin / Managing Director</span>
                          <Badge variant="default" className="text-[9px] px-1.5 py-0">Full Access</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">MD Dashboard, Financial Reports, Audit Logs, Settings</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Accountant */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickFill("accountant@schoolpay.demo", "account123", "Accountant")}
                    className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">2. Accountant / Fee Clerk</span>
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">Operations</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Collect Fees, Cash Book, Reminders, Receipts</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Viewer / Auditor */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickFill("viewer@schoolpay.demo", "viewer123", "Viewer (Auditor)")}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-slate-600 text-white flex items-center justify-center shadow-xs">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">3. Viewer / Auditor</span>
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Read-Only</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Auditor overview of ledgers and collection reports</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-600 group-hover:translate-x-1 transition-all" />
                  </button>

                  {/* Parent / Student Portal */}
                  <Link
                    href="/pay"
                    className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">4. Student / Parent Portal</span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold">Pay Fees Online</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Parent self-service: Pay via UPI/Card, view & print past receipts</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground font-medium">Or enter credentials manually</span>
                </div>
              </div>

              {/* Manual Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Email address</span>
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@schoolpay.demo"
                    required
                    className="h-10 text-sm bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Password</span>
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-10 text-sm bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full h-10 font-bold text-sm mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? "Signing in..." : "Sign In to SchoolPay"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 py-3.5 text-center text-xs text-muted-foreground space-y-1">
              <span>Ready for client sales demo • Zero external setup required</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-muted-foreground">
          Loading SchoolPay...
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
