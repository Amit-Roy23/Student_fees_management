"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx";
import { bulkImportStudents } from "./actions";
import { toast } from "sonner";

export function ExcelImportClient({ classes }: { classes: any[] }) {
  const router = useRouter();
  const [file, setFile] = React.useState<File | null>(null);
  const [parsedData, setParsedData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [importResults, setImportResults] = React.useState<any | null>(null);

  // Column Mapping State
  const [mapping, setMapping] = React.useState({
    admissionNo: "Admission No",
    studentName: "Student Name",
    className: "Class",
    sectionName: "Section",
    guardianName: "Guardian Name",
    phone: "Phone",
    annualFee: "Annual Fee",
    admissionFee: "Admission Fee",
  });

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Admission No": "AVM-2026-9001",
        "Roll No": "1",
        "Student Name": "Aarav Banerjee",
        "Gender": "Male",
        "Class": "Class 1",
        "Section": "A",
        "Guardian Name": "Subir Banerjee",
        "Phone": "9830012345",
        "Email": "subir@example.com",
        "Address": "Salt Lake, Sector 2, Kolkata",
        "Annual Fee": 42000,
        "Admission Fee": 6000,
      },
      {
        "Admission No": "AVM-2026-9002",
        "Roll No": "2",
        "Student Name": "Isha Sengupta",
        "Gender": "Female",
        "Class": "Class 1",
        "Section": "A",
        "Guardian Name": "Pradip Sengupta",
        "Phone": "9830023456",
        "Email": "pradip@example.com",
        "Address": "Ballygunge Circular Rd, Kolkata",
        "Annual Fee": 42000,
        "Admission Fee": 6000,
      },
      {
        "Admission No": "AVM-2026-9003",
        "Roll No": "1",
        "Student Name": "Rohan Das",
        "Gender": "Male",
        "Class": "Class 10",
        "Section": "B",
        "Guardian Name": "Sujit Das",
        "Phone": "9830034567",
        "Email": "sujit@example.com",
        "Address": "New Town Action Area 1, Kolkata",
        "Annual Fee": 68000,
        "Admission Fee": 8000,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student_Import_Template");
    XLSX.writeFile(wb, "SchoolPay_Student_Import_Template.xlsx");
    toast.success("Excel template downloaded!");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (data.length > 0) {
          const keys = Object.keys(data[0] as object);
          setHeaders(keys);
          setParsedData(data);
          toast.success(`Loaded ${data.length} rows from ${uploadedFile.name}`);
        } else {
          toast.error("The selected Excel sheet appears to be empty.");
        }
      } catch (err) {
        toast.error("Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.");
      }
    };

    reader.readAsBinaryString(uploadedFile);
  };

  const handleExecuteImport = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);
    toast.loading(`Importing ${parsedData.length} students into SchoolPay...`);

    try {
      const results = await bulkImportStudents(parsedData);
      toast.dismiss();
      setImportResults(results);
      toast.success(`Import complete! ${results.imported} students added successfully.`);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Bulk import failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bulk Excel / Google Sheet Import</h1>
            <p className="text-sm text-muted-foreground">
              Import your existing student registers and fee sheets into SchoolPay in seconds.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="gap-2 font-semibold border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
        >
          <Download className="h-4 w-4" />
          <span>Download Sample Excel Template</span>
        </Button>
      </div>

      {/* Step 1: Upload Card */}
      {!importResults && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-12">
            <Card className="border-2 border-dashed border-border hover:border-blue-500/50 transition-colors bg-card/60">
              <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Upload your School Excel / CSV / Google Sheet export
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mb-4">
                  Drag and drop your .xlsx or .csv file here, or click to browse. Existing columns will be matched automatically.
                </p>

                <label className="cursor-pointer">
                  <Button variant="default" size="sm" className="font-bold pointer-events-none gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Choose Excel File</span>
                  </Button>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {file && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <FileCheck className="h-4 w-4 text-emerald-600" />
                    <span>Loaded: {file.name} ({parsedData.length} records)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Live Preview & Verification */}
      {parsedData.length > 0 && !importResults && (
        <Card className="border shadow-md">
          <CardHeader className="flex flex-row items-center justify-between border-b">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                <span>Verification Preview ({parsedData.length} Students Detected)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Review data before importing. Installment schedules will be generated automatically.
              </CardDescription>
            </div>

            <Button
              onClick={handleExecuteImport}
              disabled={isProcessing}
              variant="success"
              className="font-bold gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Execute Bulk Import</span>
                </>
              )}
            </Button>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto max-h-[400px]">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 sticky top-0 border-b">
                <tr>
                  <th className="py-2.5 px-3 text-left">#</th>
                  {headers.map((h) => (
                    <th key={h} className="py-2.5 px-3 text-left font-semibold text-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedData.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="py-2.5 px-3 text-foreground font-mono">
                        {String(row[h] || "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>

          {parsedData.length > 15 && (
            <CardFooter className="p-3 bg-muted/20 border-t text-xs text-muted-foreground justify-center">
              Showing first 15 rows of {parsedData.length} total rows.
            </CardFooter>
          )}
        </Card>
      )}

      {/* Step 3: Import Results Card */}
      {importResults && (
        <Card className="border shadow-lg">
          <CardHeader className="bg-emerald-50 dark:bg-emerald-950/30 border-b">
            <CardTitle className="text-lg text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              <span>Import Execution Completed</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
                <span className="text-xs text-muted-foreground block font-medium">Successfully Imported</span>
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {importResults.imported}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                <span className="text-xs text-muted-foreground block font-medium">Skipped (Duplicate IDs)</span>
                <span className="text-2xl font-bold font-mono text-foreground">
                  {importResults.skipped}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200">
                <span className="text-xs text-muted-foreground block font-medium">Errors</span>
                <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300">
                  {importResults.errors.length}
                </span>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-900 dark:text-rose-300 space-y-1">
                <p className="font-bold">Error Summary:</p>
                {importResults.errors.map((err: string, i: number) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="p-4 border-t bg-muted/20 flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setImportResults(null);
              }}
            >
              Import Another File
            </Button>

            <Link href="/students">
              <Button variant="default" className="font-bold gap-2">
                <span>View Students Directory</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
