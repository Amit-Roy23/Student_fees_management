"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { useI18n } from "@/lib/i18n";
import { downloadStudentImportTemplate } from "@/lib/excel";
import { validateImportRows, executeImportStudents, ValidationResult } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export function ExcelImportClient() {
  const { t } = useI18n();
  const router = useRouter();

  const [validating, setValidating] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [validationResults, setValidationResults] = React.useState<ValidationResult[]>([]);
  const [validCount, setValidCount] = React.useState(0);
  const [invalidCount, setInvalidCount] = React.useState(0);
  const [fileName, setFileName] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setValidating(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        toast.error("The uploaded spreadsheet is empty.");
        setValidating(false);
        return;
      }

      const res = await validateImportRows(rows);
      setValidationResults(res.results);
      setValidCount(res.validCount);
      setInvalidCount(res.invalidCount);

      toast.info(`Parsed ${rows.length} rows: ${res.validCount} valid, ${res.invalidCount} invalid`);
    } catch (err: any) {
      toast.error(err.message || "Failed to parse Excel file");
    } finally {
      setValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    const validRows = validationResults.filter((r) => r.isValid).map((r) => r.data);
    if (validRows.length === 0) {
      toast.error("No valid student rows to import.");
      return;
    }

    setImporting(true);
    try {
      const res = await executeImportStudents(validRows);
      toast.success(t.importExport.importSuccess + ` (${res.count} students)`);
      router.push("/students");
    } catch (err: any) {
      toast.error(err.message || "Import execution failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/students">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t.importExport.importTitle}
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.importExport.importSubtitle}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={downloadStudentImportTemplate}
          className="gap-2 font-semibold text-xs border-slate-300 dark:border-slate-700"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>{t.importExport.downloadTemplate}</span>
        </Button>
      </div>

      {/* Upload Box */}
      <Card className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
        <CardContent className="p-8 text-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center mx-auto">
            <FileSpreadsheet className="h-6 w-6" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {fileName || t.importExport.uploadFile}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.importExport.dropFileHere}
            </p>
          </div>

          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={validating || importing}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold gap-2 text-xs"
          >
            {validating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validating Rows...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>{fileName ? "Choose Another File" : "Select .xlsx File"}</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Validation Results Preview */}
      {validationResults.length > 0 && (
        <div className="space-y-4">
          {/* Summary KPI Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="text-xs text-slate-500 block">{t.importExport.validRows}</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{validCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-rose-600" />
                <div>
                  <span className="text-xs text-slate-500 block">{t.importExport.invalidRows}</span>
                  <span className="text-lg font-bold text-rose-700 dark:text-rose-400">{invalidCount}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleExecuteImport}
              disabled={importing || validCount === 0}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-2 text-xs h-10 px-5"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t.importExport.importValidRows} ({validCount})</span>
                </>
              )}
            </Button>
          </div>

          {/* Validation Table */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Row-by-Row Validation Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Admission No</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Class</th>
                      <th className="py-2.5 px-3">Guardian</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Validation Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validationResults.map((r) => (
                      <tr
                        key={r.rowNumber}
                        className={
                          r.isValid
                            ? "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                            : "bg-rose-50/40 dark:bg-rose-950/30"
                        }
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{r.rowNumber}</td>
                        <td className="py-2.5 px-3">
                          {r.isValid ? (
                            <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px]">
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="text-[10px]">
                              Invalid
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {r.data.admissionNo || "-"}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          {r.data.name || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{r.data.class}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{r.data.guardianName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{r.data.guardianPhone}</td>
                        <td className="py-2.5 px-3 text-rose-600 dark:text-rose-400 font-medium">
                          {r.errors.length > 0 ? r.errors.join("; ") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
