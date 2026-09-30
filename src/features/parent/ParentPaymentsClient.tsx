"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import { getPaymentReceiptData } from "@/features/cash-book/actions";
import { Download, CheckCircle2, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";

export function ParentPaymentsClient({
  payments,
}: {
  payments: any[];
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
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {t.parent.paymentHistoryTitle}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          View all online transaction receipts, preview official digital bills, and download PDFs.
        </p>
      </div>

      {/* Payments Table Card */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Payment Receipts & Bills
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {payments.length} Transactions
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
                  <th className="py-3 px-4">{t.parent.installmentsCovered}</th>
                  <th className="py-3 px-4">{t.parent.method}</th>
                  <th className="py-3 px-4 text-right">{t.common.amount}</th>
                  <th className="py-3 px-4 text-center">{t.common.status}</th>
                  <th className="py-3 px-4 text-center">Bill / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No online payment records found.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                        {formatDate(p.paymentDate)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-900 dark:text-blue-400">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{p.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.className} • {p.admissionNo}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                        {p.installmentsCovered || "General Fee"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] font-semibold uppercase">
                          {p.method}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatINR(p.amountPaise)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px]">
                          {t.status.paid}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={loadingReceiptId === p.id}
                            onClick={() => handleOpenReceipt(p.id)}
                            className="h-7 text-xs gap-1 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                            title="View Official Bill"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>View Bill</span>
                          </Button>
                          <a href={`/api/receipts/${p.id}/pdf`} target="_blank" rel="noreferrer">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Download PDF"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">PDF</span>
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
