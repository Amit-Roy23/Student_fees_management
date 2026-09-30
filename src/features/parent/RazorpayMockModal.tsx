"use client";

import * as React from "react";
import { formatINR } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { SCHOOL_NAME } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  Smartphone,
  Landmark,
} from "lucide-react";

export interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    amountPaise: number;
    studentName: string;
  } | null;
  onPaymentSuccess: (result: {
    orderId: string;
    paymentId: string;
    signature: string;
    method: "UPI" | "NETBANKING" | "CARD" | "BANK_TRANSFER";
    txnRef: string;
    bankDetails?: { utr: string; transferDate: string };
  }) => Promise<void>;
  onPaymentFailure: (orderId: string, reason: string) => Promise<void>;
}

export function RazorpayMockModal({
  isOpen,
  onClose,
  orderData,
  onPaymentSuccess,
  onPaymentFailure,
}: RazorpayModalProps) {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = React.useState<"UPI" | "NETBANKING" | "CARD" | "BANK_TRANSFER">("UPI");
  const [processing, setProcessing] = React.useState(false);
  const [upiId, setUpiId] = React.useState("parent@okaxis");
  const [selectedBank, setSelectedBank] = React.useState("HDFC Bank");
  const [cardNumber, setCardNumber] = React.useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = React.useState("12/28");
  const [cardCvv, setCardCvv] = React.useState("123");
  const [bankUtr, setBankUtr] = React.useState("UTR" + Math.floor(1000000000 + Math.random() * 9000000000));
  const [transferDate, setTransferDate] = React.useState(new Date().toISOString().split("T")[0]);

  if (!orderData) return null;

  const handleSimulateSuccess = async () => {
    setProcessing(true);
    try {
      // Fake realistic gateway latency
      await new Promise((r) => setTimeout(r, 1000));

      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      // Generate matching demo signature on client (or use standard client-side helper)
      // For mock purposes, calculate SHA-256 HMAC or call the server
      const encoder = new TextEncoder();
      const keyData = encoder.encode("demo_razorpay_secret_key_12345");
      const msgData = encoder.encode(`${orderData.orderId}|${paymentId}`);
      
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      let txnRef = paymentId;
      if (activeTab === "UPI") txnRef = `${upiId} / ${paymentId}`;
      if (activeTab === "NETBANKING") txnRef = `${selectedBank} NetBanking / ${paymentId}`;
      if (activeTab === "CARD") txnRef = `Card ****${cardNumber.slice(-4)} / ${paymentId}`;
      if (activeTab === "BANK_TRANSFER") txnRef = bankUtr;

      await onPaymentSuccess({
        orderId: orderData.orderId,
        paymentId,
        signature,
        method: activeTab,
        txnRef,
        bankDetails: activeTab === "BANK_TRANSFER" ? { utr: bankUtr, transferDate } : undefined,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateFailure = async () => {
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      await onPaymentFailure(orderData.orderId, "Payment cancelled or declined by mock bank");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !processing && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Razorpay Top Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>{t.razorpay.modalTitle}</span>
                  <Badge variant="secondary" className="text-[10px] bg-blue-800/80 text-blue-200 border-none">
                    Mock Gateway
                  </Badge>
                </h3>
                <p className="text-xs text-blue-200">{SCHOOL_NAME} • {orderData.studentName}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-blue-300">Total Payable</span>
              <div className="text-xl font-bold font-mono text-white">
                {formatINR(orderData.amountPaise)}
              </div>
            </div>
          </div>
        </div>

        {/* Demo Notice Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border-y border-amber-200 dark:border-amber-800/60 px-4 py-2 text-center text-xs text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 font-medium">
          <span>⚠️ {t.razorpay.demoNotice}</span>
        </div>

        {/* Content Tabs */}
        <div className="p-5">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
            <TabsList className="grid grid-cols-4 w-full h-10 bg-slate-100 dark:bg-slate-800/80 p-1 mb-4">
              <TabsTrigger value="UPI" className="text-xs font-semibold gap-1">
                <Smartphone className="h-3.5 w-3.5" />
                <span>{t.razorpay.tabUpi}</span>
              </TabsTrigger>
              <TabsTrigger value="NETBANKING" className="text-xs font-semibold gap-1">
                <Landmark className="h-3.5 w-3.5" />
                <span>{t.razorpay.tabNetbanking}</span>
              </TabsTrigger>
              <TabsTrigger value="CARD" className="text-xs font-semibold gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{t.razorpay.tabCard}</span>
              </TabsTrigger>
              <TabsTrigger value="BANK_TRANSFER" className="text-xs font-semibold gap-1">
                <Building2 className="h-3.5 w-3.5" />
                <span>{t.razorpay.tabBankTransfer}</span>
              </TabsTrigger>
            </TabsList>

            {/* UPI TAB */}
            <TabsContent value="UPI" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.enterUpiId}</label>
                <Input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="parent@okaxis"
                  className="text-xs border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-500">{t.razorpay.popularApps}:</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {["Google Pay", "PhonePe", "Paytm UPI"].map((app) => (
                    <Button
                      key={app}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUpiId(`parent@${app.toLowerCase().replace(" ", "")}`)}
                      className="text-xs font-medium border-slate-200 dark:border-slate-800"
                    >
                      {app}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* NET BANKING TAB */}
            <TabsContent value="NETBANKING" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.selectBank}</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Punjab National Bank", "Kotak Mahindra"].map(
                    (bank) => (
                      <Button
                        key={bank}
                        type="button"
                        variant={selectedBank === bank ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedBank(bank)}
                        className={`text-xs justify-start ${
                          selectedBank === bank ? "bg-blue-700 text-white" : ""
                        }`}
                      >
                        {bank}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </TabsContent>

            {/* CARD TAB */}
            <TabsContent value="CARD" className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.cardNumber}</label>
                <Input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4111 2222 3333 4444"
                  className="text-xs font-mono border-slate-300 dark:border-slate-700"
                />
                <p className="text-[10px] text-slate-400">{t.razorpay.cardTestHint}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.expiry}</label>
                  <Input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="text-xs font-mono border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.cvv}</label>
                  <Input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="text-xs font-mono border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>
            </TabsContent>

            {/* BANK TRANSFER TAB */}
            <TabsContent value="BANK_TRANSFER" className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                <div className="font-bold text-slate-900 dark:text-slate-100 font-sans">{t.razorpay.schoolBankDetails}</div>
                <div>{t.razorpay.accountNumber}</div>
                <div>{t.razorpay.ifscCode}</div>
                <div>{t.razorpay.bankName}</div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.enterUtr}</label>
                <Input
                  value={bankUtr}
                  onChange={(e) => setBankUtr(e.target.value)}
                  placeholder="e.g. UTR49201948201"
                  className="text-xs font-mono border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t.razorpay.transferDate}</label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="text-xs border-slate-300 dark:border-slate-700"
                />
              </div>

              <p className="text-[11px] text-slate-500 italic">{t.razorpay.bankTransferNotice}</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal Actions */}
        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between sm:justify-between gap-3">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={processing}
            onClick={handleSimulateFailure}
            className="text-xs gap-1.5"
          >
            <XCircle className="h-4 w-4" />
            <span>{t.razorpay.simulateFailure}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={processing}
            onClick={handleSimulateSuccess}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t.razorpay.processing}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>{t.razorpay.simulateSuccess} ({formatINR(orderData.amountPaise)})</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
