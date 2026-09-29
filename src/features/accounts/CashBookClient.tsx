"use client";

import * as React from "react";
import { formatINR, formatDate, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { closeCashBookDay, unlockCashBookDay } from "./actions";
import {
  BookOpen,
  Lock,
  Unlock,
  Download,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function CashBookClient({
  days,
  userRole,
}: {
  days: any[];
  userRole: string;
}) {
  const [selectedDayToClose, setSelectedDayToClose] = React.useState<any | null>(null);
  const [closingRemarks, setClosingRemarks] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleCloseDay = async () => {
    if (!selectedDayToClose) return;
    setIsProcessing(true);

    try {
      await closeCashBookDay(
        selectedDayToClose.date.split("T")[0],
        closingRemarks || "Physical cash in safe verified with day entries"
      );
      toast.success("Cash Book for the day successfully verified & closed!");
      setSelectedDayToClose(null);
      setClosingRemarks("");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to close cash book");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlockDay = async (dayId: string) => {
    try {
      await unlockCashBookDay(dayId);
      toast.success("Cash book unlocked for adjustments");
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to unlock");
    }
  };

  const handleExportExcel = () => {
    const data = days.map((d) => ({
      "Date": formatDate(d.date),
      "Opening Balance (₹)": d.openingBalancePaise / 100,
      "Cash Receipts (₹)": d.totalReceiptsPaise / 100,
      "Cash Expenses (₹)": d.totalExpensesPaise / 100,
      "Closing Balance (₹)": d.closingBalancePaise / 100,
      "Status": d.isClosed ? "Closed & Locked" : "Open",
      "Closed By": d.closedBy?.name || "-",
      "Remarks": d.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash_Book");
    XLSX.writeFile(wb, `SchoolPay_Cash_Book_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Cash book exported to Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Cash Book (নগদ খাতা)</h1>
            <Badge variant="default" className="font-bold">Day-Wise Cash Ledger</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Day-wise opening cash, counter receipts, cash expense vouchers, and physical closing balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print Ledger</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 font-semibold">
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Cash Book Days Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-right">Opening Cash (₹)</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Cash Receipts (+)</th>
                <th className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">Cash Expenses (-)</th>
                <th className="py-3 px-4 text-right font-bold text-foreground">Closing Balance (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-left">Remarks & Verifier</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {days.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {formatDate(d.date)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                    {formatINR(d.openingBalancePaise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatINR(d.totalReceiptsPaise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{formatINR(d.totalExpensesPaise)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                    {formatINR(d.closingBalancePaise)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {d.isClosed ? (
                      <Badge variant="success" className="text-[10px] gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Closed</span>
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] gap-1">
                        <Unlock className="h-3 w-3" />
                        <span>Open</span>
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-xs">
                    <p className="line-clamp-1">{d.remarks || "Standard daily transaction log"}</p>
                    {d.closedBy && (
                      <span className="block text-[10px] text-muted-foreground font-semibold mt-0.5">
                        Verified by {d.closedBy.name}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {!d.isClosed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDayToClose(d)}
                        className="h-7 text-xs font-semibold gap-1"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Close Day</span>
                      </Button>
                    ) : userRole === "ADMIN" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUnlockDay(d.id)}
                        className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                        title="Unlock Day (Admin Only)"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Unlock</span>
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted-foreground font-mono">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Day Close Verification Modal */}
      <Dialog open={!!selectedDayToClose} onOpenChange={(open) => !open && setSelectedDayToClose(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <span>Day-End Cash Book Closing ({selectedDayToClose ? formatDate(selectedDayToClose.date) : ""})</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Please verify physical cash in safe against closing balance before locking the day book.
            </p>

            <div className="p-4 bg-muted/40 rounded-xl space-y-2 font-mono text-sm border">
              <div className="flex justify-between">
                <span>Opening Cash:</span>
                <span className="font-bold">{formatINR(selectedDayToClose?.openingBalancePaise)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Total Cash Collections (+):</span>
                <span className="font-bold">+{formatINR(selectedDayToClose?.totalReceiptsPaise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Total Cash Vouchers (-):</span>
                <span className="font-bold">-{formatINR(selectedDayToClose?.totalExpensesPaise)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-black text-blue-600">
                <span>Final Closing Cash Balance:</span>
                <span>{formatINR(selectedDayToClose?.closingBalancePaise)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Closing Remarks / Verification Note</label>
              <Input
                placeholder="e.g. Physical currency counted and tallied with counter sheet"
                value={closingRemarks}
                onChange={(e) => setClosingRemarks(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDayToClose(null)}>
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={isProcessing}
              onClick={handleCloseDay}
              className="font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>Confirm & Lock Cash Book</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
