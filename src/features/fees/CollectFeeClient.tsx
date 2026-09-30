"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { searchStudentsForPayment, getStudentFeeCollectionData, collectFee } from "./actions";
import { formatINR, paiseToRupees, rupeesToPaise, formatDate } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { PaymentMode } from "@prisma/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ReceiptModal, ReceiptData } from "@/components/receipt/ReceiptModal";
import {
  Search,
  User,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export function CollectFeeClient({ initialStudentId }: { initialStudentId?: string }) {
  const { data: session } = useSession();
  const { t } = useI18n();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const [selectedStudent, setSelectedStudent] = React.useState<any | null>(null);
  const [feeData, setFeeData] = React.useState<any | null>(null);
  const [loadingStudent, setLoadingStudent] = React.useState(false);

  // Form state
  const [selectedInstallments, setSelectedInstallments] = React.useState<string[]>([]);
  const [paymentAmountRupees, setPaymentAmountRupees] = React.useState<string>("");
  const [paymentMode, setPaymentMode] = React.useState<PaymentMode>(PaymentMode.CASH);
  const [txnRef, setTxnRef] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Generated receipt
  const [activeReceipt, setActiveReceipt] = React.useState<ReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);

  // Search effect
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

      const dueInsts = data.installments.filter((i: any) => i.pendingPrincipalPaise > 0);
      const firstDue = dueInsts.slice(0, 1);
      const ids = firstDue.map((i: any) => i.id);
      setSelectedInstallments(ids);

      const totalPaise = firstDue.reduce((sum: number, i: any) => sum + i.totalDuePaise, 0);
      setPaymentAmountRupees(String(paiseToRupees(totalPaise > 0 ? totalPaise : data.totals.grandTotalDuePaise)));
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
      toast.error("Please enter a valid payment amount");
      return;
    }

    if (paymentMode === PaymentMode.ONLINE && !txnRef.trim()) {
      toast.error(t.collectFee.txnRefRequired);
      return;
    }

    setSubmitting(true);
    try {
      const res = await collectFee({
        studentId: selectedStudent.id,
        amountPaise,
        mode: paymentMode,
        txnRef: txnRef.trim(),
        paymentDate,
        remarks: remarks.trim(),
      });

      toast.success(`${t.collectFee.successToast} (Receipt #${res.receiptNo})`);

      if (res.receipt) {
        setActiveReceipt(res.receipt as ReceiptData);
        setShowReceiptModal(true);
      }

      await loadStudentData(selectedStudent.id);
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.collectFee.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.collectFee.subtitle}
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
            className="gap-2 text-xs border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Search Another Student</span>
          </Button>
        )}
      </div>

      {/* Step 1: Student Search */}
      {!selectedStudent ? (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.collectFee.searchStudent}
            </CardTitle>
            <CardDescription className="text-xs">
              {t.collectFee.searchHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="e.g. 'Aarav', 'AVM-2026-001', or '98300'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm border-slate-300 dark:border-slate-700"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3.5 top-3 text-xs text-slate-400">Searching...</div>
              )}
            </div>

            {/* Search Results List */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {searchResults.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => loadStudentData(st.id)}
                    className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                        {st.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{st.name}</span>
                          <Badge variant="outline" className="text-xs font-mono">{st.admissionNo}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {st.className} • Guardian: {st.guardianName} ({st.guardianPhone})
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {st.pendingTotalPaise > 0 ? (
                        <div>
                          <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                            {formatINR(st.pendingTotalPaise)}
                          </span>
                          <p className="text-[11px] text-slate-400">pending due</p>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                          {t.status.paid}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-slate-500 text-center py-6">
                No students found matching "{searchQuery}".
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Step 2: Student Fee Ledger & Payment Entry */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Details & Pending Installments */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-12 w-12 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm">
                    {selectedStudent.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedStudent.name}</h2>
                      <Badge variant="outline" className="font-mono text-xs">{selectedStudent.admissionNo}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedStudent.class?.name} • Guardian: {selectedStudent.guardianName} ({selectedStudent.guardianPhone})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.students.totalDue}</p>
                  <p className="text-xl font-bold text-blue-900 dark:text-blue-400 font-mono">
                    {formatINR(feeData?.totals?.grandTotalDuePaise || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Installments Table */}
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="py-4 px-5 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {t.collectFee.selectInstallments}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={handleSelectAllDue} className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  {t.collectFee.selectAllDue}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 w-8"></th>
                        <th className="py-2.5 px-3">{t.students.month}</th>
                        <th className="py-2.5 px-3">{t.students.dueDate}</th>
                        <th className="py-2.5 px-3 text-right">{t.students.admissionFee}</th>
                        <th className="py-2.5 px-3 text-right">{t.students.paidAmount}</th>
                        <th className="py-2.5 px-3 text-right">{t.students.fineAmount}</th>
                        <th className="py-2.5 px-3 text-right">{t.common.amount}</th>
                        <th className="py-2.5 px-3 text-center">{t.common.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {feeData?.installments?.map((inst: any) => {
                        const isPending = inst.pendingPrincipalPaise > 0;
                        const isSelected = selectedInstallments.includes(inst.id);

                        return (
                          <tr
                            key={inst.id}
                            className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                              isSelected ? "bg-blue-50/50 dark:bg-blue-950/30" : ""
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              {isPending && (
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleToggleInstallment(inst.id)}
                                />
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{inst.title}</td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">{formatDate(inst.dueDate)}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatINR(inst.amountPaise)}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                              {inst.paidAmountPaise > 0 ? formatINR(inst.paidAmountPaise) : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                              {inst.finePaise > 0 ? formatINR(inst.finePaise) : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              {inst.totalDuePaise > 0 ? formatINR(inst.totalDuePaise) : "₹0"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {inst.status === "PAID" && (
                                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px]">
                                  {t.status.paid}
                                </Badge>
                              )}
                              {inst.status === "OVERDUE" && (
                                <Badge variant="destructive" className="text-[10px]">
                                  {t.status.overdue}
                                </Badge>
                              )}
                              {inst.status === "PARTIAL" && (
                                <Badge variant="outline" className="text-amber-700 border-amber-300 text-[10px]">
                                  {t.status.partial}
                                </Badge>
                              )}
                              {inst.status === "PENDING" && (
                                <Badge variant="outline" className="text-slate-500 text-[10px]">
                                  {t.status.pending}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Payment Form */}
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.collectFee.amountToCollect}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  {/* Amount Field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.collectFee.amountToCollect}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={paymentAmountRupees}
                        onChange={(e) => setPaymentAmountRupees(e.target.value)}
                        className="pl-8 font-mono text-base font-bold text-blue-900 dark:text-blue-400 border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.collectFee.paymentMode}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={paymentMode === PaymentMode.CASH ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaymentMode(PaymentMode.CASH)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Banknote className="h-4 w-4" />
                        <span>{t.collectFee.modeCash}</span>
                      </Button>
                      <Button
                        type="button"
                        variant={paymentMode === PaymentMode.ONLINE ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaymentMode(PaymentMode.ONLINE)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>{t.collectFee.modeOnline}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Mode-Specific Field */}
                  {paymentMode === PaymentMode.ONLINE ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Transaction ID / UTR</span>
                        <span className="text-rose-500 font-normal">*Required</span>
                      </label>
                      <Input
                        required
                        placeholder="e.g. UPI Ref # 428901847291"
                        value={txnRef}
                        onChange={(e) => setTxnRef(e.target.value)}
                        className="text-xs border-slate-300 dark:border-slate-700 font-mono"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t.collectFee.cashNoteOptional}
                      </label>
                      <Input
                        placeholder="e.g. Counter deposit"
                        value={txnRef}
                        onChange={(e) => setTxnRef(e.target.value)}
                        className="text-xs border-slate-300 dark:border-slate-700"
                      />
                    </div>
                  )}

                  {/* Payment Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.common.date}</label>
                    <Input
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="text-xs border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.collectFee.remarks}
                    </label>
                    <Input
                      placeholder="e.g. Installment fee payment"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="text-xs border-slate-300 dark:border-slate-700"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={submitting || !paymentAmountRupees || Number(paymentAmountRupees) <= 0}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold h-11 mt-2 text-xs"
                  >
                    {submitting ? t.common.loading : `${t.collectFee.collectAndPrint} (₹${paymentAmountRupees || "0"})`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
}
