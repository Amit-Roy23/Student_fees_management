"use client";

import * as React from "react";
import { formatINR } from "@/lib/formatters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  CreditCard,
  Building2,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

export function RazorpayMockModal({
  isOpen,
  onClose,
  amountPaise,
  studentName,
  admissionNo,
  onPaymentSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  amountPaise: number;
  studentName: string;
  admissionNo: string;
  onPaymentSuccess: (method: "UPI" | "CARD" | "NETBANKING", txnId: string) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = React.useState<"UPI" | "CARD" | "NETBANKING">("UPI");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [selectedBank, setSelectedBank] = React.useState("SBI");

  const handleSimulatePayment = async (status: "SUCCESS" | "FAILURE") => {
    setIsProcessing(true);

    // Simulate realistic gateway network latency
    await new Promise((r) => setTimeout(r, 1200));

    if (status === "FAILURE") {
      setIsProcessing(false);
      toast.error("Simulated payment failed (Bank server timeout). Please try again.");
      return;
    }

    const fakeTxnId = `pay_razor_${Date.now().toString().slice(-8)}_${Math.floor(Math.random() * 8999 + 1000)}`;

    try {
      await onPaymentSuccess(activeTab, fakeTxnId);
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      toast.error(err.message || "Payment processing failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-2 border-indigo-500/30 shadow-2xl">
        {/* Mock Razorpay Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border-b border-indigo-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">Arohon Vidya Mandir</h3>
                <p className="text-[11px] text-indigo-300 mt-1">
                  Fee Payment for {studentName} ({admissionNo})
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase text-indigo-300 font-bold block">Amount Payable</span>
              <span className="text-lg font-black font-mono text-white">
                {formatINR(amountPaise)}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2 border-t border-indigo-900/60 text-[10px] text-indigo-300">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-emerald-400" />
              <span>256-bit Secure Gateway (Demo Mode)</span>
            </div>
            <Badge variant="outline" className="border-indigo-400 text-indigo-200 text-[9px] py-0">
              Razorpay / PayU Integration
            </Badge>
          </div>
        </div>

        {/* Tabbed Payment Methods */}
        <div className="p-5 space-y-4">
          <Tabs defaultValue="upi" onValueChange={(v) => setActiveTab(v.toUpperCase() as any)}>
            <TabsList className="grid grid-cols-3 w-full h-11 bg-muted/60">
              <TabsTrigger value="upi" className="text-xs font-semibold gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-blue-600" />
                <span>UPI / QR</span>
              </TabsTrigger>
              <TabsTrigger value="card" className="text-xs font-semibold gap-1.5">
                <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                <span>Card</span>
              </TabsTrigger>
              <TabsTrigger value="netbanking" className="text-xs font-semibold gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>NetBanking</span>
              </TabsTrigger>
            </TabsList>

            {/* 1. UPI Tab */}
            <TabsContent value="upi" className="space-y-4 pt-3">
              <div className="flex flex-col items-center justify-center p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 text-center">
                <div className="h-36 w-36 bg-white p-2 rounded-xl shadow-xs border flex items-center justify-center mb-2">
                  <div className="w-full h-full bg-slate-900 rounded-lg flex flex-col items-center justify-center text-white p-2">
                    <QrCode className="h-16 w-16 text-white" />
                    <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-400 mt-1">
                      Scan via GPay / Paytm
                    </span>
                  </div>
                </div>
                <p className="text-xs font-semibold text-foreground">Scan QR with any UPI App</p>
                <p className="text-[10px] text-muted-foreground">UPI ID: arohonfees@sbi</p>
              </div>
            </TabsContent>

            {/* 2. Card Tab */}
            <TabsContent value="card" className="space-y-3 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Card Number</label>
                <Input
                  placeholder="4532 •••• •••• 8921 (Visa / Mastercard / RuPay)"
                  defaultValue="4532 8901 2345 6789"
                  className="font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Valid Thru</label>
                  <Input placeholder="MM / YY" defaultValue="08/29" className="font-mono text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">CVV</label>
                  <Input placeholder="•••" defaultValue="892" type="password" className="font-mono text-xs" />
                </div>
              </div>
            </TabsContent>

            {/* 3. NetBanking Tab */}
            <TabsContent value="netbanking" className="space-y-3 pt-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Select Popular Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "SBI", name: "State Bank of India" },
                    { id: "HDFC", name: "HDFC Bank" },
                    { id: "ICICI", name: "ICICI Bank" },
                    { id: "AXIS", name: "Axis Bank" },
                  ].map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b.id)}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all ${
                        selectedBank === b.id
                          ? "bg-blue-50 dark:bg-blue-950 border-blue-600 text-blue-700 dark:text-blue-300"
                          : "bg-background hover:bg-muted"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Action Simulation Buttons */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              type="button"
              disabled={isProcessing}
              onClick={() => handleSimulatePayment("SUCCESS")}
              className="w-full h-11 font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Processing Payment via Gateway...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Pay {formatINR(amountPaise)} (Simulate Success)</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              disabled={isProcessing}
              variant="outline"
              onClick={() => handleSimulatePayment("FAILURE")}
              className="w-full h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Simulate Failure (Bank Timeout)
            </Button>
          </div>
        </div>

        <div className="p-3 bg-muted/40 border-t text-[10px] text-center text-muted-foreground">
          Demo Gateway • Instant digital receipt issued on success
        </div>
      </DialogContent>
    </Dialog>
  );
}
