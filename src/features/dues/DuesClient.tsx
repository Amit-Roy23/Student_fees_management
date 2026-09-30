"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { getDuesData, sendMockReminder, sendBulkOverdueReminders } from "./actions";
import { formatReminderMessage } from "./reminder-utils";
import { formatINR, formatDate, paiseToRupees } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { exportToExcel } from "@/lib/excel";
import { hasPermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  Users,
  CheckCircle2,
  Phone,
  Filter,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export function DuesClient({
  initialData,
}: {
  initialData: Awaited<ReturnType<typeof getDuesData>>;
}) {
  const { data: session } = useSession();
  const { t, locale } = useI18n();
  const userRole = (session?.user as any)?.role;

  const canExport = hasPermission(userRole, "EXCEL_EXPORT");
  const canRemind = hasPermission(userRole, "DUES_VIEW_REMIND");

  const [data, setData] = React.useState(initialData);
  const [selectedClass, setSelectedClass] = React.useState<string>("ALL");
  const [loading, setLoading] = React.useState(false);

  // Single Reminder Modal State
  const [activeItem, setActiveItem] = React.useState<any | null>(null);
  const [sendingSingle, setSendingSingle] = React.useState(false);

  // Bulk Reminder Confirmation State
  const [showBulkConfirm, setShowBulkConfirm] = React.useState(false);
  const [sendingBulk, setSendingBulk] = React.useState(false);

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    setLoading(true);
    try {
      const res = await getDuesData(classId);
      setData(res);
    } catch (err: any) {
      toast.error(err.message || "Failed to filter dues");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReminderModal = (item: any) => {
    setActiveItem(item);
  };

  const handleConfirmSingleReminder = async () => {
    if (!activeItem || !canRemind) return;

    setSendingSingle(true);
    try {
      const res = await sendMockReminder({
        studentId: activeItem.studentId,
        installmentId: activeItem.installmentId,
        guardianName: activeItem.guardianName,
        studentName: activeItem.studentName,
        amountPaise: activeItem.totalPayablePaise,
        dueDate: activeItem.dueDate,
        locale,
      });

      toast.success(`Reminder sent to ${activeItem.guardianName} (${activeItem.guardianPhone})`);

      setData((prev) => ({
        ...prev,
        duesList: prev.duesList.map((row) =>
          row.installmentId === activeItem.installmentId
            ? { ...row, lastRemindedAt: res.sentAt, lastReminderMessage: res.message }
            : row
        ),
      }));

      setActiveItem(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reminder");
    } finally {
      setSendingSingle(false);
    }
  };

  const handleConfirmBulkReminders = async () => {
    if (!canRemind) return;
    const overdueItems = data.duesList.filter((d) => d.daysOverdue > 0);
    if (overdueItems.length === 0) {
      toast.info("No overdue students to remind.");
      setShowBulkConfirm(false);
      return;
    }

    setSendingBulk(true);
    try {
      const payload = overdueItems.map((d) => ({
        studentId: d.studentId,
        installmentId: d.installmentId,
        guardianName: d.guardianName,
        studentName: d.studentName,
        amountPaise: d.totalPayablePaise,
        dueDate: d.dueDate,
      }));

      const res = await sendBulkOverdueReminders(payload, locale);
      toast.success(`Logged reminders for ${res.count} overdue students in ${locale.toUpperCase()}!`);

      const refreshed = await getDuesData(selectedClass);
      setData(refreshed);
      setShowBulkConfirm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send bulk reminders");
    } finally {
      setSendingBulk(false);
    }
  };

  const handleExportExcel = () => {
    const rows = data.duesList.map((d) => ({
      "Student Name": d.studentName,
      "Admission No": d.admissionNo,
      Class: d.className,
      "Guardian Name": d.guardianName,
      "Guardian Phone": d.guardianPhone,
      "Installment": d.installmentTitle,
      "Due Date": formatDate(d.dueDate),
      "Days Overdue": d.daysOverdue,
      "Principal Fee (INR)": paiseToRupees(d.principalPaise),
      "Paid (INR)": paiseToRupees(d.paidAmountPaise),
      "Remaining Due (INR)": paiseToRupees(d.remainingPrincipalPaise),
      "Late Fine (INR)": paiseToRupees(d.finePaise),
      "Total Payable (INR)": paiseToRupees(d.totalPayablePaise),
      "Status": d.status,
      "Last Reminded": d.lastRemindedAt ? formatDate(d.lastRemindedAt) : "Never",
    }));

    exportToExcel(rows, `Dues_And_Defaulters_${selectedClass}.xlsx`, "Dues");
    toast.success(t.importExport.exportSuccess);
  };

  const overdueList = data.duesList.filter((d) => d.daysOverdue > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.dues.title}
            </h1>
            <Badge variant="destructive" className="font-semibold text-xs">
              {data.totalOverdueCount} {t.status.overdue}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.dues.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1.5 font-semibold text-xs border-slate-300 dark:border-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.common.exportExcel}</span>
            </Button>
          )}

          {canRemind && overdueList.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowBulkConfirm(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 text-xs shadow-xs"
            >
              <Send className="h-4 w-4" />
              <span>{t.dues.sendReminderAll} ({overdueList.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-rose-50/40 dark:bg-rose-950/20">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center justify-between">
              <span>{t.dues.totalOverdueAmount}</span>
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-rose-950 dark:text-rose-100 font-mono">
              {formatINR(data.totalOverduePaise)}
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
              Across {data.totalOverdueCount} {t.status.overdue} installments
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center justify-between">
              <span>{t.dues.lateFinesComputed}</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-amber-950 dark:text-amber-100 font-mono">
              {formatINR(data.totalFinesPaise)}
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              Rule: ₹10 / day after due date (max ₹500)
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50">
          <CardHeader className="py-3 px-4 pb-1">
            <CardTitle className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>{t.dues.totalDuesListed}</span>
              <Users className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {data.duesList.length}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Pending & overdue records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Filter Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> {t.common.filter}:
        </span>
        <Select value={selectedClass} onValueChange={handleClassChange} disabled={loading}>
          <SelectTrigger className="w-[180px] h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
            <SelectValue placeholder={t.common.allClasses} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <SelectItem value="ALL">{t.common.allClasses}</SelectItem>
            {data.classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dues & Fines Table */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {t.dues.title}
            </CardTitle>
            <CardDescription className="text-xs">
              Track days overdue, computed fines, and last reminder timestamps
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {data.duesList.length} Rows
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">{t.dashboard.student} & {t.students.class}</th>
                  <th className="py-3 px-3.5">{t.students.guardian}</th>
                  <th className="py-3 px-3.5">{t.students.month}</th>
                  <th className="py-3 px-3.5">{t.students.dueDate}</th>
                  <th className="py-3 px-3.5 text-center">{t.dues.daysLate}</th>
                  <th className="py-3 px-3.5 text-right">{t.students.admissionFee}</th>
                  <th className="py-3 px-3.5 text-right">{t.students.fineAmount}</th>
                  <th className="py-3 px-3.5 text-right">{t.common.amount}</th>
                  <th className="py-3 px-3.5">{t.dues.lastReminded}</th>
                  <th className="py-3 px-3.5 text-right">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.duesList.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No dues or overdue installments found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  data.duesList.map((row) => {
                    const isOverdue = row.daysOverdue > 0;

                    return (
                      <tr
                        key={row.installmentId}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                          isOverdue ? "bg-rose-50/30 dark:bg-rose-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{row.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {row.className} • {row.admissionNo}
                          </div>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{row.guardianName}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{row.guardianPhone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                          {row.installmentTitle}
                        </td>

                        <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400 font-mono">
                          {formatDate(row.dueDate)}
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          {isOverdue ? (
                            <Badge variant="destructive" className="text-[10px] font-bold px-1.5 py-0">
                              {row.daysOverdue}d {t.status.overdue}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-500 px-1.5 py-0">
                              {t.dues.upcoming}
                            </Badge>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatINR(row.remainingPrincipalPaise)}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                          {row.finePaise > 0 ? formatINR(row.finePaise) : "-"}
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatINR(row.totalPayablePaise)}
                        </td>

                        <td className="py-3 px-3.5">
                          {row.lastRemindedAt ? (
                            <div className="text-[11px]">
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                {formatDate(row.lastRemindedAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">{t.dues.notReminded}</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-right">
                          {canRemind && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenReminderModal(row)}
                              className="h-7 text-xs font-semibold gap-1 text-blue-700 dark:text-blue-400 hover:text-blue-800 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
                            >
                              <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              <span>{t.dues.sendReminder}</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Single Reminder Mock Modal */}
      <Dialog open={!!activeItem} onOpenChange={(open) => !open && setActiveItem(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>{t.dues.previewTitle} ({locale.toUpperCase()})</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Preview the message in {locale.toUpperCase()} before saving to reminder log.
            </DialogDescription>
          </DialogHeader>

          {activeItem && (
            <div className="space-y-4 py-2">
              <div className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Recipient:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{activeItem.guardianName} ({activeItem.guardianPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{activeItem.studentName} ({activeItem.className})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Due Amount:</span>
                  <span className="font-bold text-rose-700 dark:text-rose-400 font-mono">{formatINR(activeItem.totalPayablePaise)}</span>
                </div>
              </div>

              {/* Mock WhatsApp Bubble */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">WhatsApp Message</label>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                  <p>
                    {formatReminderMessage(
                      activeItem.guardianName,
                      activeItem.studentName,
                      activeItem.totalPayablePaise,
                      activeItem.dueDate,
                      locale
                    )}
                  </p>
                  <div className="text-right text-[10px] text-emerald-700 dark:text-emerald-400 mt-2">
                    ✓✓ School Accounts Desk
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveItem(null)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sendingSingle}
              onClick={handleConfirmSingleReminder}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendingSingle ? t.common.loading : t.dues.sendAndLog}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reminder Confirmation Dialog */}
      <Dialog open={showBulkConfirm} onOpenChange={setShowBulkConfirm}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Send className="h-4 w-4 text-amber-600" />
              <span>{t.dues.bulkConfirmTitle}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {t.dues.bulkConfirmDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 dark:bg-amber-950/40 p-3.5 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1 my-2">
            <div className="font-bold">Batch Details:</div>
            <div>• {overdueList.length} Overdue Installments</div>
            <div>• Language: <span className="font-bold uppercase">{locale}</span></div>
            <div>• Total Overdue Amount: <span className="font-mono font-bold">{formatINR(data.totalOverduePaise)}</span></div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowBulkConfirm(false)}>
              {t.common.cancel}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sendingBulk}
              onClick={handleConfirmBulkReminders}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendingBulk ? t.common.loading : `Send to All (${overdueList.length})`}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
