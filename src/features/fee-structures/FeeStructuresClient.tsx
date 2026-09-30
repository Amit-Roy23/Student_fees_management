"use client";

import * as React from "react";
import { formatINR } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Layers, Edit2 } from "lucide-react";
import { updateClassFee } from "./actions";
import { toast } from "sonner";
import { SCHOOL_CONFIG } from "@/lib/config";
import { useI18n } from "@/lib/i18n";

export function FeeStructuresClient({
  classes,
  userRole,
}: {
  classes: any[];
  userRole: string;
}) {
  const { t } = useI18n();
  const [editingClass, setEditingClass] = React.useState<any | null>(null);
  const [formData, setFormData] = React.useState({
    admissionFeePaise: 0,
    remainingFeePaise: 0,
    installmentCount: 10,
    dueDayOfMonth: 10,
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const isMD = userRole === "MD";

  const handleEditClick = (cls: any) => {
    setEditingClass(cls);
    setFormData({
      admissionFeePaise: cls.admissionFeePaise,
      remainingFeePaise: cls.remainingFeePaise,
      installmentCount: cls.installmentCount,
      dueDayOfMonth: cls.dueDayOfMonth,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setIsSubmitting(true);

    try {
      await updateClassFee({
        classId: editingClass.id,
        admissionFeePaise: Number(formData.admissionFeePaise),
        remainingFeePaise: Number(formData.remainingFeePaise),
        installmentCount: Number(formData.installmentCount),
        dueDayOfMonth: Number(formData.dueDayOfMonth),
      });

      toast.success(`${t.feeStructure.updateSuccess} (${editingClass.name})`);
      setEditingClass(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update fee structure");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.feeStructure.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.feeStructure.subtitle}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 transition-colors">
        <CardHeader className="py-3.5 px-5 border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Class Fee Templates ({SCHOOL_CONFIG.academicSession})</span>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Admission fee (one-time) + remaining fee (split into monthly installments).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-4 text-left font-semibold">{t.feeStructure.classCol}</th>
                <th className="py-2.5 px-4 text-right font-semibold">{t.feeStructure.admissionFeeCol} (₹)</th>
                <th className="py-2.5 px-4 text-right font-semibold">{t.feeStructure.remainingFeeCol} (₹)</th>
                <th className="py-2.5 px-4 text-right font-semibold">Total Annual (₹)</th>
                <th className="py-2.5 px-4 text-center font-semibold">{t.feeStructure.installmentsCol}</th>
                <th className="py-2.5 px-4 text-right font-semibold">Monthly (₹)</th>
                <th className="py-2.5 px-4 text-center font-semibold">{t.feeStructure.dueDayCol}</th>
                {isMD && <th className="py-2.5 px-4 text-center font-semibold">{t.common.actions}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {classes.map((c) => {
                const totalFee = c.admissionFeePaise + c.remainingFeePaise;
                const monthly = Math.round(c.remainingFeePaise / (c.installmentCount || 10));

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(c.admissionFeePaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                      {formatINR(c.remainingFeePaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatINR(totalFee)}
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                      {c.installmentCount} months
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(monthly)}/mo
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500 dark:text-slate-400">
                      {c.dueDayOfMonth}th of month
                    </td>
                    {isMD && (
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(c)}
                          className="h-7 px-2.5 text-xs font-semibold gap-1 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>{t.common.edit}</span>
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {t.feeStructure.editStructure} ({editingClass?.name})
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">{t.feeStructure.admissionFeeCol} (₹) *</label>
              <Input
                type="number"
                required
                value={formData.admissionFeePaise / 100}
                onChange={(e) =>
                  setFormData({ ...formData, admissionFeePaise: Number(e.target.value) * 100 })
                }
                className="text-xs font-mono h-8 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">{t.feeStructure.remainingFeeCol} (₹) *</label>
              <Input
                type="number"
                required
                value={formData.remainingFeePaise / 100}
                onChange={(e) =>
                  setFormData({ ...formData, remainingFeePaise: Number(e.target.value) * 100 })
                }
                className="text-xs font-mono h-8 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.feeStructure.installmentsCol} *</label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={formData.installmentCount}
                  onChange={(e) =>
                    setFormData({ ...formData, installmentCount: Number(e.target.value) })
                  }
                  className="text-xs font-mono h-8 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">{t.feeStructure.dueDayCol} *</label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  required
                  value={formData.dueDayOfMonth}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDayOfMonth: Number(e.target.value) })
                  }
                  className="text-xs font-mono h-8 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
              <div className="flex justify-between font-semibold">
                <span>Total Annual Fee:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {formatINR(Number(formData.admissionFeePaise) + Number(formData.remainingFeePaise))}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span>Monthly Installment:</span>
                <span className="font-mono font-medium">
                  {formatINR(Math.round(Number(formData.remainingFeePaise) / Number(formData.installmentCount || 10)))} / month
                </span>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingClass(null)}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                {t.common.cancel}
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                {isSubmitting ? t.common.loading : t.common.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
