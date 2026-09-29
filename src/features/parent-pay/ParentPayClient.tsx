"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDate, formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RazorpayMockModal } from "@/components/payment/RazorpayMockModal";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import { searchParentStudent, processOnlineParentPayment } from "./actions";
import {
  GraduationCap,
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  Building,
  RefreshCw,
  Receipt,
  Calendar,
  Download,
  Share2,
  Clock,
  Check,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export function ParentPayClient({
  initialStudentData,
  initialAdmissionNo = "AVM-2026-0004",
  initialPhone = "9830100004",
}: {
  initialStudentData?: any;
  initialAdmissionNo?: string;
  initialPhone?: string;
}) {
  const [admissionNo, setAdmissionNo] = React.useState(initialAdmissionNo);
  const [phone, setPhone] = React.useState(initialPhone);
  const [isSearching, setIsSearching] = React.useState(false);

  const [studentData, setStudentData] = React.useState<any | null>(initialStudentData || null);
  const [selectedInstallmentIds, setSelectedInstallmentIds] = React.useState<string[]>(() => {
    if (initialStudentData?.installments) {
      return initialStudentData.installments.map((i: any) => i.id);
    }
    return [];
  });
  const [payAmountPaise, setPayAmountPaise] = React.useState<number>(() => {
    return initialStudentData?.summary?.totalDuePaise || 0;
  });

  // Gateway Modal & Receipt Modal
  const [showGatewayModal, setShowGatewayModal] = React.useState(false);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [activeReceipt, setActiveReceipt] = React.useState<ReceiptData | null>(null);

  // If initial data wasn't passed, fetch on mount
  React.useEffect(() => {
    if (!initialStudentData) {
      handleSearchWithParams(admissionNo, phone);
    }
  }, [initialStudentData]);

  const handleSearchWithParams = async (adm: string, ph: string) => {
    setIsSearching(true);
    try {
      const data = await searchParentStudent(adm, ph);
      setStudentData(data);
      // Auto-select all pending installments
      const ids = data.installments.map((i: any) => i.id);
      setSelectedInstallmentIds(ids);
      setPayAmountPaise(data.summary.totalDuePaise);
    } catch (err: any) {
      toast.error(err.message || "No student record found");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSearchWithParams(admissionNo, phone);
  };

  const handleQuickSelect = (adm: string, ph: string) => {
    setAdmissionNo(adm);
    setPhone(ph);
    handleSearchWithParams(adm, ph);
  };

  const handleToggleInstallment = (id: string) => {
    let newSelected: string[];
    if (selectedInstallmentIds.includes(id)) {
      newSelected = selectedInstallmentIds.filter((x) => x !== id);
    } else {
      newSelected = [...selectedInstallmentIds, id];
    }
    setSelectedInstallmentIds(newSelected);

    if (studentData) {
      const total = studentData.installments
        .filter((i: any) => newSelected.includes(i.id))
        .reduce((sum: number, i: any) => sum + i.totalDuePaise, 0);
      setPayAmountPaise(total);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!studentData) return;
    if (checked) {
      const ids = studentData.installments.map((i: any) => i.id);
      setSelectedInstallmentIds(ids);
      setPayAmountPaise(studentData.summary.totalDuePaise);
    } else {
      setSelectedInstallmentIds([]);
      setPayAmountPaise(0);
    }
  };

  const handlePaymentSuccess = async (method: "UPI" | "CARD" | "NETBANKING", txnId: string) => {
    if (!studentData) return;

    const res = await processOnlineParentPayment({
      studentId: studentData.student.id,
      amountPaise: payAmountPaise,
      paymentMethod: method,
      gatewayTxnId: txnId,
    });

    toast.success(`Payment verified! Receipt #${res.receiptNo} generated.`);

    // Build receipt modal payload
    const receiptData: ReceiptData = {
      id: res.paymentId,
      receiptNo: res.receiptNo,
      paymentDate: new Date(),
      amountPaise: payAmountPaise,
      mode: "ONLINE_GATEWAY",
      transactionRef: txnId,
      bankName: `Online Payment Gateway (${method})`,
      remarks: `Parent Online Fee Payment via ${method}`,
      student: {
        admissionNo: studentData.student.admissionNo,
        rollNo: studentData.student.rollNo,
        firstName: studentData.student.firstName,
        lastName: studentData.student.lastName,
        guardianName: studentData.student.guardianName,
        guardianPhone: studentData.student.guardianPhone,
        class: { name: studentData.student.class.name },
        section: { name: studentData.student.section.name },
      },
      session: {
        code: studentData.student.session.code,
        name: studentData.student.session.name,
      },
      collectedBy: {
        name: "Online Fee Portal",
        role: "GATEWAY",
      },
      allocations: studentData.installments
        .filter((i: any) => selectedInstallmentIds.includes(i.id))
        .map((i: any) => ({
          amountPaise: i.pendingPrincipalPaise,
          finePaidPaise: i.finePaise,
          installment: {
            title: i.title,
            monthName: i.monthName,
          },
        })),
    };

    setActiveReceipt(receiptData);
    setShowReceiptModal(true);

    // Refresh student dues
    handleSearchWithParams(admissionNo, phone);
  };

  const handleViewReceipt = (r: any) => {
    const formattedReceipt: ReceiptData = {
      id: r.id,
      receiptNo: r.receiptNo,
      paymentDate: new Date(r.paymentDate),
      amountPaise: r.amountPaise,
      mode: r.mode,
      transactionRef: r.transactionRef,
      bankName: r.bankName,
      remarks: r.remarks,
      student: r.student,
      session: r.session,
      collectedBy: r.collectedBy,
      allocations: r.allocations,
    };
    setActiveReceipt(formattedReceipt);
    setShowReceiptModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground pb-12">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight">
                  Arohon Vidya Mandir
                </span>
                <Badge variant="default" className="text-[10px] px-1.5 py-0">
                  Parent Portal
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Official Online Fee Payment & Receipt Portal • Session 2026-27
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              <span>Accounts Helpdesk: +91 98300 12345</span>
            </div>
            <Link href="/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Staff Sign In →
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 space-y-6">
        {/* Step 1: Student Lookup Card with Fast One-Click Demo Chips */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Student Fee Account Lookup</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your child's Admission Number and 10-digit registered mobile number to view pending installments, receipts, and pay online.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-foreground">Student Admission Number</label>
                <Input
                  required
                  placeholder="e.g. AVM-2026-0004"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  className="font-mono h-10 text-sm bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-foreground">Registered Mobile Number</label>
                <Input
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono h-10 text-sm bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                >
                  {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span>{isSearching ? "Loading..." : "Search Dues"}</span>
                </Button>
              </div>
            </form>

            {/* Quick Demo Test Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Quick Demo Accounts:</span>
              </span>

              <button
                type="button"
                onClick={() => handleQuickSelect("AVM-2026-0004", "9830100004")}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  admissionNo === "AVM-2026-0004"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 border-slate-200 dark:border-slate-700"
                }`}
              >
                Rohan Sharma (Class 10 - Overdue ₹9,400)
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect("AVM-2026-0002", "9830100002")}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  admissionNo === "AVM-2026-0002"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 border-slate-200 dark:border-slate-700"
                }`}
              >
                Priya Banerjee (Class 1 - Dues ₹3,600)
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect("AVM-2026-0001", "9830100001")}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                  admissionNo === "AVM-2026-0001"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-foreground hover:bg-slate-200 border-slate-200 dark:border-slate-700"
                }`}
              >
                Aarav Ghosh (Class 5 - Dues ₹4,200)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Student Loaded Dashboard */}
        {studentData && (
          <div className="space-y-6">
            {/* Student Header & Key Metrics Card */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left: Student Profile Info */}
                <div className="md:col-span-7 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0">
                    {studentData.student.firstName[0]}
                    {studentData.student.lastName[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">
                        {studentData.student.firstName} {studentData.student.lastName}
                      </h2>
                      <Badge variant="secondary" className="font-semibold text-xs">
                        Class {studentData.student.class.name} • Section {studentData.student.section.name}
                      </Badge>
                      <Badge variant="default" className="text-xs">
                        Roll #{studentData.student.rollNo || "1"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground">
                      <span>Admission No: <strong className="text-foreground font-mono">{studentData.student.admissionNo}</strong></span>
                      <span>•</span>
                      <span>Guardian: <strong className="text-foreground">{studentData.student.guardianName}</strong></span>
                      <span>•</span>
                      <span>Mobile: <strong className="text-foreground font-mono">{formatPhone(studentData.student.guardianPhone)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Annual Payment Progress Meter */}
                <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Annual Fee Status ({studentData.student.session.code})</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{studentData.summary.paidPercent}% Paid</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${studentData.summary.paidPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Paid so far</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(studentData.summary.totalPaidPaise)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px]">Total Outstanding</span>
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatINR(studentData.summary.totalDuePaise)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Step 3: Tabbed Views (Pay Online, Past Receipts, Full Schedule) */}
            <Tabs defaultValue="pay" className="space-y-4">
              <TabsList className="grid grid-cols-3 w-full max-w-lg h-11 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                <TabsTrigger value="pay" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 shadow-xs">
                  <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                  <span>1. Pay Online ({studentData.installments.length})</span>
                </TabsTrigger>
                <TabsTrigger value="receipts" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 shadow-xs">
                  <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                  <span>2. Past Receipts ({studentData.receipts.length})</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs font-semibold gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 shadow-xs">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                  <span>3. Annual Schedule</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Pay Online Checkout */}
              <TabsContent value="pay" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Pending Installments Table (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                      <CardHeader className="py-3.5 px-4 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold">Select Installments to Pay</CardTitle>
                          <CardDescription className="text-xs">
                            Select one or more monthly fees to clear online.
                          </CardDescription>
                        </div>

                        {studentData.installments.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="select-all"
                              checked={
                                selectedInstallmentIds.length === studentData.installments.length &&
                                studentData.installments.length > 0
                              }
                              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                            />
                            <label htmlFor="select-all" className="text-xs font-semibold text-muted-foreground cursor-pointer">
                              Select All
                            </label>
                          </div>
                        )}
                      </CardHeader>

                      <CardContent className="p-0 overflow-x-auto">
                        {studentData.installments.length > 0 ? (
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="py-2.5 px-3 text-left w-10">Pay</th>
                                <th className="py-2.5 px-3 text-left font-semibold">Installment</th>
                                <th className="py-2.5 px-3 text-left font-semibold">Due Date</th>
                                <th className="py-2.5 px-3 text-right font-semibold">Fee (₹)</th>
                                <th className="py-2.5 px-3 text-right font-semibold">Fine (₹)</th>
                                <th className="py-2.5 px-3 text-right font-semibold">Total (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {studentData.installments.map((inst: any) => {
                                const isChecked = selectedInstallmentIds.includes(inst.id);

                                return (
                                  <tr
                                    key={inst.id}
                                    onClick={() => handleToggleInstallment(inst.id)}
                                    className={`cursor-pointer transition-colors ${
                                      isChecked
                                        ? "bg-blue-50/70 dark:bg-blue-950/30"
                                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    }`}
                                  >
                                    <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => handleToggleInstallment(inst.id)}
                                      />
                                    </td>
                                    <td className="py-3 px-3 font-semibold text-foreground">
                                      <div className="flex items-center gap-1.5">
                                        <span>{inst.title}</span>
                                        {inst.status === "OVERDUE" && (
                                          <Badge variant="overdue" className="text-[9px] px-1 py-0 font-bold">
                                            Overdue
                                          </Badge>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-3 font-mono text-muted-foreground">
                                      {formatDate(inst.dueDate)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                                      {formatINR(inst.pendingPrincipalPaise)}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                                      {inst.finePaise > 0 ? formatINR(inst.finePaise) : "-"}
                                    </td>
                                    <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                                      {formatINR(inst.totalDuePaise)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-12 text-center text-muted-foreground p-6">
                            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-emerald-600" />
                            <h3 className="font-bold text-base text-foreground">All Fees Fully Cleared!</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              There are no pending dues for {studentData.student.firstName}. Thank you for timely payments!
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Payment Summary Checkout Card (5 cols) */}
                  <div className="lg:col-span-5">
                    <Card className="border-2 border-blue-600/30 dark:border-blue-500/30 shadow-lg bg-white dark:bg-slate-900 sticky top-22">
                      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-transparent dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-transparent border-b border-slate-200 dark:border-slate-800">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-blue-600" />
                          <span>Online Payment Checkout</span>
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Review payable breakdown and proceed to secure checkout.
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-5 space-y-4 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Selected Installments:</span>
                          <span className="font-bold text-foreground">{selectedInstallmentIds.length} Month(s)</span>
                        </div>

                        <div className="flex justify-between text-muted-foreground">
                          <span>School Tuition Fee:</span>
                          <span className="font-mono font-bold text-foreground">
                            {formatINR(
                              studentData.installments
                                .filter((i: any) => selectedInstallmentIds.includes(i.id))
                                .reduce((sum: number, i: any) => sum + i.pendingPrincipalPaise, 0)
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-muted-foreground">
                          <span>Late Fine Surcharges:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                            {formatINR(
                              studentData.installments
                                .filter((i: any) => selectedInstallmentIds.includes(i.id))
                                .reduce((sum: number, i: any) => sum + i.finePaise, 0)
                            )}
                          </span>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex justify-between items-center">
                          <span className="text-sm font-bold text-foreground">Total Payable Amount:</span>
                          <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
                            {formatINR(payAmountPaise)}
                          </span>
                        </div>

                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                          <span>Supports UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & NetBanking. Instant digital receipt issued upon successful payment.</span>
                        </div>
                      </CardContent>

                      <CardFooter className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                        <Button
                          type="button"
                          disabled={payAmountPaise <= 0}
                          onClick={() => setShowGatewayModal(true)}
                          className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2 cursor-pointer"
                        >
                          <CreditCard className="h-5 w-5" />
                          <span>Pay {formatINR(payAmountPaise)} Now</span>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Past Payment Receipts */}
              <TabsContent value="receipts" className="space-y-4">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="py-4 px-5 border-b border-slate-200 dark:border-slate-800">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-emerald-600" />
                      <span>Past Fee Receipts & Payment History</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      View, print official PDF receipts, or share payment confirmation via WhatsApp.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0 overflow-x-auto">
                    {studentData.receipts.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-3 px-4 text-left font-semibold">Receipt No</th>
                            <th className="py-3 px-4 text-left font-semibold">Payment Date</th>
                            <th className="py-3 px-4 text-left font-semibold">Payment Mode</th>
                            <th className="py-3 px-4 text-left font-semibold">Allocated Months</th>
                            <th className="py-3 px-4 text-right font-semibold">Amount Paid</th>
                            <th className="py-3 px-4 text-center font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {studentData.receipts.map((r: any) => (
                            <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                {r.receiptNo}
                              </td>
                              <td className="py-3 px-4 font-mono text-muted-foreground">
                                {formatDate(r.paymentDate)}
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="secondary" className="font-semibold text-[10px]">
                                  {r.mode.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">
                                {r.allocations.map((a: any) => a.installment.monthName).join(", ") || "Tuition Fee"}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {formatINR(r.amountPaise)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewReceipt(r)}
                                  className="h-7 px-2.5 text-xs font-semibold gap-1.5"
                                >
                                  <Download className="h-3.5 w-3.5 text-blue-600" />
                                  <span>View & Print Receipt</span>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground p-6">
                        <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-sm">No payment receipts recorded yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Full Academic Year Schedule */}
              <TabsContent value="schedule" className="space-y-4">
                <Card className="border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
                  <CardHeader className="py-4 px-5 border-b border-slate-200 dark:border-slate-800">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      <span>Academic Year Installment Schedule (2026-27)</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Complete 10-installment payment roadmap from April 2026 to January 2027.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4 text-left font-semibold">#</th>
                          <th className="py-3 px-4 text-left font-semibold">Installment Month</th>
                          <th className="py-3 px-4 text-left font-semibold">Official Due Date</th>
                          <th className="py-3 px-4 text-right font-semibold">Installment Amount</th>
                          <th className="py-3 px-4 text-right font-semibold">Paid Amount</th>
                          <th className="py-3 px-4 text-right font-semibold">Balance Due</th>
                          <th className="py-3 px-4 text-center font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {studentData.allInstallments.map((inst: any) => {
                          const balance = Math.max(0, inst.amountPaise - inst.paidAmountPaise);

                          return (
                            <tr key={inst.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-3 px-4 font-mono text-muted-foreground">{inst.monthIndex}</td>
                              <td className="py-3 px-4 font-semibold text-foreground">{inst.title}</td>
                              <td className="py-3 px-4 font-mono text-muted-foreground">{formatDate(inst.dueDate)}</td>
                              <td className="py-3 px-4 text-right font-mono font-medium">{formatINR(inst.amountPaise)}</td>
                              <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                {formatINR(inst.paidAmountPaise)}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold">
                                {balance > 0 ? (
                                  <span className="text-rose-600 dark:text-rose-400">{formatINR(balance)}</span>
                                ) : (
                                  <span className="text-muted-foreground">₹0</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {inst.status === "PAID" ? (
                                  <Badge variant="success" className="text-[10px]">
                                    Paid
                                  </Badge>
                                ) : inst.status === "OVERDUE" ? (
                                  <Badge variant="overdue" className="text-[10px]">
                                    Overdue
                                  </Badge>
                                ) : inst.status === "PARTIAL" ? (
                                  <Badge variant="warning" className="text-[10px]">
                                    Partial
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Pending
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Razorpay Mock Checkout Modal */}
      {studentData && (
        <RazorpayMockModal
          isOpen={showGatewayModal}
          onClose={() => setShowGatewayModal(false)}
          amountPaise={payAmountPaise}
          studentName={`${studentData.student.firstName} ${studentData.student.lastName}`}
          admissionNo={studentData.student.admissionNo}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
