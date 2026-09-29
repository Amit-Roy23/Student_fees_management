"use client";

import * as React from "react";
import { formatINR, formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  AlertCircle,
  Layers,
  Users,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function ReportsClient({
  classSummaries,
  headSummaries,
  sessionTotal,
}: {
  classSummaries: any[];
  headSummaries: any[];
  sessionTotal: {
    totalExpectedFeePaise: number;
    totalCollectedPaise: number;
    totalDuePaise: number;
  };
}) {
  const handleExportClassSummary = () => {
    const data = classSummaries.map((c) => ({
      "Class": c.className,
      "Total Students": c.studentCount,
      "Total Expected Fee (₹)": c.expectedFeePaise / 100,
      "Total Collected (₹)": c.collectedFeePaise / 100,
      "Outstanding Dues (₹)": c.dueFeePaise / 100,
      "Recovery %": `${c.recoveryPercent}%`,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Class_Wise_Summary");
    XLSX.writeFile(wb, `SchoolPay_Class_Summary_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Class-wise summary exported to Excel!");
  };

  const overallRecovery =
    sessionTotal.totalExpectedFeePaise > 0
      ? Math.round((sessionTotal.totalCollectedPaise / sessionTotal.totalExpectedFeePaise) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Financial Reports & Statements</h1>
            <Badge variant="default" className="font-bold">MD Audit Suite</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Comprehensive audit reports, class-wise recovery percentages, head distributions, and Excel exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 font-semibold">
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportClassSummary} className="gap-1.5 font-semibold">
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Total Annual Demand</span>
            <div className="text-2xl font-black font-mono text-foreground mt-1">
              {formatINR(sessionTotal.totalExpectedFeePaise)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">15 Classes • Session 2026-27</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200">
          <CardContent className="p-4">
            <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold uppercase">Total Realized Collection</span>
            <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              {formatINR(sessionTotal.totalCollectedPaise)}
            </div>
            <p className="text-[11px] text-emerald-700 font-bold mt-1">{overallRecovery}% Session Recovery Rate</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-rose-50/50 dark:bg-rose-950/20 border-rose-200">
          <CardContent className="p-4">
            <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold uppercase">Uncollected Outstanding</span>
            <div className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400 mt-1">
              {formatINR(sessionTotal.totalDuePaise)}
            </div>
            <p className="text-[11px] text-rose-600 font-bold mt-1">Remaining Installments + Dues</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Table */}
      <Tabs defaultValue="class-wise" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="class-wise">Class-Wise Recovery Summary</TabsTrigger>
          <TabsTrigger value="head-wise">Fee Heads Distribution</TabsTrigger>
        </TabsList>

        {/* 1. Class Wise Recovery */}
        <TabsContent value="class-wise" className="space-y-4 pt-2">
          <Card className="border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold">Class Name</th>
                    <th className="py-3 px-4 text-center font-semibold">Students</th>
                    <th className="py-3 px-4 text-right font-semibold">Expected Demand (₹)</th>
                    <th className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">Total Collected (₹)</th>
                    <th className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">Outstanding (₹)</th>
                    <th className="py-3 px-4 text-center font-semibold">Recovery %</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {classSummaries.map((c) => (
                    <tr key={c.classId} className="hover:bg-muted/30">
                      <td className="py-3 px-4 font-bold text-foreground">
                        {c.className}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {c.studentCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-foreground">
                        {formatINR(c.expectedFeePaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatINR(c.collectedFeePaise)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        {formatINR(c.dueFeePaise)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={c.recoveryPercent >= 70 ? "success" : c.recoveryPercent >= 50 ? "warning" : "overdue"}
                          className="font-mono text-xs"
                        >
                          {c.recoveryPercent}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 font-bold bg-muted/40">
                    <td className="py-3 px-4 uppercase">Total All Classes:</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {classSummaries.reduce((sum, c) => sum + c.studentCount, 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatINR(sessionTotal.totalExpectedFeePaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatINR(sessionTotal.totalCollectedPaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400">
                      {formatINR(sessionTotal.totalDuePaise)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <Badge variant="default" className="font-bold">
                        {overallRecovery}%
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* 2. Fee Heads Breakdown */}
        <TabsContent value="head-wise" className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headSummaries.map((h) => (
              <Card key={h.code} className="border shadow-sm p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground">{h.name}</h3>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Code: {h.code} • {h.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold font-mono text-blue-600 dark:text-blue-400">
                    {formatINR(h.estimatedDemandPaise)}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">Annual Estimated Yield</span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
