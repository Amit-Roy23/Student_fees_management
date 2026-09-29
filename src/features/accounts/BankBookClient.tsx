"use client";

import * as React from "react";
import { formatINR, formatDate, formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Landmark,
  Download,
  Printer,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function BankBookClient({
  transactions,
}: {
  transactions: any[];
}) {
  const [search, setSearch] = React.useState("");

  const filteredTxns = React.useMemo(() => {
    return transactions.filter((t) => {
      return (
        !search ||
        t.particulars.toLowerCase().includes(search.toLowerCase()) ||
        (t.refNo && t.refNo.toLowerCase().includes(search.toLowerCase())) ||
        t.mode.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [transactions, search]);

  const totalReceipts = filteredTxns
    .filter((t) => t.type === "RECEIPT")
    .reduce((sum, t) => sum + t.amountPaise, 0);

  const totalPayments = filteredTxns
    .filter((t) => t.type === "PAYMENT")
    .reduce((sum, t) => sum + t.amountPaise, 0);

  const netBankFlow = totalReceipts - totalPayments;

  const handleExportExcel = () => {
    const data = filteredTxns.map((t) => ({
      "Date": formatDateTime(t.date),
      "Type": t.type,
      "Particulars / Student": t.particulars,
      "Mode": t.mode,
      "UTR / Transaction Ref": t.refNo || "-",
      "Bank / Gateway": t.bankName || "State Bank of India (A/C: 3849102948)",
      "Receipt Amount (₹)": t.type === "RECEIPT" ? t.amountPaise / 100 : 0,
      "Payment Amount (₹)": t.type === "PAYMENT" ? t.amountPaise / 100 : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bank_Book");
    XLSX.writeFile(wb, `SchoolPay_Bank_Book_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Bank book exported to Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Bank Book (ব্যাংক খাতা)</h1>
            <Badge variant="default" className="font-bold">SBI A/C • UPI • Gateways</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Digital payments, UPI transfers, bank credits, NEFT/RTGS disbursements, and gateway settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print Bank Book</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 font-semibold">
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase">
                Total Bank Credits (Receipts)
              </p>
              <p className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                +{formatINR(totalReceipts)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-rose-50/40 dark:bg-rose-950/20 border-rose-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold uppercase">
                Total Bank Debits (Expenses)
              </p>
              <p className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400 mt-1">
                -{formatINR(totalPayments)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-blue-50/40 dark:bg-blue-950/20 border-blue-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold uppercase">
                Net Bank Account Flow
              </p>
              <p className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400 mt-1">
                {formatINR(netBankFlow)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center">
              <Landmark className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, transaction ref, UTR, or bank..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Transactions Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Date & Time</th>
                <th className="py-3 px-4 text-left">Transaction Details / Student</th>
                <th className="py-3 px-4 text-left">Mode & UTR / Ref</th>
                <th className="py-3 px-4 text-left">Bank / Account</th>
                <th className="py-3 px-4 text-right text-emerald-600 dark:text-emerald-400">Credit (+)</th>
                <th className="py-3 px-4 text-right text-rose-600 dark:text-rose-400">Debit (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTxns.map((t, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {formatDateTime(t.date)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {t.particulars}
                    <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">
                      {t.voucherNo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="font-bold text-[10px] uppercase">
                      {t.mode}
                    </Badge>
                    {t.refNo && (
                      <span className="block font-mono text-[10px] text-muted-foreground mt-0.5">
                        {t.refNo}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-mono">
                    {t.bankName || "SBI - Current A/C"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {t.type === "RECEIPT" ? `+${formatINR(t.amountPaise)}` : "-"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    {t.type === "PAYMENT" ? `-${formatINR(t.amountPaise)}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
