"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDate, formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import { getPaymentReceiptData } from "@/features/cash-book/actions";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Receipt,
  Calendar,
  FileText,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export function DashboardClient({
  kpis,
  recentPayments,
  topDefaulters,
  sessionCode,
}: {
  kpis: {
    totalMonthCollectedPaise: number;
    totalOutstandingPaise: number;
    totalOverduePaise: number;
    totalFinesCollectedPaise: number;
    defaulterCount: number;
    totalStudents: number;
  };
  recentPayments: any[];
  topDefaulters: any[];
  sessionCode: string;
}) {
  const { t } = useI18n();

  const [selectedReceipt, setSelectedReceipt] = React.useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [loadingReceiptId, setLoadingReceiptId] = React.useState<string | null>(null);

  const handleOpenReceipt = async (paymentId: string) => {
    setLoadingReceiptId(paymentId);
    try {
      const data = await getPaymentReceiptData(paymentId);
      setSelectedReceipt(data);
      setShowReceiptModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payment bill receipt");
    } finally {
      setLoadingReceiptId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.dashboard.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs py-1 px-3 self-start sm:self-auto bg-white dark:bg-slate-900 shadow-xs"
        >
          Session {sessionCode}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Total collected this month */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t.dashboard.kpiCollectedThisMonth}
              </span>
              <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatINR(kpis.totalMonthCollectedPaise)}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Actual collections</p>
          </CardContent>
        </Card>

        {/* 2. Total outstanding */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t.dashboard.kpiTotalOutstanding}
              </span>
              <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatINR(kpis.totalOutstandingPaise)}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Annual balance remaining</p>
          </CardContent>
        </Card>

        {/* 3. Overdue amount */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t.dashboard.kpiOverdueAmount}
              </span>
              <div className="h-7 w-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
              {formatINR(kpis.totalOverduePaise)}
            </div>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Past due dates</p>
          </CardContent>
        </Card>

        {/* 4. Fines collected */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t.dashboard.kpiFinesCollected}
              </span>
              <div className="h-7 w-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatINR(kpis.totalFinesCollectedPaise)}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Late fees realized</p>
          </CardContent>
        </Card>

        {/* 5. No. of students with dues */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {t.dashboard.kpiStudentsWithDues}
              </span>
              <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {kpis.defaulterCount}{" "}
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                / {kpis.totalStudents}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Pending installments</p>
          </CardContent>
        </Card>
      </div>

      {/* Lists: Recent Payments + Top 5 Defaulters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Payments List */}
        <div className="lg:col-span-7">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
            <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.dashboard.recentPayments}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3 text-left font-semibold">{t.dashboard.receiptNo}</th>
                    <th className="py-2.5 px-3 text-left font-semibold">{t.dashboard.student}</th>
                    <th className="py-2.5 px-3 text-left font-semibold">{t.dashboard.mode}</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-left font-semibold">{t.common.date}</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Bill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {p.receiptNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <Link href={`/students/${p.studentId}`} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                          {p.student.name}
                        </Link>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                          {p.student.class.name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-bold ${
                            p.method === "ONLINE" || p.method === "UPI" || p.method === "CARD" || p.method === "NETBANKING"
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                              : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                          }`}
                        >
                          {p.method || p.mode}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(p.amountPaise)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={loadingReceiptId === p.id}
                          onClick={() => handleOpenReceipt(p.id)}
                          className="h-6 px-2 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 gap-1"
                          title="View Bill / Receipt"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Bill</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Top 5 Defaulters */}
        <div className="lg:col-span-5">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
            <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{t.dashboard.topDefaulters}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {topDefaulters.slice(0, 5).map((d, i) => (
                  <div
                    key={d.id}
                    className="p-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center">
                        #{i + 1}
                      </div>
                      <div>
                        <Link href={`/students/${d.id}`} className="font-bold text-slate-900 dark:text-slate-100 hover:underline">
                          {d.name}
                        </Link>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {d.class.name} • {formatPhone(d.guardianPhone)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatINR(d.totalDuePaise)}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {t.status.overdue}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Official Receipt Bill Modal */}
      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceipt(null);
          }}
        />
      )}
    </div>
  );
}
