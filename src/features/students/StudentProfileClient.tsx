"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDate, formatPhone, paiseToRupees } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { exportToExcel } from "@/lib/excel";
import { hasPermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import {
  CreditCard,
  Printer,
  ArrowLeft,
  Receipt,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";
import { SCHOOL_CONFIG } from "@/lib/config";
import { toast } from "sonner";

export function StudentProfileClient({
  student,
  userRole,
}: {
  student: any;
  userRole: string;
}) {
  const { t } = useI18n();
  const [selectedReceipt, setSelectedReceipt] = React.useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);

  const feePlan = student.feePlans[0];
  const installments = feePlan?.installments || [];
  const payments = student.payments || [];
  const fines = student.fines || [];

  const admissionFee = feePlan?.admissionFeePaise || 0;
  const remainingFee = feePlan?.remainingFeePaise || 0;
  const totalFee = admissionFee + remainingFee;
  const totalPaid = installments.reduce((sum: number, i: any) => sum + i.paidAmountPaise, 0);
  const totalDue = installments.reduce((sum: number, i: any) => sum + Math.max(0, i.amountPaise - i.paidAmountPaise), 0);
  const totalFines = fines.filter((f: any) => !f.isWaived).reduce((sum: number, f: any) => sum + f.amountPaise, 0);

  const canExport = hasPermission(userRole, "EXCEL_EXPORT");
  const canCollect = hasPermission(userRole, "COLLECT_FEE");

  const handleOpenReceipt = (payment: any) => {
    const receiptData: ReceiptData = {
      id: payment.id,
      receiptNo: payment.receiptNo,
      paymentDate: payment.paymentDate,
      amountPaise: payment.amountPaise,
      mode: payment.mode,
      txnRef: payment.txnRef,
      remarks: payment.remarks,
      student: {
        admissionNo: student.admissionNo,
        name: student.name,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        class: { name: student.class.name },
      },
      collectedBy: payment.collectedBy || { name: "School Accountant", role: "CLERK" },
      allocations: payment.allocations.map((a: any) => ({
        amountPaise: a.amountPaise,
        finePaidPaise: a.finePaidPaise,
        installment: {
          title: a.installment.title,
          monthName: a.installment.monthName,
        },
      })),
    };

    setSelectedReceipt(receiptData);
    setShowReceiptModal(true);
  };

  const handleExportPaymentHistory = () => {
    const rows = payments.map((p: any) => ({
      "Receipt No": p.receiptNo,
      Date: formatDate(p.paymentDate),
      Mode: p.mode,
      Method: p.method || p.mode,
      "Transaction Ref / UTR": p.txnRef || "",
      "Amount (INR)": paiseToRupees(p.amountPaise),
      "Student Name": student.name,
      "Admission No": student.admissionNo,
    }));

    exportToExcel(rows, `Payments_${student.admissionNo}.xlsx`, "Payments");
    toast.success(t.importExport.exportSuccess);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-300 dark:border-slate-700">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {student.name}
              </h1>
              <Badge variant="outline" className="font-mono font-bold text-xs">
                {student.admissionNo}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {student.class.name}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Session {SCHOOL_CONFIG.academicSession} • Guardian: {student.guardianName} ({formatPhone(student.guardianPhone)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 font-semibold text-xs border-slate-300 dark:border-slate-700"
          >
            <Printer className="h-4 w-4" />
            <span>{t.common.print}</span>
          </Button>

          {canCollect && totalDue > 0 && (
            <Link href={`/collect-fee?studentId=${student.id}`}>
              <Button size="sm" className="gap-1.5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <CreditCard className="h-4 w-4" />
                <span>{t.nav.collectFee}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Details & Fee Plan Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Student Details (6 cols) */}
        <Card className="md:col-span-6 border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.students.studentProfile}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.admissionNo}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{student.admissionNo}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.admissionDate}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{formatDate(student.admissionDate)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.class}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{student.class.name}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.guardianPhone}:</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{formatPhone(student.guardianPhone)}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.guardian}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{student.guardianName}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.address}:</span>
              <span className="text-slate-700 dark:text-slate-300">{student.address || "Kolkata, West Bengal"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Fee Plan & Balances (6 cols) */}
        <Card className="md:col-span-6 border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
          <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.students.feePlan}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.admissionFee}:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{formatINR(admissionFee)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.totalFee}:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(totalFee)}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.installmentsCount}:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">{feePlan?.installmentCount || 10} Months</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">{t.students.fines}:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatINR(totalFines)}</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <span className="text-[11px] block font-medium">{t.students.totalPaid}</span>
              <span className="font-mono font-bold text-sm">{formatINR(totalPaid)}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300">
              <span className="text-[11px] block font-medium">{t.students.totalDue}</span>
              <span className="font-mono font-bold text-sm">{formatINR(totalDue)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installments Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {t.students.installmentSchedule}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="py-2.5 px-3 text-left font-semibold">#</th>
                <th className="py-2.5 px-3 text-left font-semibold">{t.students.month}</th>
                <th className="py-2.5 px-3 text-left font-semibold">{t.students.dueDate}</th>
                <th className="py-2.5 px-3 text-right font-semibold">{t.students.admissionFee}</th>
                <th className="py-2.5 px-3 text-right font-semibold">{t.students.paidAmount}</th>
                <th className="py-2.5 px-3 text-right font-semibold">{t.students.totalDue}</th>
                <th className="py-2.5 px-3 text-center font-semibold">{t.common.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {installments.map((inst: any, idx: number) => {
                const bal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
                const isPaid = inst.status === "PAID";
                const isOverdue = inst.status === "OVERDUE";

                return (
                  <tr key={inst.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">{inst.title}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{formatDate(inst.dueDate)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{formatINR(inst.amountPaise)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{formatINR(inst.paidAmountPaise)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      {bal > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400">{formatINR(bal)}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {isPaid ? (
                        <Badge variant="default" className="text-[10px] bg-emerald-600">{t.status.paid}</Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-[10px] bg-rose-600">{t.status.overdue}</Badge>
                      ) : inst.status === "PARTIAL" ? (
                        <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">{t.status.partial}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">{t.status.pending}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Payment History & Fines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment History (8 cols) */}
        <div className="lg:col-span-8">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {t.students.paymentHistory}
              </CardTitle>
              {canExport && payments.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportPaymentHistory}
                  className="h-7 text-xs font-semibold text-emerald-600 dark:text-emerald-400 gap-1"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t.common.exportExcel}</span>
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {payments.length > 0 ? (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold">{t.dashboard.receiptNo}</th>
                      <th className="py-2 px-3 text-left font-semibold">{t.common.date}</th>
                      <th className="py-2 px-3 text-left font-semibold">{t.dashboard.mode} & Ref</th>
                      <th className="py-2 px-3 text-right font-semibold">{t.common.amount}</th>
                      <th className="py-2 px-3 text-center font-semibold">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900 dark:text-blue-400">{p.receiptNo}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{formatDate(p.paymentDate)}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{p.method || p.mode}</span>
                          {p.txnRef && (
                            <span className="block font-mono text-[10px] text-slate-500 dark:text-slate-400">{p.txnRef}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(p.amountPaise)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReceipt(p)}
                              className="h-7 px-2.5 text-xs font-semibold gap-1 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                              title="View Official Bill Receipt"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span>View Bill</span>
                            </Button>
                            <a href={`/api/receipts/${p.id}/pdf`} target="_blank" rel="noreferrer">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs font-semibold gap-1 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                                title="Download PDF Bill"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>PDF</span>
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No payment receipts recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fines (4 cols) */}
        <div className="lg:col-span-4">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
            <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>{t.students.fines}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {fines.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {fines.map((f: any) => (
                    <div key={f.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{f.installment.title}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{f.daysOverdue} days overdue</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{formatINR(f.amountPaise)}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                          {f.isWaived ? "Waived" : "Active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No late fines incurred.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
