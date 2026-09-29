"use client";

import * as React from "react";
import { formatINR, amountInWordsINR, formatDate, formatDateTime } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Download, MessageSquare, CheckCircle2, GraduationCap, X } from "lucide-react";
import { toast } from "sonner";

export interface ReceiptData {
  id: string;
  receiptNo: string;
  paymentDate: Date | string;
  amountPaise: number;
  mode: string;
  transactionRef?: string | null;
  bankName?: string | null;
  remarks?: string | null;
  student: {
    admissionNo: string;
    rollNo?: string | null;
    firstName: string;
    lastName: string;
    guardianName: string;
    guardianPhone: string;
    class: { name: string };
    section: { name: string };
  };
  session: {
    code: string;
    name: string;
  };
  collectedBy: {
    name: string;
    role: string;
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
    const text = `*Fee Receipt Confirmation - Arohon Vidya Mandir*\nReceipt No: ${receipt.receiptNo}\nStudent: ${receipt.student.firstName} ${receipt.student.lastName} (${receipt.student.admissionNo})\nClass: ${receipt.student.class.name}-${receipt.student.section.name}\nAmount Paid: ${formatINR(receipt.amountPaise)}\nMode: ${receipt.mode}\nDate: ${formatDate(receipt.paymentDate)}\n\nThank you for your payment. This is an official digital receipt.`;
    
    // In mock demo, show realistic toast and open web whatsapp or copy
    navigator.clipboard?.writeText(text);
    toast.success("Receipt link & WhatsApp message copied to clipboard! (Simulated send to " + receipt.student.guardianPhone + ")");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="p-6 overflow-y-auto max-h-[85vh]">
          {/* Printable Receipt Paper Container */}
          <div
            id="printable-receipt"
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 rounded-xl bg-white text-slate-900 shadow-sm print:border-solid print:p-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-blue-900 uppercase">
                    Arohon Vidya Mandir
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium">
                    (Affiliated to CISCE / State Board • Code: WB-1994)
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Plot 14, Sector V, Salt Lake City, Kolkata - 700091 | Ph: +91 33 2357 8900
                  </p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <Badge variant="default" className="bg-blue-800 text-white font-bold text-xs uppercase px-2.5 py-0.5 mb-1">
                  Fee Receipt
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
            <div className="grid grid-cols-2 gap-4 py-4 my-2 text-xs border-b bg-slate-50/70 p-3 rounded-lg">
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500 font-medium">Student Name: </span>
                  <span className="font-bold text-slate-900">
                    {receipt.student.firstName} {receipt.student.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Admission No: </span>
                  <span className="font-mono font-bold text-slate-900">
                    {receipt.student.admissionNo}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Class & Section: </span>
                  <span className="font-semibold text-slate-900">
                    {receipt.student.class.name} - Section {receipt.student.section.name} (Roll: {receipt.student.rollNo || "N/A"})
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-right">
                <div>
                  <span className="text-slate-500 font-medium">Academic Session: </span>
                  <span className="font-bold text-blue-900">{receipt.session.code}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Guardian Name: </span>
                  <span className="font-semibold text-slate-900">{receipt.student.guardianName}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Guardian Mobile: </span>
                  <span className="font-mono font-semibold text-slate-900">{receipt.student.guardianPhone}</span>
                </div>
              </div>
            </div>

            {/* Table of Breakdown */}
            <table className="w-full text-xs my-3 border-collapse">
              <thead>
                <tr className="border-b bg-slate-100 text-slate-700 font-bold">
                  <th className="py-2 px-2 text-left">#</th>
                  <th className="py-2 px-2 text-left">Fee Particulars</th>
                  <th className="py-2 px-2 text-right">Fee (₹)</th>
                  <th className="py-2 px-2 text-right">Late Fine (₹)</th>
                  <th className="py-2 px-2 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipt.allocations.length > 0 ? (
                  receipt.allocations.map((alloc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
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
                      School Fee Payment ({receipt.remarks || "General Collection"})
                    </td>
                    <td className="py-2 px-2 text-right font-mono">{formatINR(receipt.amountPaise)}</td>
                    <td className="py-2 px-2 text-right font-mono">-</td>
                    <td className="py-2 px-2 text-right font-bold font-mono">{formatINR(receipt.amountPaise)}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-bold bg-slate-50">
                  <td colSpan={4} className="py-2.5 px-2 text-right uppercase text-slate-700">
                    Grand Total Paid:
                  </td>
                  <td className="py-2.5 px-2 text-right text-sm text-blue-900 font-mono">
                    {formatINR(receipt.amountPaise)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in Words */}
            <div className="py-2 text-xs border-y border-dashed my-2 text-slate-800">
              <span className="font-semibold text-slate-600">Amount in words: </span>
              <span className="font-bold text-slate-950 italic">
                {amountInWordsINR(receipt.amountPaise)}
              </span>
            </div>

            {/* Payment Mode & Bank Ref */}
            <div className="grid grid-cols-2 gap-2 text-xs py-2">
              <div>
                <span className="text-slate-500">Payment Mode: </span>
                <span className="font-bold uppercase text-slate-800">{receipt.mode}</span>
                {receipt.transactionRef && (
                  <span className="text-slate-600 ml-2 font-mono">
                    (Ref: {receipt.transactionRef})
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-500">Cashier / Collected By: </span>
                <span className="font-semibold text-slate-800">{receipt.collectedBy.name}</span>
              </div>
            </div>

            {/* Signatures & Footer Note */}
            <div className="mt-8 pt-4 flex items-end justify-between border-t text-[10px] text-slate-500">
              <div className="max-w-[320px]">
                <p className="italic font-medium">
                  * Note: Computer generated fee receipt. No physical signature required. Fees once deposited are non-refundable.
                </p>
              </div>

              <div className="text-center space-y-1">
                <div className="h-8 border-b border-slate-400 w-36 mx-auto mb-1 flex items-center justify-center">
                  <span className="font-serif italic text-slate-600 text-xs">Arohon Accounts</span>
                </div>
                <p className="font-bold uppercase text-slate-700">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleWhatsAppShare}
              className="gap-1.5 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>Send WhatsApp (Mock)</span>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 font-bold"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
