"use client";

import * as React from "react";
import Link from "next/link";
import { getOnlineBookEntries, getPaymentReceiptData } from "./actions";
import { formatINR, formatDate, paiseToRupees } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { exportToExcel } from "@/lib/excel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import {
  Globe,
  Banknote,
  Calendar,
  Filter,
  Download,
  Info,
  CreditCard,
  Receipt,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export function OnlineBookClient({
  initialData,
  userRole,
}: {
  initialData: Awaited<ReturnType<typeof getOnlineBookEntries>>;
  userRole?: string;
}) {
  const { t } = useI18n();
  const isMD = userRole === "MD";
  const isClerk = userRole === "CLERK";

  const [data, setData] = React.useState(initialData);
  const [startDate, setStartDate] = React.useState(initialData.startDate);
  const [endDate, setEndDate] = React.useState(initialData.endDate);
  const [loading, setLoading] = React.useState(false);

  // Bill / Receipt Modal State
  const [selectedReceipt, setSelectedReceipt] = React.useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [loadingReceiptId, setLoadingReceiptId] = React.useState<string | null>(null);

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isClerk) return;
    setLoading(true);
    try {
      const res = await getOnlineBookEntries(startDate, endDate);
      setData(res);
      toast.success("Online Payment Book updated for selected dates");
    } catch (err: any) {
      toast.error(err.message || "Failed to load online payment entries");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (paymentId: string) => {
    setLoadingReceiptId(paymentId);
    try {
      const receiptData = await getPaymentReceiptData(paymentId);
      setSelectedReceipt(receiptData);
      setShowReceiptModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to load payment bill receipt");
    } finally {
      setLoadingReceiptId(null);
    }
  };

  const handleExportExcel = () => {
    const exportRows = data.entries.map((entry) => ({
      Date: formatDate(entry.date),
      "Receipt No": entry.receiptNo,
      "Student Name": entry.studentName,
      "Admission No": entry.admissionNo,
      Class: entry.className,
      Method: entry.method || "ONLINE",
      Source: entry.source === "PARENT" ? "Parent Online Portal" : "Staff Counter / Gateway",
      "Transaction Ref / UTR": entry.txnRef || entry.gatewayPaymentId || "",
      "Collected By / Gateway": entry.collectedByName,
      Remarks: entry.remarks || "",
      "Amount (INR)": paiseToRupees(entry.amountPaise),
      "Running Total (INR)": paiseToRupees(entry.runningTotalPaise),
    }));

    exportToExcel(
      exportRows,
      `OnlineBook_${data.startDate}_to_${data.endDate}.xlsx`,
      "OnlinePayments"
    );
    toast.success(t.importExport.exportSuccess);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs: Cash Book vs Online Book */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <Link href="/cash-book">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 font-semibold text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <Banknote className="h-4 w-4" />
            <span>Cash Book</span>
          </Button>
        </Link>
        <Link href="/online-book">
          <Button
            size="sm"
            className="gap-2 font-bold text-xs bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
          >
            <Globe className="h-4 w-4" />
            <span>Online Payment Book</span>
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Online Payment Book
            </h1>
            <Badge
              variant="secondary"
              className="font-semibold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40"
            >
              UPI, Cards, Netbanking & Razorpay
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Digital transactions ledger with UTR, transaction references, bills, and running cumulative balance.
          </p>
        </div>

        {isMD && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-2 font-semibold text-xs border-slate-300 dark:border-slate-700"
          >
            <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t.common.exportExcel}</span>
          </Button>
        )}
      </div>

      {/* Clerk Notice Banner */}
      {isClerk && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 p-3.5 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 shrink-0" />
          <span>Showing today&apos;s online payment transactions ledger.</span>
        </div>
      )}

      {/* Filter and KPI Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Date Filter Card (MD Only) */}
        {!isClerk && (
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <span>{t.cashBook.dateRangeFilter}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
                <div className="space-y-1 flex-1 min-w-[130px]">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {t.cashBook.fromDate}
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1 flex-1 min-w-[130px]">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    {t.cashBook.toDate}
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-xs border-slate-300 dark:border-slate-700"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="sm"
                  className="h-9 bg-blue-700 hover:bg-blue-800 text-white font-bold px-4"
                >
                  {loading ? t.common.loading : t.common.filter}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Total Online KPI */}
        <Card
          className={`${
            isClerk ? "lg:col-span-2" : ""
          } border-slate-200 dark:border-slate-800 bg-gradient-to-br from-blue-50 dark:from-blue-950/30 to-white dark:to-slate-900`}
        >
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center justify-between">
              <span>Total Online Received</span>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-blue-950 dark:text-blue-100 font-mono">
              {formatINR(data.totalOnlinePaise)}
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
              {isClerk ? "Today's digital total" : "In selected date range"}
            </p>
          </CardContent>
        </Card>

        {/* Total Receipts KPI */}
        <Card
          className={`${
            isClerk ? "lg:col-span-2" : ""
          } border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50`}
        >
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Online Payments Count</span>
              <Calendar className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {data.totalTransactions}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Digital receipts issued
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-Day Totals Summary Bar */}
      {data.dayTotals.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {t.cashBook.perDaySummary}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-2">
              {data.dayTotals.map((d) => (
                <div
                  key={d.date}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50 dark:bg-slate-800 text-xs min-w-[140px] flex-1"
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {formatDate(d.date)}
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">
                    {formatINR(d.dayTotalPaise)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {d.count} transaction{d.count > 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Online Transactions Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-4 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Online Transactions Ledger
            </CardTitle>
            <CardDescription className="text-xs">
              Every digital receipt with UTR, student details, running total, and bill viewing options
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {data.entries.length} Entries
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t.common.date}</th>
                  <th className="py-3 px-4">{t.dashboard.receiptNo}</th>
                  <th className="py-3 px-4">{t.dashboard.student}</th>
                  <th className="py-3 px-4">Method & Channel</th>
                  <th className="py-3 px-4">UTR / Transaction Ref</th>
                  <th className="py-3 px-4 text-right">{t.common.amount}</th>
                  <th className="py-3 px-4 text-right">{t.cashBook.runningTotal}</th>
                  <th className="py-3 px-4 text-center">Bill / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No online payment transactions found in this period.
                    </td>
                  </tr>
                ) : (
                  data.entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                        {formatDate(entry.date)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900 dark:text-blue-400">
                        {entry.receiptNo}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/students/${entry.studentId}`}
                          className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                        >
                          {entry.studentName}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {entry.className} • <span className="font-mono">{entry.admissionNo}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900"
                          >
                            {entry.method || "ONLINE"}
                          </Badge>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {entry.source === "PARENT" ? "Parent Portal" : "Counter/Office"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        {entry.txnRef || entry.gatewayPaymentId || entry.remarks || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                        {formatINR(entry.amountPaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-900/40">
                        {formatINR(entry.runningTotalPaise)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loadingReceiptId === entry.id}
                            onClick={() => handleOpenReceipt(entry.id)}
                            className="h-7 px-2.5 text-xs font-semibold gap-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title="View Official Bill Receipt"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Bill</span>
                          </Button>

                          <a
                            href={`/api/receipts/${entry.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs font-semibold gap-1 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              title="Download PDF Bill"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">PDF</span>
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
