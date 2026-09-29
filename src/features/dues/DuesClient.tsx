"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatPhone, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { sendBulkReminders } from "@/features/reminders/actions";
import {
  AlertCircle,
  BellRing,
  CreditCard,
  Download,
  Filter,
  Search,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Eye,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function DuesClient({
  defaulters,
  classes,
  templates,
}: {
  defaulters: any[];
  classes: any[];
  templates: any[];
}) {
  const [activeTab, setActiveTab] = React.useState<"OVERDUE" | "THIS_WEEK" | "THIS_MONTH">("OVERDUE");
  const [selectedClass, setSelectedClass] = React.useState("ALL");
  const [search, setSearch] = React.useState("");

  // Bulk Selection
  const [selectedStudentIds, setSelectedStudentIds] = React.useState<string[]>([]);

  // Send Reminder Modal
  const [showReminderModal, setShowReminderModal] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(templates[0]?.id || "");
  const [isSending, setIsSending] = React.useState(false);

  // Filter defaulters
  const filteredList = React.useMemo(() => {
    return defaulters.filter((d) => {
      const matchSearch =
        !search ||
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        d.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
        d.guardianPhone.includes(search);

      const matchClass = selectedClass === "ALL" || d.classId === selectedClass;

      let matchTab = true;
      if (activeTab === "OVERDUE") matchTab = d.overdueCount > 0;
      else if (activeTab === "THIS_WEEK") matchTab = d.daysOverdue <= 7;
      else if (activeTab === "THIS_MONTH") matchTab = d.totalDuePaise > 0;

      return matchSearch && matchClass && matchTab;
    });
  }, [defaulters, search, selectedClass, activeTab]);

  const totalOutstandingPaise = filteredList.reduce((sum, d) => sum + d.totalDuePaise, 0);
  const totalFinePaise = filteredList.reduce((sum, d) => sum + d.fineDuePaise, 0);

  const handleToggleSelect = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((x) => x !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredList.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredList.map((d) => d.id));
    }
  };

  const handleSendBulkReminders = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student to send reminders");
      return;
    }

    setIsSending(true);
    toast.loading(`Sending WhatsApp reminders to ${selectedStudentIds.length} parents...`);

    try {
      const res = await sendBulkReminders({
        studentIds: selectedStudentIds,
        templateId: selectedTemplateId,
      });

      toast.dismiss();
      toast.success(`Successfully sent ${res.sent} reminders via WhatsApp!`);
      setShowReminderModal(false);
      setSelectedStudentIds([]);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to dispatch reminders");
    } finally {
      setIsSending(false);
    }
  };

  const handleExportDefaulters = () => {
    const data = filteredList.map((d) => ({
      "Admission No": d.admissionNo,
      "Student Name": `${d.firstName} ${d.lastName}`,
      "Class": d.class.name,
      "Section": d.section.name,
      "Guardian Name": d.guardianName,
      "Guardian Phone": d.guardianPhone,
      "Total Due (₹)": d.totalDuePaise / 100,
      "Late Fine (₹)": d.fineDuePaise / 100,
      "Overdue Months": d.overdueCount,
      "Max Days Overdue": d.daysOverdue,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defaulters_List");
    XLSX.writeFile(wb, `SchoolPay_Defaulters_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Defaulter report exported to Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Dues & Defaulters Management</h1>
            <Badge variant="overdue" className="font-bold">
              {filteredList.length} Students with Dues
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Track overdue installments, calculate automatic late fines, and send automated WhatsApp reminders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDefaulters}
            className="gap-1.5 font-semibold"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Defaulter List</span>
          </Button>

          <Button
            size="sm"
            disabled={selectedStudentIds.length === 0}
            onClick={() => setShowReminderModal(true)}
            className="gap-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white"
          >
            <BellRing className="h-4 w-4" />
            <span>Send Reminders ({selectedStudentIds.length})</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards for Dues */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-rose-800 dark:text-rose-300 font-semibold uppercase tracking-wider">
                Total Overdue Balance
              </p>
              <p className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400 mt-1">
                {formatINR(totalOutstandingPaise)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold uppercase tracking-wider">
                Accumulated Late Fines
              </p>
              <p className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400 mt-1">
                {formatINR(totalFinePaise)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 flex items-center justify-center">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold uppercase tracking-wider">
                Total Defaulter Students
              </p>
              <p className="text-2xl font-black font-mono text-blue-700 dark:text-blue-400 mt-1">
                {filteredList.length} Students
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Tab Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab("OVERDUE")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === "OVERDUE" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Chronic Overdue
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("THIS_WEEK")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === "THIS_WEEK" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Due This Week
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("THIS_MONTH")}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === "THIS_MONTH" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                All Outstanding
              </button>
            </div>

            {/* Class & Search */}
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search defaulter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defaulters Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-3 text-left w-10">
                  <Checkbox
                    checked={
                      filteredList.length > 0 &&
                      selectedStudentIds.length === filteredList.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="py-3 px-3 text-left">Student & Admission No</th>
                <th className="py-3 px-3 text-left">Class</th>
                <th className="py-3 px-3 text-left">Guardian & WhatsApp</th>
                <th className="py-3 px-3 text-right">Principal Due</th>
                <th className="py-3 px-3 text-right">Late Fine</th>
                <th className="py-3 px-3 text-right">Total Payable</th>
                <th className="py-3 px-3 text-center">Overdue Days</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredList.length > 0 ? (
                filteredList.map((d) => {
                  const isChecked = selectedStudentIds.includes(d.id);

                  return (
                    <tr
                      key={d.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isChecked ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                      }`}
                    >
                      <td className="py-3 px-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggleSelect(d.id)}
                        />
                      </td>
                      <td className="py-3 px-3">
                        <Link
                          href={`/students/${d.id}`}
                          className="font-bold text-foreground hover:underline hover:text-blue-600 text-sm block"
                        >
                          {d.firstName} {d.lastName}
                        </Link>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {d.admissionNo} (Roll: {d.rollNo || "-"})
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="secondary" className="text-xs">
                          {d.class.name} - {d.section.name}
                        </Badge>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground">{d.guardianName}</div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {formatPhone(d.guardianPhone)}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-foreground">
                        {formatINR(d.principalDuePaise)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {d.fineDuePaise > 0 ? formatINR(d.fineDuePaise) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                        {formatINR(d.totalDuePaise)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="overdue" className="text-[10px] font-mono">
                          {d.daysOverdue} days late
                        </Badge>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">
                          ({d.overdueCount} installments)
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link href={`/collect-fee?studentId=${d.id}`}>
                            <Button size="sm" variant="success" className="h-7 text-xs font-semibold gap-1">
                              <CreditCard className="h-3.5 w-3.5" />
                              <span>Collect</span>
                            </Button>
                          </Link>
                          <Link href={`/students/${d.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="font-bold text-sm text-foreground">No dues pending for selected criteria!</p>
                    <p className="text-xs">All students are up to date with their installment payments.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Send Bulk Reminders Modal Dialog */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-600" />
              <span>Send Fee Due Reminders on WhatsApp</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Selected {selectedStudentIds.length} parents for dispatch.
              </span>
              <p className="text-muted-foreground mt-0.5">
                Messages will be delivered with dynamic student name, pending amount, and payment link.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Select Reminder Template</label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.language})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Template Live Preview */}
            <div className="p-3 rounded-lg border bg-muted/40 space-y-1">
              <span className="font-bold text-muted-foreground uppercase text-[10px]">Message Preview:</span>
              <p className="text-foreground text-xs leading-relaxed italic bg-background p-2.5 rounded border border-dashed">
                {templates.find((t) => t.id === selectedTemplateId)?.content ||
                  "Dear Parent, fee reminder from Arohon Vidya Mandir..."}
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setShowReminderModal(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              disabled={isSending}
              onClick={handleSendBulkReminders}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Sending Reminders...</span>
                </>
              ) : (
                <>
                  <BellRing className="h-4 w-4" />
                  <span>Send to {selectedStudentIds.length} Parents</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
