"use client";

import * as React from "react";
import { formatDateTime } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Search, Download, Filter, Clock, UserCheck } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function AuditLogsClient({ logs }: { logs: any[] }) {
  const [search, setSearch] = React.useState("");

  const filteredLogs = React.useMemo(() => {
    return logs.filter((l) => {
      return (
        !search ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        (l.userName && l.userName.toLowerCase().includes(search.toLowerCase())) ||
        (l.details && l.details.toLowerCase().includes(search.toLowerCase())) ||
        l.entityType.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [logs, search]);

  const handleExportExcel = () => {
    const data = filteredLogs.map((l) => ({
      "Timestamp": formatDateTime(l.createdAt),
      "Action": l.action,
      "Entity": l.entityType,
      "Performed By": l.userName || "System",
      "User Role": l.userRole || "-",
      "Activity Details": l.details || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Audit_Logs");
    XLSX.writeFile(wb, `SchoolPay_Audit_Logs_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Audit logs exported to Excel!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">System Audit & Compliance Logs</h1>
            <Badge variant="default" className="font-bold">Security Log</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Immutable audit trail of payment collections, reversals, fine waivers, and administrator actions.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-1.5 font-semibold">
          <Download className="h-4 w-4 text-emerald-600" />
          <span>Export Audit Log</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs by action, staff name, or activity details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="py-3 px-4 text-left">Timestamp</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">Entity</th>
                <th className="py-3 px-4 text-left">Performed By</th>
                <th className="py-3 px-4 text-left">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {formatDateTime(l.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        l.action.includes("REVERS")
                          ? "destructive"
                          : l.action.includes("WAIV")
                          ? "warning"
                          : l.action.includes("COLLECT")
                          ? "success"
                          : "secondary"
                      }
                      className="font-mono text-[10px]"
                    >
                      {l.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {l.entityType}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-foreground">{l.userName || "System"}</span>
                    {l.userRole && (
                      <span className="block font-mono text-[10px] text-muted-foreground">
                        ({l.userRole})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-foreground font-mono text-[11px] max-w-md">
                    {l.details || "-"}
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
