"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR, formatDate, formatDateTime, formatPhone, amountInWordsINR } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import { reversePayment, waiveFine } from "@/features/fees/actions";
import {
  User,
  GraduationCap,
  CreditCard,
  Printer,
  BellRing,
  RotateCcw,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowLeft,
  Receipt,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export function StudentProfileClient({
  student,
  userRole,
}: {
  student: any;
  userRole: string;
}) {
  const router = useRouter();

  // Active Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = React.useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);

  // Payment Reversal Dialog
  const [paymentToReverse, setPaymentToReverse] = React.useState<any | null>(null);
  const [reversalReason, setReversalReason] = React.useState("");
  const [isReversing, setIsReversing] = React.useState(false);

  // Fine Waiver Dialog
  const [fineToWaive, setFineToWaive] = React.useState<any | null>(null);
  const [waiverReason, setWaiverReason] = React.useState("");
  const [isWaiving, setIsWaiving] = React.useState(false);

  const feePlan = student.feePlans[0];
  const installments = feePlan?.installments || [];
  const payments = student.payments || [];
  const fines = student.fines || [];
  const reminderLogs = student.reminderLogs || [];

  const totalFee = feePlan?.totalFeePaise || 0;
  const totalPaid = installments.reduce((sum: number, i: any) => sum + i.paidAmountPaise, 0);
  const totalDue = installments.reduce((sum: number, i: any) => sum + Math.max(0, i.amountPaise - i.paidAmountPaise), 0);
  const totalUnwaivedFines = fines
    .filter((f: any) => !f.isWaived)
    .reduce((sum: number, f: any) => sum + f.amountPaise, 0);

  const handleOpenReceipt = (payment: any) => {
    const receiptData: ReceiptData = {
      id: payment.id,
      receiptNo: payment.receiptNo,
      paymentDate: payment.paymentDate,
      amountPaise: payment.amountPaise,
      mode: payment.mode,
      transactionRef: payment.transactionRef,
      bankName: payment.bankName,
      remarks: payment.remarks,
      student: {
        admissionNo: student.admissionNo,
        rollNo: student.rollNo,
        firstName: student.firstName,
        lastName: student.lastName,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        class: { name: student.class.name },
        section: { name: student.section.name },
      },
      session: {
        code: student.session.code,
        name: student.session.name,
      },
      collectedBy: payment.collectedBy || {
        name: "School Accountant",
        role: "ACCOUNTANT",
      },
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

  const handleExecuteReversal = async () => {
    if (!paymentToReverse) return;
    if (!reversalReason.trim()) {
      toast.error("Please provide a reason for payment reversal");
      return;
    }

    setIsReversing(true);
    try {
      await reversePayment(paymentToReverse.id, reversalReason);
      toast.success(`Payment ${paymentToReverse.receiptNo} reversed successfully`);
      setPaymentToReverse(null);
      setReversalReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reverse payment");
    } finally {
      setIsReversing(false);
    }
  };

  const handleExecuteWaiver = async () => {
    if (!fineToWaive) return;
    if (!waiverReason.trim()) {
      toast.error("Please provide a reason for waiving this late fine");
      return;
    }

    setIsWaiving(true);
    try {
      await waiveFine(fineToWaive.id, waiverReason);
      toast.success("Late fine waived successfully");
      setFineToWaive(null);
      setWaiverReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to waive fine");
    } finally {
      setIsWaiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {student.firstName} {student.lastName}
              </h1>
              <Badge variant="outline" className="font-mono font-bold">
                {student.admissionNo}
              </Badge>
              <Badge
                variant={student.status === "ACTIVE" ? "success" : "secondary"}
                className="text-xs"
              >
                {student.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Class {student.class.name} • Section {student.section.name} • Session {student.session.code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 font-semibold"
          >
            <Printer className="h-4 w-4" />
            <span>Print Ledger</span>
          </Button>

          <Link href={`/collect-fee?studentId=${student.id}`}>
            <Button size="sm" variant="success" className="gap-1.5 font-bold shadow-xs">
              <CreditCard className="h-4 w-4" />
              <span>Collect Fee</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="border shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Avatar & Personal Info */}
            <div className="md:col-span-4 flex items-center gap-4 border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-base text-foreground">
                  {student.firstName} {student.lastName}
                </p>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span className="font-mono">{formatPhone(student.guardianPhone)}</span>
                </div>
                {student.guardianEmail && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    <span>{student.guardianEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>{student.address || `${student.city}, ${student.state}`}</span>
                </div>
              </div>
            </div>

            {/* Middle: Guardian & Concession Details */}
            <div className="md:col-span-4 space-y-1.5 text-xs border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-6">
              <div>
                <span className="text-muted-foreground">Guardian Name: </span>
                <span className="font-semibold text-foreground">{student.guardianName} ({student.guardianRelation})</span>
              </div>
              <div>
                <span className="text-muted-foreground">Admission Date: </span>
                <span className="font-semibold text-foreground">{formatDate(student.admissionDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Roll No: </span>
                <span className="font-semibold text-foreground">#{student.rollNo || "N/A"}</span>
              </div>
              {feePlan?.discountPaise > 0 && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Concession: </span>
                  <span>{formatINR(feePlan.discountPaise)} ({feePlan.discountReason || "Approved"})</span>
                </div>
              )}
            </div>

            {/* Right: Quick Financial Metric Badges */}
            <div className="md:col-span-4 grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-muted/40 border">
                <span className="text-[11px] text-muted-foreground block font-medium">Total Session Fee</span>
                <span className="text-base font-bold font-mono text-foreground">{formatINR(totalFee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium">Total Paid</span>
                <span className="text-base font-bold font-mono text-emerald-700 dark:text-emerald-300">{formatINR(totalPaid)}</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                <span className="text-[11px] text-rose-700 dark:text-rose-300 block font-medium">Remaining Due</span>
                <span className="text-base font-bold font-mono text-rose-700 dark:text-rose-300">{formatINR(totalDue)}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <span className="text-[11px] text-amber-700 dark:text-amber-300 block font-medium">Late Fines</span>
                <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-300">{formatINR(totalUnwaivedFines)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Installments, Payments, Fines, Reminders, Statement */}
      <Tabs defaultValue="installments" className="w-full">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl">
          <TabsTrigger value="installments">Installments ({installments.length})</TabsTrigger>
          <TabsTrigger value="payments">Receipts ({payments.length})</TabsTrigger>
          <TabsTrigger value="fines">Late Fines ({fines.length})</TabsTrigger>
          <TabsTrigger value="reminders">Reminders ({reminderLogs.length})</TabsTrigger>
          <TabsTrigger value="statement">Full Statement</TabsTrigger>
        </TabsList>

        {/* 1. Installments Tab */}
        <TabsContent value="installments" className="space-y-4 pt-2">
          <Card className="border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-left">#</th>
                    <th className="py-2.5 px-3 text-left">Particulars / Month</th>
                    <th className="py-2.5 px-3 text-left">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Fee (₹)</th>
                    <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                    <th className="py-2.5 px-3 text-right">Balance Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {installments.map((inst: any, idx: number) => {
                    const pending = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
                    const isPaid = inst.status === "PAID";
                    const isOverdue = inst.status === "OVERDUE";

                    return (
                      <tr key={inst.id} className="hover:bg-muted/30">
                        <td className="py-3 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-foreground">{inst.title}</td>
                        <td className="py-3 px-3 font-mono text-muted-foreground">{formatDate(inst.dueDate)}</td>
                        <td className="py-3 px-3 text-right font-mono font-medium">{formatINR(inst.amountPaise)}</td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">{formatINR(inst.paidAmountPaise)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          {pending > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">{formatINR(pending)}</span>
                          ) : (
                            <span className="text-emerald-600">₹0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isPaid ? (
                            <Badge variant="success" className="text-[10px]">Paid</Badge>
                          ) : isOverdue ? (
                            <Badge variant="overdue" className="text-[10px]">Overdue</Badge>
                          ) : inst.status === "PARTIAL" ? (
                            <Badge variant="warning" className="text-[10px]">Partial</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {!isPaid && (
                            <Link href={`/collect-fee?studentId=${student.id}`}>
                              <Button size="sm" variant="outline" className="h-7 text-xs font-semibold">
                                Pay
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Receipts & Payments Tab */}
        <TabsContent value="payments" className="space-y-4 pt-2">
          <Card className="border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Receipt No</th>
                    <th className="py-2.5 px-3 text-left">Payment Date</th>
                    <th className="py-2.5 px-3 text-left">Mode & Ref</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-left">Cashier / Collected By</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.length > 0 ? (
                    payments.map((p: any) => {
                      const isReversed = p.status === "REVERSED";

                      return (
                        <tr key={p.id} className={`hover:bg-muted/30 ${isReversed ? "opacity-60 bg-red-50/30" : ""}`}>
                          <td className="py-3 px-3 font-mono font-bold text-foreground">
                            {p.receiptNo}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {formatDateTime(p.paymentDate)}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold uppercase text-foreground">{p.mode}</span>
                            {p.transactionRef && (
                              <span className="block font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                                {p.transactionRef}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatINR(p.amountPaise)}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {p.collectedBy?.name || "Cashier"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isReversed ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Reversed
                              </Badge>
                            ) : (
                              <Badge variant="success" className="text-[10px]">
                                Completed
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReceipt(p)}
                                className="h-7 text-xs font-semibold gap-1"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                                <span>Receipt</span>
                              </Button>

                              {userRole === "ADMIN" && !isReversed && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setPaymentToReverse(p)}
                                  className="h-7 text-xs px-2"
                                  title="Reverse Payment (Admin Only)"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No payments recorded yet for this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 3. Late Fines Tab */}
        <TabsContent value="fines" className="space-y-4 pt-2">
          <Card className="border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Installment</th>
                    <th className="py-2.5 px-3 text-right">Fine Amount</th>
                    <th className="py-2.5 px-3 text-center">Days Overdue</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-left">Waiver Reason / Note</th>
                    <th className="py-2.5 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {fines.length > 0 ? (
                    fines.map((f: any) => (
                      <tr key={f.id} className="hover:bg-muted/30">
                        <td className="py-3 px-3 font-semibold text-foreground">
                          {f.installment.title}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">
                          {formatINR(f.amountPaise)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {f.daysOverdue} days
                        </td>
                        <td className="py-3 px-3 text-center">
                          {f.isWaived ? (
                            <Badge variant="secondary" className="text-[10px]">
                              Waived
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Active Fine
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground text-xs">
                          {f.waiverReason || "-"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {!f.isWaived && userRole === "ADMIN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setFineToWaive(f)}
                              className="h-7 text-xs font-semibold text-amber-700 dark:text-amber-400 border-amber-300"
                            >
                              Waive Fine
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No late fines incurred by this student.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 4. Reminder Logs Tab */}
        <TabsContent value="reminders" className="space-y-4 pt-2">
          <Card className="border shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-2.5 px-3 text-left">Sent Date</th>
                    <th className="py-2.5 px-3 text-left">Channel & Recipient</th>
                    <th className="py-2.5 px-3 text-left">Message Content</th>
                    <th className="py-2.5 px-3 text-right">Amount Due</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reminderLogs.length > 0 ? (
                    reminderLogs.map((r: any) => (
                      <tr key={r.id} className="hover:bg-muted/30">
                        <td className="py-3 px-3 font-mono text-muted-foreground">
                          {formatDateTime(r.createdAt)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">{r.channel}</div>
                          <span className="text-[10px] text-muted-foreground font-mono">{r.recipientPhone}</span>
                        </td>
                        <td className="py-3 px-3 text-foreground max-w-md">
                          <p className="line-clamp-2">{r.messageContent}</p>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                          {formatINR(r.amountDuePaise)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge variant="success" className="text-[10px]">
                            {r.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No payment reminders sent yet to this guardian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 5. Formal Ledger Statement Tab (Printable) */}
        <TabsContent value="statement" className="space-y-4 pt-2">
          <Card className="border shadow-sm p-6 bg-white text-slate-900 print:shadow-none print:border-none">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-blue-900 uppercase">Arohon Vidya Mandir</h2>
                <p className="text-xs text-slate-600 font-medium">Student Fee Ledger Statement • Session {student.session.code}</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-mono font-bold">{student.admissionNo}</p>
                <p className="text-slate-500">As on {formatDate(new Date())}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 my-4 p-3 bg-slate-50 rounded text-xs">
              <div>
                <p><span className="text-slate-500">Name:</span> <span className="font-bold">{student.firstName} {student.lastName}</span></p>
                <p><span className="text-slate-500">Class:</span> <span className="font-semibold">{student.class.name} - {student.section.name} (Roll: {student.rollNo || "N/A"})</span></p>
              </div>
              <div className="text-right">
                <p><span className="text-slate-500">Guardian:</span> <span className="font-semibold">{student.guardianName}</span></p>
                <p><span className="text-slate-500">Mobile:</span> <span className="font-mono">{student.guardianPhone}</span></p>
              </div>
            </div>

            <table className="w-full text-xs my-4 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300 bg-slate-100 text-slate-700 font-bold">
                  <th className="py-2 px-2 text-left">Month / Schedule</th>
                  <th className="py-2 px-2 text-left">Due Date</th>
                  <th className="py-2 px-2 text-right">Debit (Fee ₹)</th>
                  <th className="py-2 px-2 text-right">Credit (Paid ₹)</th>
                  <th className="py-2 px-2 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {installments.map((inst: any) => {
                  const bal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
                  return (
                    <tr key={inst.id}>
                      <td className="py-2 px-2 font-medium">{inst.title}</td>
                      <td className="py-2 px-2 font-mono text-slate-500">{formatDate(inst.dueDate)}</td>
                      <td className="py-2 px-2 text-right font-mono">{formatINR(inst.amountPaise)}</td>
                      <td className="py-2 px-2 text-right font-mono text-emerald-700">{formatINR(inst.paidAmountPaise)}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold text-rose-700">{formatINR(bal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-400 font-bold bg-slate-50">
                  <td colSpan={2} className="py-2.5 px-2 uppercase">Total Account Summary:</td>
                  <td className="py-2.5 px-2 text-right font-mono">{formatINR(totalFee)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-700">{formatINR(totalPaid)}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-rose-700 text-sm">{formatINR(totalDue)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-8 pt-4 border-t flex justify-between items-end text-[10px] text-slate-500">
              <p>Generated by SchoolPay Automated Accounting System</p>
              <div className="text-center w-36 border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-700">Accounts Officer</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={selectedReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />

      {/* Payment Reversal Modal (Admin Only) */}
      <Dialog open={!!paymentToReverse} onOpenChange={(open) => !open && setPaymentToReverse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              <span>Reverse Payment {paymentToReverse?.receiptNo}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground text-xs">
              Reversing a payment will mark the receipt as REVERSED, restore installment outstanding balances, and adjust the Cash/Bank Book. This action is permanently audit-logged.
            </p>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-semibold">
              Amount to reverse: {formatINR(paymentToReverse?.amountPaise)} ({paymentToReverse?.mode})
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Reversal Reason *</label>
              <Input
                required
                placeholder="e.g. Cheque bounced / Entry error / Duplicate record"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentToReverse(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isReversing}
              onClick={handleExecuteReversal}
              className="font-bold"
            >
              {isReversing ? "Reversing..." : "Confirm Reversal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fine Waiver Modal (Admin Only) */}
      <Dialog open={!!fineToWaive} onOpenChange={(open) => !open && setFineToWaive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Waive Late Fine</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-semibold">
              Fine Amount: {formatINR(fineToWaive?.amountPaise)} ({fineToWaive?.daysOverdue} days overdue)
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Waiver Reason *</label>
              <Input
                required
                placeholder="e.g. Medical leave approved by Principal / Parent request"
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFineToWaive(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={isWaiving}
              onClick={handleExecuteWaiver}
              className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isWaiving ? "Waiving..." : "Approve Fine Waiver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
