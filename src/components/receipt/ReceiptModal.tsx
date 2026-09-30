"use client";

import * as React from "react";
import { formatINR, amountInWordsINR, formatDate, formatDateTime } from "@/lib/formatters";
import { SCHOOL_NAME, SESSION_CODE } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, GraduationCap, MessageSquare, Download } from "lucide-react";
import { toast } from "sonner";

export interface ReceiptData {
  id: string;
  receiptNo: string;
  paymentDate: Date | string;
  amountPaise: number;
  mode: string;
  txnRef?: string | null;
  remarks?: string | null;
  student: {
    admissionNo: string;
    name: string;
    guardianName: string;
    guardianPhone: string;
    class: { name: string };
  };
  collectedBy: {
    name: string;
    role?: string;
  };
  allocations: {
    amountPaise: number;
    finePaidPaise: number;
    installment: {
      title: string;
      monthName: string;
    };
  }[];
}

export function ReceiptModal({
  receipt,
  isOpen,
  onClose,
}: {
  receipt: ReceiptData | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = `*Fee Receipt - ${SCHOOL_NAME}*\nReceipt No: ${receipt.receiptNo}\nStudent: ${receipt.student.name} (${receipt.student.admissionNo})\nClass: ${receipt.student.class.name}\nAmount Paid: ${formatINR(receipt.amountPaise)}\nMode: ${receipt.mode}${receipt.txnRef ? ` (Ref: ${receipt.txnRef})` : ""}\nDate: ${formatDate(receipt.paymentDate)}\n\nThank you for your payment.`;
    navigator.clipboard?.writeText(text);
    toast.success("Receipt details copied! (Simulated send to " + receipt.student.guardianPhone + ")");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="p-6 overflow-y-auto max-h-[85vh] bg-slate-100/50 dark:bg-slate-950/50">
          {/* Printable Receipt Paper Container */}
          <div
            id="printable-receipt"
            className="border border-slate-300 dark:border-slate-700 p-6 rounded-xl bg-white text-slate-900 shadow-sm print:border-none print:p-0"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-blue-900">
                    {SCHOOL_NAME}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kolkata, West Bengal • Academic Session {SESSION_CODE}
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <Badge variant="default" className="bg-blue-800 text-white font-semibold text-xs uppercase px-2 py-0.5 mb-1">
                  Official Fee Receipt
                </Badge>
                <span className="font-mono text-xs font-bold text-slate-900">
                  {receipt.receiptNo}
                </span>
                <span className="text-[11px] text-slate-500">
                  {formatDateTime(receipt.paymentDate)}
                </span>
              </div>
            </div>

            {/* Student & Session Info Box */}
            <div className="grid grid-cols-2 gap-4 py-3 my-3 text-xs border border-slate-100 bg-slate-50 p-3 rounded-lg">
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500">Student Name: </span>
                  <span className="font-bold text-slate-900">{receipt.student.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">Admission No: </span>
                  <span className="font-mono font-bold text-slate-900">{receipt.student.admissionNo}</span>
                </div>
                <div>
                  <span className="text-slate-500">Class: </span>
                  <span className="font-semibold text-slate-900">{receipt.student.class.name}</span>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <div>
                  <span className="text-slate-500">Academic Session: </span>
                  <span className="font-bold text-blue-900">{SESSION_CODE}</span>
                </div>
                <div>
                  <span className="text-slate-500">Guardian Name: </span>
                  <span className="font-semibold text-slate-900">{receipt.student.guardianName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Guardian Mobile: </span>
                  <span className="font-mono font-semibold text-slate-900">{receipt.student.guardianPhone}</span>
                </div>
              </div>
            </div>

            {/* Table of Breakdown */}
            <table className="w-full text-xs my-3 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/80 text-slate-700 font-semibold">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Particulars</th>
                  <th className="py-2 px-2 text-right">Fee (₹)</th>
                  <th className="py-2 px-2 text-right">Late Fine (₹)</th>
                  <th className="py-2 px-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.allocations.length > 0 ? (
                  receipt.allocations.map((alloc, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-slate-800">
                        {alloc.installment.title || `${alloc.installment.monthName} Installment`}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700 font-mono">
                        {formatINR(alloc.amountPaise)}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-700 font-mono">
                        {alloc.finePaidPaise > 0 ? formatINR(alloc.finePaidPaise) : "-"}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900 font-mono">
                        {formatINR(alloc.amountPaise + alloc.finePaidPaise)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-2 px-2 text-slate-500">1</td>
                    <td className="py-2 px-2 font-medium text-slate-800">
                      School Fee ({receipt.remarks || "General Collection"})
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{formatINR(receipt.amountPaise)}</td>
                    <td className="py-2 px-2 text-right font-mono">-</td>
                    <td className="py-2 px-2 text-right font-bold font-mono">{formatINR(receipt.amountPaise)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-bold bg-slate-50">
                  <td colSpan={4} className="py-2 px-2 text-right uppercase text-slate-700">
                    Grand Total Paid:
                  </td>
                  <td className="py-2 px-2 text-right text-sm text-blue-900 font-mono">
                    {formatINR(receipt.amountPaise)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in Words */}
            <div className="py-2 text-xs border-y border-dashed border-slate-200 my-2 text-slate-800">
              <span className="text-slate-500">Amount in words: </span>
              <span className="font-semibold text-slate-900 italic">
                {amountInWordsINR(receipt.amountPaise)}
              </span>
            </div>

            {/* Payment Mode & Details */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2">
              <div>
                <span className="text-slate-500">Payment Mode: </span>
                <span className="font-bold uppercase text-slate-800">{receipt.mode}</span>
                {receipt.txnRef && (
                  <span className="text-slate-600 ml-2 font-mono">
                    (Ref: {receipt.txnRef})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500">Collected By: </span>
                <span className="font-semibold text-slate-800">{receipt.collectedBy?.name || "Counter Cashier"}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-3 flex items-end justify-between border-t border-slate-200 text-[10px] text-slate-400">
              <p className="italic">
                * Computer generated receipt. Fees once deposited are non-refundable.
              </p>
              <div className="text-center">
                <div className="h-6 border-b border-slate-300 w-28 mx-auto mb-1"></div>
                <p className="font-semibold text-slate-600 uppercase">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleWhatsAppShare}
            className="gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-xs"
          >
            <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Copy WhatsApp Preview</span>
          </Button>

          <div className="flex items-center gap-2">
            <a href={`/api/receipts/${receipt.id}/pdf`} target="_blank" rel="noreferrer">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 font-bold text-xs text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              >
                <Download className="h-4 w-4" />
                <span>Download Bill (PDF)</span>
              </Button>
            </a>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 font-bold text-xs bg-blue-700 hover:bg-blue-800 text-white"
            >
              <Printer className="h-4 w-4" />
              <span>Print</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
            >
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
