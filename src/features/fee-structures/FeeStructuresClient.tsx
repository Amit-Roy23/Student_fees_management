"use client";

import * as React from "react";
import { formatINR } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Layers, Plus, CheckCircle2, IndianRupee, Sparkles, School } from "lucide-react";
import { toast } from "sonner";

export function FeeStructuresClient({
  classes,
  feeHeads,
  feeStructures,
}: {
  classes: any[];
  feeHeads: any[];
  feeStructures: any[];
}) {
  const [selectedClassId, setSelectedClassId] = React.useState<string>(classes[0]?.id || "");

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const activeStructure = feeStructures.find((s) => s.classId === selectedClassId);

  const parsedHeads = React.useMemo(() => {
    if (!activeStructure?.headsJson) return [];
    try {
      return JSON.parse(activeStructure.headsJson);
    } catch {
      return [];
    }
  }, [activeStructure]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Structures & Heads</h1>
          <p className="text-sm text-muted-foreground">
            Configure annual fee structures, fee components, and recurring heads per class.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs px-2.5 py-1">
            Session 2026-27 Active
          </Badge>
        </div>
      </div>

      {/* Class Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 gap-2">
        {classes.map((c) => {
          const isSelected = c.id === selectedClassId;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-102"
                  : "bg-card hover:bg-muted border-border text-foreground"
              }`}
            >
              <div className="font-bold text-xs">{c.name}</div>
              <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? "text-blue-100" : "text-muted-foreground"}`}>
                {formatINR(c.annualFeePaise)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Class Fee Breakdown Card */}
      {activeClass && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Fee Breakdown (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <School className="h-5 w-5 text-blue-600" />
                    <span>{activeClass.name} - Annual Fee Schedule</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Fee components configured for academic year 2026-27.
                  </CardDescription>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground block">Total Annual Fee</span>
                  <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400">
                    {formatINR(activeClass.annualFeePaise)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="py-2.5 px-4 text-left">Fee Head Code</th>
                      <th className="py-2.5 px-4 text-left">Component Particulars</th>
                      <th className="py-2.5 px-4 text-left">Frequency</th>
                      <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parsedHeads.length > 0 ? (
                      parsedHeads.map((head: any, idx: number) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-3 px-4 font-mono font-bold text-foreground">
                            {head.headCode}
                          </td>
                          <td className="py-3 px-4 font-semibold text-foreground">
                            {head.name}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {head.headCode === "TUITION" ? "Split over 10 Months" : "Annual / One-Time"}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                            {formatINR(head.amountPaise)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold text-foreground">TUITION</td>
                        <td className="py-3 px-4 font-semibold text-foreground">Annual Tuition Fee</td>
                        <td className="py-3 px-4 text-muted-foreground">Split over 10 Months</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                          {formatINR(activeClass.annualFeePaise)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold bg-muted/40">
                      <td colSpan={3} className="py-3 px-4 uppercase text-foreground">
                        Total Annual Class Fee:
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-blue-600 dark:text-blue-400">
                        {formatINR(activeClass.annualFeePaise)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Master Fee Heads Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <Card className="border shadow-sm">
              <CardHeader className="border-b py-4 px-5">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span>Master Fee Heads</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Global components reusable across all class fee structures.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-3">
                {feeHeads.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-lg border bg-muted/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-foreground">{h.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        Code: {h.code} • {h.isRecurring ? "Recurring" : "Non-Recurring"}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {formatINR(h.defaultAmountPaise)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
