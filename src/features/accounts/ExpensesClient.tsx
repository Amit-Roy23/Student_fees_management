"use client";

import * as React from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExpenseCategory, PaymentMode } from "@prisma/client";
import { createExpense } from "./actions";
import {
  Receipt,
  Plus,
  Search,
  Download,
  Filter,
  CreditCard,
  Building2,
  Calendar,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ExpenseFormState {
  title: string;
  category: ExpenseCategory;
  amountRupees: string;
  mode: PaymentMode;
  paymentDate: string;
  vendorName: string;
  receiptNo: string;
  remarks: string;
}

export function ExpensesClient({
  expenses,
}: {
  expenses: any[];
}) {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");

  // New Expense Modal
  const [showModal, setShowModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<ExpenseFormState>({
    title: "",
    category: ExpenseCategory.UTILITIES,
    amountRupees: "",
    mode: PaymentMode.CASH,
    paymentDate: new Date().toISOString().split("T")[0],
    vendorName: "",
    receiptNo: `EXP-2026-${String(Math.floor(Math.random() * 8999 + 1000))}`,
    remarks: "",
  });

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.vendorName && e.vendorName.toLowerCase().includes(search.toLowerCase())) ||
        (e.receiptNo && e.receiptNo.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = selectedCategory === "ALL" || e.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [expenses, search, selectedCategory]);

  const totalExpensePaise = filteredExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || Number(form.amountRupees) <= 0) {
      toast.error("Please enter a valid title and positive amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await createExpense({
        title: form.title,
        category: form.category,
        amountPaise: Math.round(Number(form.amountRupees) * 100),
        mode: form.mode,
        paymentDate: form.paymentDate,
        vendorName: form.vendorName,
        receiptNo: form.receiptNo,
        remarks: form.remarks,
      });

      toast.success("Expense voucher recorded successfully!");
      setShowModal(false);
      setForm({
        title: "",
        category: ExpenseCategory.UTILITIES,
        amountRupees: "",
        mode: PaymentMode.CASH,
        paymentDate: new Date().toISOString().split("T")[0],
        vendorName: "",
        receiptNo: `EXP-2026-${String(Math.floor(Math.random() * 8999 + 1000))}`,
        remarks: "",
      });
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = () => {
    const data = filteredExpenses.map((e) => ({
      "Date": formatDate(e.paymentDate),
      "Voucher #": e.receiptNo || "-",
      "Expense Title": e.title,
      "Category": e.category,
      "Vendor / Payee": e.vendorName || "-",
      "Mode": e.mode,
      "Amount (₹)": e.amountPaise / 100,
      "Recorded By": e.createdBy?.name || "Accountant",
      "Remarks": e.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `SchoolPay_Expenses_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Expenses exported to Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">School Expenses & Vouchers</h1>
            <Badge variant="outline" className="font-bold">Total: {formatINR(totalExpensePaise)}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage school operational expenses, staff payrolls, utilities, and maintain cash book balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 font-semibold">
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="gap-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Record Expense</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expense by title, vendor, or voucher number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="sm:col-span-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {Object.values(ExpenseCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Voucher #</th>
                <th className="py-3 px-4 text-left">Expense Description</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Vendor / Payee</th>
                <th className="py-3 px-4 text-left">Payment Mode</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredExpenses.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {formatDate(e.paymentDate)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {e.receiptNo || "EXP"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {e.title}
                    {e.remarks && (
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {e.remarks}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {e.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground font-medium">
                    {e.vendorName || "-"}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">
                      {e.mode}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    -{formatINR(e.amountPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Expense Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record School Expense Voucher</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Expense Title / Particulars *</label>
              <Input
                required
                placeholder="e.g. Science Lab Reagents / Electricity Bill"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Expense Category *</label>
                <Select
                  value={form.category}
                  onValueChange={(val: ExpenseCategory) => setForm({ ...form, category: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ExpenseCategory).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Amount (₹) *</label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.amountRupees}
                  onChange={(e) => setForm({ ...form, amountRupees: e.target.value })}
                  className="font-mono text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Payment Mode *</label>
                <Select
                  value={form.mode}
                  onValueChange={(val: PaymentMode) => setForm({ ...form, mode: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PaymentMode.CASH}>Cash (From Cash Counter)</SelectItem>
                    <SelectItem value={PaymentMode.BANK_TRANSFER}>Bank Transfer (NEFT/RTGS)</SelectItem>
                    <SelectItem value={PaymentMode.UPI}>UPI / QR</SelectItem>
                    <SelectItem value={PaymentMode.CHEQUE}>Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Payment Date</label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Vendor / Payee Name</label>
              <Input
                placeholder="e.g. Modern Printers / WBSEDCL"
                value={form.vendorName}
                onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                className="text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Remarks / Approval Note</label>
              <Input
                placeholder="e.g. Approved by MD for Annual Function"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="text-sm"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSubmitting ? "Recording..." : "Record Expense Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
