"use client";

import * as React from "react";
import { searchStudentsForPayment, getStudentFeeCollectionData, collectFee } from "./actions";
import { formatINR, paiseToRupees, rupeesToPaise, formatDate } from "@/lib/formatters";
import { PaymentMode } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import {
  Search,
  User,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Sparkles,
  ArrowRight,
  RefreshCw,
  QrCode,
  Building,
} from "lucide-react";
import { toast } from "sonner";

export function CollectFeeClient({ initialStudentId }: { initialStudentId?: string }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const [selectedStudent, setSelectedStudent] = React.useState<any | null>(null);
  const [feeData, setFeeData] = React.useState<any | null>(null);
  const [loadingStudent, setLoadingStudent] = React.useState(false);

  // Payment Form State
  const [selectedInstallments, setSelectedInstallments] = React.useState<string[]>([]);
  const [paymentAmountRupees, setPaymentAmountRupees] = React.useState<string>("");
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>(PaymentMode.CASH);
  const [transactionRef, setTransactionRef] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Generated Receipt state
  const [activeReceipt, setActiveReceipt] = React.useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);

  // Auto-search effect with debounce
  React.useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchStudentsForPayment(searchQuery);
        setSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadStudentData = async (studentId: string) => {
    setLoadingStudent(true);
    try {
      const data = await getStudentFeeCollectionData(studentId);
      setSelectedStudent(data.student);
      setFeeData(data);
      setSearchResults([]);
      setSearchQuery("");

      // Default select overdue or pending installments
      const dueInsts = data.installments.filter(
        (i: any) => i.status === "OVERDUE" || (i.pendingPrincipalPaise > 0 && i.monthIndex <= 6)
      );
      const ids = dueInsts.map((i: any) => i.id);
      setSelectedInstallments(ids);

      // Compute total sum for selected
      const initialSumPaise = dueInsts.reduce((sum: number, i: any) => sum + i.totalDuePaise, 0);
      setPaymentAmountRupees(String(paiseToRupees(initialSumPaise > 0 ? initialSumPaise : data.totals.grandTotalDuePaise)));
    } catch (err: any) {
      toast.error(err.message || "Failed to load student fee records");
    } finally {
      setLoadingStudent(false);
    }
  };

  React.useEffect(() => {
    if (initialStudentId) {
      loadStudentData(initialStudentId);
    }
  }, [initialStudentId]);

  const handleToggleInstallment = (id: string) => {
    const isSelected = selectedInstallments.includes(id);
    let newSelected: string[];
    if (isSelected) {
      newSelected = selectedInstallments.filter((x) => x !== id);
    } else {
      newSelected = [...selectedInstallments, id];
    }
    setSelectedInstallments(newSelected);

    // Update payment amount to match total of checked installments
    if (feeData) {
      const total = feeData.installments
        .filter((i: any) => newSelected.includes(i.id))
        .reduce((sum: number, i: any) => sum + i.totalDuePaise, 0);
      setPaymentAmountRupees(String(paiseToRupees(total)));
    }
  };

  const handleSelectAllDue = () => {
    if (!feeData) return;
    const dueInsts = feeData.installments.filter((i: any) => i.pendingPrincipalPaise > 0);
    const ids = dueInsts.map((i: any) => i.id);
    setSelectedInstallments(ids);
    const total = dueInsts.reduce((sum: number, i: any) => sum + i.totalDuePaise, 0);
    setPaymentAmountRupees(String(paiseToRupees(total)));
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const amountPaise = rupeesToPaise(paymentAmountRupees);
    if (amountPaise <= 0) {
      toast.error("Please enter a valid payment amount greater than zero");
      return;
    }

    if (paymentMode !== PaymentMode.CASH && !transactionRef.trim()) {
      toast.error(`Please provide Transaction Reference / UTR for ${paymentMode}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await collectFee({
        studentId: selectedStudent.id,
        amountPaise,
        mode: paymentMode,
        transactionRef,
        bankName,
        paymentDate,
        remarks: remarks || `Fee payment collected via ${paymentMode}`,
        selectedInstallmentIds: selectedInstallments,
      });

      toast.success(`Fee collected successfully! Receipt #${res.receiptNo} generated.`);

      // Build receipt modal payload
      const receiptPayload: ReceiptData = {
        id: res.paymentId,
        receiptNo: res.receiptNo,
        paymentDate: new Date(paymentDate),
        amountPaise,
        mode: paymentMode,
        transactionRef: transactionRef || null,
        bankName: bankName || null,
        remarks,
        student: {
          admissionNo: selectedStudent.admissionNo,
          rollNo: selectedStudent.rollNo,
          firstName: selectedStudent.firstName,
          lastName: selectedStudent.lastName,
          guardianName: selectedStudent.guardianName,
          guardianPhone: selectedStudent.guardianPhone,
          class: { name: selectedStudent.class.name },
          section: { name: selectedStudent.section.name },
        },
        session: {
          code: selectedStudent.session.code,
          name: selectedStudent.session.name,
        },
        collectedBy: {
          name: "Subhashis Roy (Sr. Accountant)",
          role: "ACCOUNTANT",
        },
        allocations: feeData.installments
          .filter((i: any) => selectedInstallments.includes(i.id))
          .map((i: any) => ({
            amountPaise: i.pendingPrincipalPaise,
            finePaidPaise: i.finePaise,
            installment: {
              title: i.title,
              monthName: i.monthName,
            },
          })),
      };

      setActiveReceipt(receiptPayload);
      setShowReceiptModal(true);

      // Reload student data
      loadStudentData(selectedStudent.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Collect Fee</h1>
            <Badge variant="success" className="font-bold">Fast Cash / Online Counter</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Search student, select pending month-wise installments, and issue instant receipts.
          </p>
        </div>

        {selectedStudent && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStudent(null);
              setFeeData(null);
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Search Another Student</span>
          </Button>
        )}
      </div>

      {/* Step 1: Student Search Bar */}
      {!selectedStudent && (
        <Card className="border shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Find Student by Name, Admission No, or Phone</span>
            </CardTitle>
            <CardDescription>
              Type at least 2 characters to search across all classes in the current session.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="e.g. Sourav, AVM-2026-0012, or 98300..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base shadow-xs"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3.5 top-3.5 text-xs text-muted-foreground flex items-center gap-1.5">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Searching...</span>
                </div>
              )}
            </div>

            {/* Quick Demo Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Quick test students:</span>
              <button
                type="button"
                onClick={() => setSearchQuery("AVM-2026-0004")}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent border text-foreground font-mono cursor-pointer transition-colors"
              >
                AVM-2026-0004 (Overdue with fine)
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery("Sourav")}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent border text-foreground font-mono cursor-pointer transition-colors"
              >
                Sourav (Search by name)
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery("Ananya")}
                className="px-2.5 py-1 rounded-md bg-muted hover:bg-accent border text-foreground font-mono cursor-pointer transition-colors"
              >
                Ananya (Multiple matches)
              </button>
            </div>

            {/* Search Results Dropdown List */}
            {searchResults.length > 0 && (
              <div className="border rounded-xl divide-y overflow-hidden shadow-sm bg-card mt-3">
                <div className="px-4 py-2 bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Found {searchResults.length} Students
                </div>
                {searchResults.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => loadStudentData(s.id)}
                    className="p-4 hover:bg-accent/60 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                        {s.name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{s.name}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {s.admissionNo}
                          </Badge>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {s.className}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Guardian: {s.guardianName} • Ph: {s.guardianPhone}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Total Pending</div>
                        <div className="font-bold text-sm font-mono text-rose-600 dark:text-rose-400">
                          {formatINR(s.pendingTotalPaise)}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Student Fee Ledger & Payment Collection Form */}
      {selectedStudent && feeData && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Student Summary & Installments Schedule (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Student Info Card */}
            <Card className="border shadow-sm bg-card">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
                      {selectedStudent.firstName[0]}
                      {selectedStudent.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-foreground">
                          {selectedStudent.firstName} {selectedStudent.lastName}
                        </h2>
                        <Badge variant="outline" className="font-mono font-bold">
                          {selectedStudent.admissionNo}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Class {selectedStudent.class.name} • Section {selectedStudent.section.name} • Roll #{selectedStudent.rollNo || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Guardian: {selectedStudent.guardianName} ({selectedStudent.guardianPhone})
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0">
                    <span className="text-xs text-muted-foreground">Total Due Balance</span>
                    <span className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
                      {formatINR(feeData.totals.grandTotalDuePaise)}
                    </span>
                    {feeData.totals.fineDuePaise > 0 && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        (Includes {formatINR(feeData.totals.fineDuePaise)} late fine)
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Installments Table Card */}
            <Card className="border shadow-sm">
              <CardHeader className="py-4 px-5 flex flex-row items-center justify-between border-b">
                <div>
                  <CardTitle className="text-base">Month-Wise Fee Installments</CardTitle>
                  <CardDescription className="text-xs">
                    Select the installments you want to collect payment for:
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAllDue} className="text-xs h-8">
                  Select All Due
                </Button>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="py-2.5 px-3 text-left w-10">Pay</th>
                      <th className="py-2.5 px-3 text-left">Installment / Month</th>
                      <th className="py-2.5 px-3 text-left">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Fee (₹)</th>
                      <th className="py-2.5 px-3 text-right">Fine (₹)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {feeData.installments.map((inst: any) => {
                      const isChecked = selectedInstallments.includes(inst.id);
                      const isPaid = inst.status === "PAID";
                      const isOverdue = inst.status === "OVERDUE" || inst.daysOverdue > 0;

                      return (
                        <tr
                          key={inst.id}
                          className={`hover:bg-muted/40 transition-colors ${
                            isChecked ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                          }`}
                        >
                          <td className="py-3 px-3">
                            <Checkbox
                              checked={isChecked}
                              disabled={isPaid}
                              onCheckedChange={() => handleToggleInstallment(inst.id)}
                            />
                          </td>
                          <td className="py-3 px-3 font-semibold text-foreground">
                            {inst.title}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground font-mono">
                            {formatDate(inst.dueDate)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium">
                            {formatINR(inst.amountPaise)}
                            {inst.paidAmountPaise > 0 && !isPaid && (
                              <div className="text-[10px] text-emerald-600">
                                Paid: {formatINR(inst.paidAmountPaise)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono">
                            {inst.finePaise > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                {formatINR(inst.finePaise)}
                                <span className="block text-[9px] text-muted-foreground">
                                  ({inst.daysOverdue}d late)
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {isPaid ? (
                              <Badge variant="success" className="text-[10px]">
                                Paid
                              </Badge>
                            ) : isOverdue ? (
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
          </div>

          {/* Right Column: Payment Entry Form (5 cols) */}
          <div className="lg:col-span-5">
            <Card className="border shadow-lg sticky top-20">
              <CardHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Record Fee Payment</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Generates sequential receipt & posts entry to Cash/Bank Book.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmitPayment}>
                <CardContent className="p-5 space-y-4">
                  {/* Amount Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center justify-between">
                      <span>Payment Amount (₹ INR)</span>
                      <span className="text-[11px] text-muted-foreground">
                        {selectedInstallments.length} installment(s) selected
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-base font-bold text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        required
                        value={paymentAmountRupees}
                        onChange={(e) => setPaymentAmountRupees(e.target.value)}
                        className="pl-8 h-11 text-lg font-bold font-mono text-foreground"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Payment Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Payment Mode</label>
                    <Select
                      value={paymentMode}
                      onValueChange={(val: PaymentMode) => setPaymentMode(val)}
                    >
                      <SelectTrigger className="h-10 text-sm font-medium">
                        <SelectValue placeholder="Select Payment Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMode.CASH}>
                          💵 Cash (Auto-posts to Cash Book)
                        </SelectItem>
                        <SelectItem value={PaymentMode.UPI}>
                          📱 UPI / QR Code (GPay / PhonePe / Paytm)
                        </SelectItem>
                        <SelectItem value={PaymentMode.BANK_TRANSFER}>
                          🏛️ Bank Transfer (NEFT / RTGS / IMPS)
                        </SelectItem>
                        <SelectItem value={PaymentMode.CHEQUE}>
                          📄 Cheque / Demand Draft
                        </SelectItem>
                        <SelectItem value={PaymentMode.ONLINE_GATEWAY}>
                          🌐 Online Portal / Gateway
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Transaction Ref / UTR for Non-Cash */}
                  {paymentMode !== PaymentMode.CASH && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>Transaction Ref / UTR / Cheque No *</span>
                        <Badge variant="warning" className="text-[10px]">Required</Badge>
                      </label>
                      <Input
                        required
                        placeholder="e.g. UPI48291039482 or CHQ-00129"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="h-10 text-sm font-mono"
                      />
                    </div>
                  )}

                  {/* Bank Name if Cheque or Bank Transfer */}
                  {(paymentMode === PaymentMode.BANK_TRANSFER || paymentMode === PaymentMode.CHEQUE) && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-foreground">Bank Name & Branch</label>
                      <Input
                        placeholder="e.g. State Bank of India, Salt Lake"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="h-10 text-sm"
                      />
                    </div>
                  )}

                  {/* Payment Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Collection Date</label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Remarks / Note (Optional)</label>
                    <Input
                      placeholder="e.g. Paid by father at fee counter"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="h-10 text-sm"
                    />
                  </div>
                </CardContent>

                <CardFooter className="p-5 border-t bg-muted/30 flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={submitting}
                    variant="success"
                    className="w-full h-11 text-base font-bold gap-2 shadow-md"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Recording Payment...</span>
                      </>
                    ) : (
                      <>
                        <Receipt className="h-5 w-5" />
                        <span>Collect {formatINR(rupeesToPaise(paymentAmountRupees))} & Issue Receipt</span>
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground">
                    Receipt is numbered automatically per session and immediately available for print/PDF.
                  </p>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Instant Receipt View & Print Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
