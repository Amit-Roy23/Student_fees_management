"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatINR, formatPhone } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  FileSpreadsheet,
  Download,
  CreditCard,
  Eye,
  Filter,
  ArrowUpDown,
  FileUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import { createStudent } from "./actions";
import { toast } from "sonner";

export function StudentsListClient({
  students,
  classes,
  totalCount,
}: {
  students: any[];
  classes: any[];
  totalCount: number;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  // New Student Dialog Modal
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [formData, setFormData] = React.useState({
    admissionNo: `AVM-2026-${String(Math.floor(Math.random() * 9000 + 1000))}`,
    rollNo: "1",
    firstName: "",
    lastName: "",
    gender: "Male",
    guardianName: "",
    guardianPhone: "",
    guardianEmail: "",
    classId: classes[0]?.id || "",
    sectionId: classes[0]?.sections[0]?.id || "",
    totalFeePaise: classes[0]?.annualFeePaise || 4200000,
    admissionFeePaise: 600000,
    discountPaise: 0,
    discountReason: "",
  });

  // Filter students client-side for ultra-fast responsiveness
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
        s.guardianPhone.includes(search) ||
        s.guardianName.toLowerCase().includes(search.toLowerCase());

      const matchClass = selectedClass === "ALL" || s.classId === selectedClass;
      const matchStatus = selectedStatus === "ALL" || s.status === selectedStatus;

      return matchSearch && matchClass && matchStatus;
    });
  }, [students, search, selectedClass, selectedStatus]);

  const handleExportExcel = () => {
    const data = filteredStudents.map((s) => ({
      "Admission No": s.admissionNo,
      "Roll No": s.rollNo || "",
      "Student Name": `${s.firstName} ${s.lastName}`,
      "Gender": s.gender,
      "Class": s.class.name,
      "Section": s.section.name,
      "Guardian Name": s.guardianName,
      "Phone": s.guardianPhone,
      "Email": s.guardianEmail || "",
      "Total Annual Fee (₹)": s.summary.totalFeePaise / 100,
      "Total Paid (₹)": s.summary.totalPaidPaise / 100,
      "Total Outstanding (₹)": s.summary.totalDuePaise / 100,
      "Overdue Months": s.summary.overdueCount,
      "Status": s.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `SchoolPay_Students_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Student directory exported to Excel successfully!");
  };

  const handleClassChangeInForm = (clsId: string) => {
    const cls = classes.find((c) => c.id === clsId);
    setFormData((prev) => ({
      ...prev,
      classId: clsId,
      sectionId: cls?.sections[0]?.id || "",
      totalFeePaise: cls?.annualFeePaise || prev.totalFeePaise,
    }));
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await createStudent({
        admissionNo: formData.admissionNo,
        rollNo: formData.rollNo,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail,
        classId: formData.classId,
        sectionId: formData.sectionId,
        totalFeePaise: Number(formData.totalFeePaise),
        admissionFeePaise: Number(formData.admissionFeePaise),
        discountPaise: Number(formData.discountPaise),
        discountReason: formData.discountReason,
      });

      toast.success("Student admitted successfully!");
      setShowAddModal(false);
      router.refresh();
      router.push(`/students/${res.studentId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create student");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage student admissions, profiles, fee structures, and installment schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/students/import">
            <Button variant="outline" size="sm" className="gap-1.5 font-semibold">
              <FileUp className="h-4 w-4 text-blue-600" />
              <span>Bulk Excel Import</span>
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-1.5 font-semibold"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="gap-1.5 font-bold bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4" />
            <span>New Admission</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search */}
            <div className="sm:col-span-5 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, admission no, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Class Filter */}
            <div className="sm:col-span-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes ({classes.length})</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-3">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active Students</SelectItem>
                  <SelectItem value="INACTIVE">Inactive / On Leave</SelectItem>
                  <SelectItem value="ALUMNI">Alumni / Passed Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Data Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Admission No</th>
                <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Student Name</th>
                <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Class & Sec</th>
                <th className="py-3 px-4 text-left font-semibold text-muted-foreground">Guardian & Mobile</th>
                <th className="py-3 px-4 text-right font-semibold text-muted-foreground">Total Fee</th>
                <th className="py-3 px-4 text-right font-semibold text-muted-foreground">Paid Amount</th>
                <th className="py-3 px-4 text-right font-semibold text-muted-foreground">Outstanding</th>
                <th className="py-3 px-4 text-center font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      <Link href={`/students/${s.id}`} className="hover:underline hover:text-blue-600">
                        {s.admissionNo}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground text-sm">
                        <Link href={`/students/${s.id}`} className="hover:underline">
                          {s.firstName} {s.lastName}
                        </Link>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{s.gender}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="font-medium text-xs">
                        {s.class.name} - {s.section.name}
                      </Badge>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">
                        Roll: {s.rollNo || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-foreground">{s.guardianName}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {formatPhone(s.guardianPhone)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                      {formatINR(s.summary.totalFeePaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatINR(s.summary.totalPaidPaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {s.summary.totalDuePaise > 0 ? (
                        <div>
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatINR(s.summary.totalDuePaise)}
                          </span>
                          {s.summary.overdueCount > 0 && (
                            <span className="block text-[10px] text-rose-500 font-medium">
                              ({s.summary.overdueCount} mo overdue)
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          Cleared
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/collect-fee?studentId=${s.id}`}>
                          <Button
                            size="sm"
                            variant="success"
                            className="h-7 px-2 text-xs font-semibold gap-1"
                            title="Collect Fee"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Collect</span>
                          </Button>
                        </Link>
                        <Link href={`/students/${s.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="View Profile & Ledger"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm">No students match your filter criteria.</p>
                    <p className="text-xs">Try adjusting the search query or class filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Stats */}
        <div className="p-4 bg-muted/30 border-t flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <span>Showing {filteredStudents.length} of {totalCount} students in session 2026-27</span>
          <span>SchoolPay Active Student Registry</span>
        </div>
      </Card>

      {/* New Student Admission Modal Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Admit New Student</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateStudent} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Admission No *</label>
                <Input
                  required
                  value={formData.admissionNo}
                  onChange={(e) => setFormData({ ...formData, admissionNo: e.target.value })}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Roll No</label>
                <Input
                  value={formData.rollNo}
                  onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">First Name *</label>
                <Input
                  required
                  placeholder="e.g. Sourav"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Last Name *</label>
                <Input
                  required
                  placeholder="e.g. Mukherjee"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Class *</label>
                <Select value={formData.classId} onValueChange={handleClassChangeInForm}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({formatINR(c.annualFeePaise)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Section *</label>
                <Select
                  value={formData.sectionId}
                  onValueChange={(val) => setFormData({ ...formData, sectionId: val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes
                      .find((c) => c.id === formData.classId)
                      ?.sections.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          Section {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Guardian Name *</label>
                <Input
                  required
                  placeholder="e.g. Debashis Mukherjee"
                  value={formData.guardianName}
                  onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Guardian Phone (WhatsApp) *</label>
                <Input
                  required
                  placeholder="10-digit mobile number"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Agreed Annual Fee (₹)</label>
                <Input
                  type="number"
                  value={formData.totalFeePaise / 100}
                  onChange={(e) =>
                    setFormData({ ...formData, totalFeePaise: Number(e.target.value) * 100 })
                  }
                  className="text-sm font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Discount / Concession (₹)</label>
                <Input
                  type="number"
                  value={formData.discountPaise / 100}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPaise: Number(e.target.value) * 100 })
                  }
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isCreating ? "Admitting..." : "Admit Student & Generate Fee Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
