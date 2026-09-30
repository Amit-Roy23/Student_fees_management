"use client";

import * as React from "react";
import { useI18n } from "@/lib/i18n";
import { formatINR, formatDate } from "@/lib/formatters";
import {
  getChildInstallments,
  createParentOrder,
  verifyAndRecordParentPayment,
  recordFailedParentOrder,
} from "./actions";
import { RazorpayMockModal } from "./RazorpayMockModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  ShieldCheck,
  Calendar,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export function ParentPayClient({
  childrenList,
  initialStudentId,
}: {
  childrenList: { id: string; name: string; className: string }[];
  initialStudentId?: string;
}) {
  const { t } = useI18n();

  const [selectedChildId, setSelectedChildId] = React.useState<string>(
    initialStudentId || childrenList[0]?.id || ""
  );
  const [studentData, setStudentData] = React.useState<any | null>(null);
  const [installments, setInstallments] = React.useState<any[]>([]);
  const [selectedInstallmentIds, setSelectedInstallmentIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Gateway Modal State
  const [showRazorpayModal, setShowRazorpayModal] = React.useState(false);
  const [activeOrder, setActiveOrder] = React.useState<any | null>(null);
  const [creatingOrder, setCreatingOrder] = React.useState(false);

  // Payment Outcome States
  const [paymentSuccessData, setPaymentSuccessData] = React.useState<{
    paymentId: string;
    receiptNo: string;
  } | null>(null);
  const [paymentFailedError, setPaymentFailedError] = React.useState<string | null>(null);

  const loadInstallments = async (childId: string) => {
    if (!childId) return;
    setLoading(true);
    setPaymentSuccessData(null);
    setPaymentFailedError(null);
    try {
      const data = await getChildInstallments(childId);
      setStudentData(data.student);
      setInstallments(data.installments);

      // Default select first overdue or first payable installment
      const payableInsts = data.installments.filter((i) => i.isPayable);
      const overdueInsts = payableInsts.filter((i) => i.status === "OVERDUE");
      const defaultToSelect = overdueInsts.length > 0 ? overdueInsts : payableInsts.slice(0, 1);
      setSelectedInstallmentIds(defaultToSelect.map((i) => i.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to load child installments");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedChildId) {
      loadInstallments(selectedChildId);
    }
  }, [selectedChildId]);

  const handleToggleInstallment = (id: string) => {
    if (selectedInstallmentIds.includes(id)) {
      setSelectedInstallmentIds(selectedInstallmentIds.filter((x) => x !== id));
    } else {
      setSelectedInstallmentIds([...selectedInstallmentIds, id]);
    }
  };

  const handleSelectAllDue = () => {
    const payableIds = installments.filter((i) => i.isPayable).map((i) => i.id);
    setSelectedInstallmentIds(payableIds);
  };

  const selectedTotalPaise = installments
    .filter((i) => selectedInstallmentIds.includes(i.id))
    .reduce((sum, i) => sum + i.totalDuePaise, 0);

  const handleInitiatePayment = async () => {
    if (selectedInstallmentIds.length === 0) {
      toast.error(t.parent.selectInstallmentsToPay);
      return;
    }

    setCreatingOrder(true);
    try {
      const order = await createParentOrder({
        studentId: selectedChildId,
        installmentIds: selectedInstallmentIds,
      });

      setActiveOrder(order);
      setShowRazorpayModal(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = async (result: any) => {
    try {
      const res = await verifyAndRecordParentPayment(result);
      setShowRazorpayModal(false);
      setPaymentSuccessData({
        paymentId: res.paymentId,
        receiptNo: res.receiptNo,
      });
      toast.success(t.parent.paymentSuccessTitle);
      // Refresh installments
      await loadInstallments(selectedChildId);
    } catch (err: any) {
      toast.error(err.message || "Payment verification failed");
    }
  };

  const handlePaymentFailure = async (orderId: string, reason: string) => {
    await recordFailedParentOrder(orderId);
    setShowRazorpayModal(false);
    setPaymentFailedError(reason || t.parent.paymentFailedDesc);
  };

  return (
    <div className="space-y-6">
      {/* Header & Child Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.parent.payOnline}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.parent.selectInstallmentsToPay}
          </p>
        </div>

        {childrenList.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t.parent.selectChild}:
            </span>
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[200px] h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                {childrenList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.className})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Success View */}
      {paymentSuccessData && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
          <CardContent className="p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-950 dark:text-emerald-100">
                {t.parent.paymentSuccessTitle}
              </h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                {t.parent.paymentSuccessDesc} (Receipt #{paymentSuccessData.receiptNo})
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={`/api/receipts/${paymentSuccessData.paymentId}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2">
                  <Download className="h-4 w-4" />
                  <span>{t.common.downloadBill}</span>
                </Button>
              </a>

              <Button
                variant="outline"
                onClick={() => setPaymentSuccessData(null)}
                className="border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              >
                Pay Another Installment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failure View */}
      {paymentFailedError && (
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm">
          <CardContent className="p-6 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-rose-950 dark:text-rose-100">
                {t.parent.paymentFailedTitle}
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                {paymentFailedError}
              </p>
            </div>

            <Button
              onClick={() => setPaymentFailedError(null)}
              className="bg-rose-700 hover:bg-rose-800 text-white font-bold gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.parent.tryAgain}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Installment Selection & Payment Card */}
      {!paymentSuccessData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Installment List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {studentData?.name} ({studentData?.className})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t.students.installmentSchedule}
                  </CardDescription>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllDue}
                  className="text-xs text-blue-700 dark:text-blue-400 font-bold"
                >
                  {t.collectFee.selectAllDue}
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 w-8"></th>
                        <th className="py-2.5 px-3">{t.students.month}</th>
                        <th className="py-2.5 px-3">{t.students.dueDate}</th>
                        <th className="py-2.5 px-3 text-right">{t.students.paidAmount}</th>
                        <th className="py-2.5 px-3 text-right">{t.students.fineAmount}</th>
                        <th className="py-2.5 px-3 text-right">{t.common.amount}</th>
                        <th className="py-2.5 px-3 text-center">{t.common.status}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {installments.map((inst) => {
                        const isSelected = selectedInstallmentIds.includes(inst.id);

                        return (
                          <tr
                            key={inst.id}
                            className={`transition-colors ${
                              !inst.isPayable
                                ? "opacity-60 bg-slate-50/40 dark:bg-slate-900/40"
                                : isSelected
                                ? "bg-blue-50/50 dark:bg-blue-950/30"
                                : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <Checkbox
                                checked={isSelected}
                                disabled={!inst.isPayable}
                                onCheckedChange={() => handleToggleInstallment(inst.id)}
                              />
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">
                              {inst.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono">
                              {formatDate(inst.dueDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                              {formatINR(inst.amountPaise)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                              {inst.finePaise > 0 ? formatINR(inst.finePaise) : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                              {formatINR(inst.totalDuePaise)}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {inst.status === "PAID" && (
                                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px]">
                                  {t.status.paid}
                                </Badge>
                              )}
                              {inst.status === "OVERDUE" && (
                                <Badge variant="destructive" className="text-[10px] font-bold">
                                  {inst.daysOverdue}d {t.status.overdue}
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

          {/* Right Col: Payment Checkout Summary */}
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Payment Summary
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedInstallmentIds.length} installment{selectedInstallmentIds.length > 1 ? "s" : ""} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Student:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{studentData?.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Selected Months:</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-right">
                      {installments
                        .filter((i) => selectedInstallmentIds.includes(i.id))
                        .map((i) => i.monthName)
                        .join(", ") || "-"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      {t.parent.payableTotal}:
                    </span>
                    <span className="text-2xl font-black text-blue-900 dark:text-blue-400 font-mono">
                      {formatINR(selectedTotalPaise)}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleInitiatePayment}
                  disabled={creatingOrder || selectedTotalPaise <= 0}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold h-11 text-xs gap-2 shadow-xs"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{creatingOrder ? "Initializing..." : `${t.parent.payNow} (${formatINR(selectedTotalPaise)})`}</span>
                </Button>

                <div className="text-center">
                  <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Razorpay 256-bit Encrypted Demo Gateway</span>
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Razorpay Mock Modal */}
      <RazorpayMockModal
        isOpen={showRazorpayModal}
        onClose={() => setShowRazorpayModal(false)}
        orderData={activeOrder}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />
    </div>
  );
}
