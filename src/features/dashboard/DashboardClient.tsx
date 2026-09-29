"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDate, formatDateTime, formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Sparkles,
  BookOpen,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Receipt,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];

export function DashboardClient({
  kpis,
  monthlyChartData,
  modeSplitData,
  classDuesData,
  recentPayments,
  topDefaulters,
  sessionCode,
}: {
  kpis: {
    totalSessionCollectedPaise: number;
    totalMonthCollectedPaise: number;
    totalTodayCollectedPaise: number;
    totalOutstandingPaise: number;
    totalOverduePaise: number;
    totalFinesCollectedPaise: number;
    defaulterCount: number;
    totalStudents: number;
  };
  monthlyChartData: any[];
  modeSplitData: any[];
  classDuesData: any[];
  recentPayments: any[];
  topDefaulters: any[];
  sessionCode: string;
}) {
  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">Managing Director Dashboard</span>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-[11px] font-bold">
              Session {sessionCode}
            </Badge>
          </div>
          <p className="text-xs text-blue-100 font-medium">
            Live overview of fee collections, outstanding defaults, day books, and automated reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/collect-fee">
            <Button size="sm" variant="secondary" className="font-bold gap-1.5 shadow-md text-blue-900 bg-white hover:bg-blue-50">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>Collect Fee</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-medium gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <Card className="border shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Session Collected
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {formatINR(kpis.totalSessionCollectedPaise)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t">
              <span>This Month: <strong className="text-emerald-600">{formatINR(kpis.totalMonthCollectedPaise)}</strong></span>
              <span>Today: <strong className="text-foreground">{formatINR(kpis.totalTodayCollectedPaise)}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Total Outstanding */}
        <Card className="border shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Outstanding
              </span>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-2">
              {formatINR(kpis.totalOutstandingPaise)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t">
              <span>Past Due: <strong className="text-rose-600">{formatINR(kpis.totalOverduePaise)}</strong></span>
              <Link href="/dues" className="text-blue-600 font-semibold hover:underline">
                View Dues →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Students with Dues */}
        <Card className="border shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Defaulter Students
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-foreground mt-2">
              {kpis.defaulterCount} <span className="text-xs font-normal text-muted-foreground">/ {kpis.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t">
              <span>{Math.round(((kpis.totalStudents - kpis.defaulterCount) / kpis.totalStudents) * 100)}% Cleared Rate</span>
              <Link href="/reminders" className="text-amber-600 font-semibold hover:underline">
                Send Reminders →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Fines Collected */}
        <Card className="border shadow-xs bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Fines Realized
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-2">
              {formatINR(kpis.totalFinesCollectedPaise)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2 pt-2 border-t">
              <span>Automated fine engine active</span>
              <span className="text-emerald-600 font-semibold">100% Audited</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section: Monthly Collection vs Target + Payment Mode Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Collection Trend Bar Chart (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Monthly Collection vs Expected Target</CardTitle>
                <CardDescription className="text-xs">
                  Financial trends across academic session months (in ₹ Lakhs).
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                Session 2026-27
              </Badge>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val}L`} />
                    <Tooltip
                      formatter={(val: any) => [`₹${val} Lakhs`, ""]}
                      contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="expectedLakhs" name="Expected Target" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="collectedLakhs" name="Actual Collected" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Mode Breakdown Donut Chart (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b">
              <CardTitle className="text-base">Payment Mode Split</CardTitle>
              <CardDescription className="text-xs">
                Distribution across Cash, UPI, and Bank Transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeSplitData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {modeSplitData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`₹${(val / 100).toLocaleString("en-IN")}`, ""]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Mode Legends */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t text-xs">
                {modeSplitData.map((m, idx) => (
                  <div key={m.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-muted-foreground truncate">{m.name}:</span>
                    <span className="font-bold font-mono">{m.percent}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lower Section: Recent Fee Payments & Top Defaulters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions Feed (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Fee Collections</CardTitle>
                <CardDescription className="text-xs">
                  Latest counter and online payments recorded.
                </CardDescription>
              </div>
              <Link href="/collect-fee">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600 gap-1">
                  <span>Collect Fee</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Receipt No</th>
                    <th className="py-2.5 px-3 text-left">Student</th>
                    <th className="py-2.5 px-3 text-left">Mode</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {p.receiptNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <Link href={`/students/${p.studentId}`} className="font-semibold text-foreground hover:underline">
                          {p.student.firstName} {p.student.lastName}
                        </Link>
                        <span className="block text-[10px] text-muted-foreground">
                          {p.student.class.name}-{p.student.section.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {p.mode}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(p.amountPaise)}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                        {formatDate(p.paymentDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Top Defaulters List (5 cols) */}
        <div className="lg:col-span-5">
          <Card className="border shadow-sm">
            <CardHeader className="py-4 px-5 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  <span>Top Defaulting Students</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Highest accumulated outstanding balances.
                </CardDescription>
              </div>
              <Link href="/dues">
                <Button variant="ghost" size="sm" className="text-xs text-rose-600 gap-1">
                  <span>View All ({kpis.defaulterCount})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {topDefaulters.map((d, i) => (
                  <div key={d.id} className="p-3.5 hover:bg-muted/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center">
                        #{i + 1}
                      </div>
                      <div>
                        <Link href={`/students/${d.id}`} className="font-bold text-xs text-foreground hover:underline">
                          {d.firstName} {d.lastName}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          Class {d.class.name} • {formatPhone(d.guardianPhone)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">
                        {formatINR(d.totalDuePaise)}
                      </div>
                      <Link href={`/collect-fee?studentId=${d.id}`}>
                        <span className="text-[10px] font-semibold text-blue-600 hover:underline">
                          Collect →
                        </span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
