"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDate, formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { toast } from "sonner";

export function ParentPayClient() {
  const [admissionNo, setAdmissionNo] = React.useState("AVM-2026-0004");
  const [phone, setPhone] = React.useState("9830100004");
  const [isSearching, setIsSearching] = React.useState(false);

  const [studentData, setStudentData] = React.useState<any | null>(null);
  const [selectedInstallmentIds, setSelectedInstallmentIds] = React.useState<string[]>([]);
  const [payAmountPaise, setPayAmountPaise] = React.useState<number>(0);

  // Gateway Modal & Receipt Modal
  const [showGatewayModal, setShowGatewayModal] = React.useState(false);
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [activeReceipt, setActiveReceipt] = React.useState<ReceiptData | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);

    try {
      const data = await searchParentStudent(admissionNo, phone);
      setStudentData(data);
      // Auto select all pending installments
      const ids = data.installments.map((i: any) => i.id);
      setSelectedInstallmentIds(ids);
      setPayAmountPaise(data.totalDuePaise);
      toast.success(`Found student record for ${data.student.firstName} ${data.student.lastName}`);
    } catch (err: any) {
      toast.error(err.message || "No student record found");
    } finally {
      setIsSearching(false);
    }
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
      remarks: "Parent Online Fee Payment",
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
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-radial from-blue-900/10 via-background to-background p-4 md:p-8">
      {/* Top Header */}
      <header className="mx-auto max-w-4xl flex items-center justify-between pb-8 border-b mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Arohon Vidya Mandir • <span className="text-blue-600">Parent Fee Portal</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Official 24x7 online fee payment counter for parents & guardians.
            </p>
          </div>
        </div>

        <Link href="/login">
          <Button variant="ghost" size="sm" className="text-xs">
            Staff Sign In →
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-4xl space-y-6">
        {/* Step 1: Student Lookup Card */}
        <Card className="border shadow-md bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Enter Student Details to View Fee Dues</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Enter your child's Admission Number and registered WhatsApp / mobile number.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-foreground">Admission Number</label>
                <Input
                  required
                  placeholder="e.g. AVM-2026-0004"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  className="font-mono h-10 text-sm"
                />
              </div>

              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-foreground">Registered Mobile Number</label>
                <Input
                  required
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="font-mono h-10 text-sm"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="w-full h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span>Search</span>
                </Button>
              </div>
            </form>

            {/* Demo Quick Fills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Demo Test Students:</span>
              <button
                type="button"
                onClick={() => {
                  setAdmissionNo("AVM-2026-0004");
                  setPhone("9830100004");
                }}
                className="px-2.5 py-1 rounded bg-muted hover:bg-accent border font-mono cursor-pointer"
              >
                AVM-2026-0004 (Overdue with Fine)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdmissionNo("AVM-2026-0002");
                  setPhone("9830100002");
                }}
                className="px-2.5 py-1 rounded bg-muted hover:bg-accent border font-mono cursor-pointer"
              >
                AVM-2026-0002 (Class 1 Student)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Student Fee Ledger & Payment Checkout */}
        {studentData && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Details & Dues (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="border shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      {studentData.student.firstName} {studentData.student.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Class {studentData.student.class.name} • Section {studentData.student.section.name} (Adm: {studentData.student.admissionNo})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Guardian: {studentData.student.guardianName} ({formatPhone(studentData.student.guardianPhone)})
                    </p>
                  </div>
                  <Badge variant="default" className="text-xs">
                    Session {studentData.student.session.code}
                  </Badge>
                </div>
              </Card>

              {/* Installments Table */}
              <Card className="border shadow-sm">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-sm">Pending Monthly Installments</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="py-2 px-3 text-left w-8">Pay</th>
                        <th className="py-2 px-3 text-left">Installment</th>
                        <th className="py-2 px-3 text-left">Due Date</th>
                        <th className="py-2 px-3 text-right">Fee (₹)</th>
                        <th className="py-2 px-3 text-right">Fine (₹)</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {studentData.installments.map((inst: any) => {
                        const isChecked = selectedInstallmentIds.includes(inst.id);

                        return (
                          <tr key={inst.id} className="hover:bg-muted/30">
                            <td className="py-2.5 px-3">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => handleToggleInstallment(inst.id)}
                              />
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {inst.title}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-muted-foreground">
                              {formatDate(inst.dueDate)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {formatINR(inst.pendingPrincipalPaise)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-amber-600 font-bold">
                              {inst.finePaise > 0 ? formatINR(inst.finePaise) : "-"}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                              {formatINR(inst.totalDuePaise)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary Box (5 cols) */}
            <div className="lg:col-span-5">
              <Card className="border-2 border-blue-600/30 shadow-xl sticky top-6">
                <CardHeader className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span>Payment Summary</span>
                  </CardTitle>
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
                    <span>Late Fine Charges:</span>
                    <span className="font-mono font-bold text-amber-600">
                      {formatINR(
                        studentData.installments
                          .filter((i: any) => selectedInstallmentIds.includes(i.id))
                          .reduce((sum: number, i: any) => sum + i.finePaise, 0)
                      )}
                    </span>
                  </div>

                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">Total Payable Amount:</span>
                    <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                      {formatINR(payAmountPaise)}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 text-[11px] text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                    <span>Protected by 256-bit SSL encryption. Official receipt generated instantly upon successful payment.</span>
                  </div>
                </CardContent>

                <CardFooter className="p-5 border-t bg-muted/20">
                  <Button
                    type="button"
                    disabled={payAmountPaise <= 0}
                    onClick={() => setShowGatewayModal(true)}
                    className="w-full h-12 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg gap-2"
                  >
                    <CreditCard className="h-5 w-5" />
                    <span>Pay {formatINR(payAmountPaise)} Now</span>
                  </Button>
                </CardFooter>
              </Card>
            </div>
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
