"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR, formatPhone, paiseToRupees } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { exportToExcel } from "@/lib/excel";
import { hasPermission } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import { createStudent } from "./actions";
import { toast } from "sonner";

export function StudentsListClient({
  students,
  classes,
  userRole,
}: {
  students: any[];
  classes: any[];
  userRole: string;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [search, setSearch] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("ALL");

  const sortedClasses = React.useMemo(() => {
    return [...classes].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) return orderA - orderB;
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [classes]);

  // New Student Dialog Modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState({
    admissionNo: `AVM-2026-${String(Math.floor(Math.random() * 9000 + 1000))}`,
    name: "",
    classId: sortedClasses[0]?.id || "",
    guardianName: "",
    guardianPhone: "",
    address: "Kolkata, West Bengal",
    admissionDate: new Date().toISOString().split("T")[0],
    admissionFeePaise: sortedClasses[0]?.admissionFeePaise || 600000,
    totalFeePaise: (sortedClasses[0]?.admissionFeePaise || 600000) + (sortedClasses[0]?.remainingFeePaise || 3600000),
    installmentCount: sortedClasses[0]?.installmentCount || 10,
  });

  const canImport = hasPermission(userRole, "EXCEL_IMPORT");
  const canExport = hasPermission(userRole, "EXCEL_EXPORT");
  const canAdmit = hasPermission(userRole, "STUDENT_ADMIT");

  // Filter students client-side
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
        s.guardianPhone.includes(search) ||
        s.guardianName.toLowerCase().includes(search.toLowerCase());

      const matchClass = selectedClass === "ALL" || s.classId === selectedClass;

      return matchSearch && matchClass;
    });
  }, [students, search, selectedClass]);

  const handleClassChangeInForm = (clsId: string) => {
    const cls = classes.find((c) => c.id === clsId);
    if (cls) {
      setFormData((prev) => ({
        ...prev,
        classId: clsId,
        admissionFeePaise: cls.admissionFeePaise,
        totalFeePaise: cls.admissionFeePaise + cls.remainingFeePaise,
        installmentCount: cls.installmentCount,
      }));
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await createStudent({
        admissionNo: formData.admissionNo,
        name: formData.name,
        classId: formData.classId,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        address: formData.address,
        admissionDate: formData.admissionDate,
        admissionFeePaise: Number(formData.admissionFeePaise),
        totalFeePaise: Number(formData.totalFeePaise),
        installmentCount: Number(formData.installmentCount),
      });

      toast.success("Student admitted successfully!");
      setShowAddModal(false);
      router.refresh();
      router.push(`/students/${res.studentId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to admit student");
    } finally {
      setIsCreating(false);
    }
  };

  const handleExportStudents = () => {
    const rows = filteredStudents.map((s) => ({
      "Admission No": s.admissionNo,
      "Student Name": s.name,
      Class: s.class.name,
      "Guardian Name": s.guardianName,
      "Guardian Phone": s.guardianPhone,
      Address: s.address || "",
      "Annual Fee (INR)": paiseToRupees(s.summary.totalFeePaise),
      "Paid (INR)": paiseToRupees(s.summary.totalPaidPaise),
      "Due (INR)": paiseToRupees(s.summary.totalDuePaise),
    }));

    exportToExcel(rows, `Students_Directory_${selectedClass}.xlsx`, "Students");
    toast.success(t.importExport.exportSuccess);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.students.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.students.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportStudents}
              className="gap-1.5 font-semibold text-xs border-slate-300 dark:border-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t.common.exportExcel}</span>
            </Button>
          )}

          {canImport && (
            <Link href="/students/import">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 font-semibold text-xs border-slate-300 dark:border-slate-700"
              >
                <Upload className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t.common.importExcel}</span>
              </Button>
            </Link>
          )}

          {canAdmit && (
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-1.5 font-bold bg-blue-700 hover:bg-blue-800 text-white text-xs shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>{t.students.addStudent}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900">
        <CardContent className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search */}
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t.students.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs border-slate-300 dark:border-slate-700"
              />
            </div>

            {/* Class Filter */}
            <div className="sm:col-span-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <SelectValue placeholder={t.common.allClasses} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="ALL">{t.common.allClasses} ({sortedClasses.length})</SelectItem>
                  {sortedClasses.map((c) => (
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

      {/* Students Data Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-left">{t.students.admissionNo}</th>
                <th className="py-2.5 px-3 text-left">{t.students.name}</th>
                <th className="py-2.5 px-3 text-left">{t.students.class}</th>
                <th className="py-2.5 px-3 text-left">{t.students.guardian} & {t.students.guardianPhone}</th>
                <th className="py-2.5 px-3 text-right">{t.students.totalFee}</th>
                <th className="py-2.5 px-3 text-right">{t.students.totalPaid}</th>
                <th className="py-2.5 px-3 text-right">{t.students.totalDue}</th>
                <th className="py-2.5 px-3 text-center">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                      <Link href={`/students/${s.id}`} className="hover:underline text-blue-600 dark:text-blue-400">
                        {s.admissionNo}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      <Link href={`/students/${s.id}`} className="hover:underline">
                        {s.name}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="secondary" className="font-semibold text-[10px]">
                        {s.class.name}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{s.guardianName}</div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {formatPhone(s.guardianPhone)}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(s.summary.totalFeePaise)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatINR(s.summary.totalPaidPaise)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {s.summary.totalDuePaise > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {formatINR(s.summary.totalDuePaise)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t.status.paid}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {s.summary.totalDuePaise > 0 && (
                          <Link href={`/collect-fee?studentId=${s.id}`}>
                            <Button
                              size="sm"
                              className="h-7 px-2 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>{t.nav.collectFee}</span>
                            </Button>
                          </Link>
                        )}
                        <Link href={`/students/${s.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-semibold px-2 border-slate-300 dark:border-slate-700"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            <span>{t.common.view}</span>
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-1 opacity-30" />
                    <p className="font-medium text-xs">{t.students.noStudents}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Student Admission Modal Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.students.addStudent}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStudent} className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.admissionNo} *</label>
                <Input
                  required
                  value={formData.admissionNo}
                  onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                  className="font-mono text-xs h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.name} *</label>
                <Input
                  required
                  placeholder="e.g. Sourav Mukherjee"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xs h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.class} *</label>
                <Select value={formData.classId} onValueChange={handleClassChangeInForm}>
                  <SelectTrigger className="h-8 text-xs border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {sortedClasses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.admissionDate}</label>
                <Input
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                  className="text-xs h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.guardian} *</label>
                <Input
                  required
                  placeholder="e.g. Debashis Mukherjee"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  className="text-xs h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.guardianPhone} *</label>
                <Input
                  required
                  placeholder="10-digit mobile number"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  className="text-xs font-mono h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.address}</label>
                <Input
                  placeholder="e.g. Kolkata, West Bengal"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="text-xs h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.admissionFee} *</label>
                <Input
                  type="number"
                  required
                  value={formData.admissionFeePaise / 100}
                  onChange={(e) =>
                    setFormData({ ...formData, admissionFeePaise: Number(e.target.value) * 100 })
                  }
                  className="text-xs font-mono h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.totalFee} *</label>
                <Input
                  type="number"
                  required
                  value={formData.totalFeePaise / 100}
                  onChange={(e) =>
                    setFormData({ ...formData, totalFeePaise: Number(e.target.value) * 100 })
                  }
                  className="text-xs font-mono h-8 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="col-span-2 space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.students.installmentsCount}</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={formData.installmentCount}
                  onChange={(e) =>
                    setFormData({ ...formData, installmentCount: Number(e.target.value) })
                  }
                  className="text-xs font-mono h-8 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isCreating}
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold"
              >
                {isCreating ? "Admitting..." : `${t.common.save} & Generate Plan`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
