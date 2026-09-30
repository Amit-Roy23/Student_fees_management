"use client";

import * as React from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/formatters";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  User,
} from "lucide-react";

export function ParentHomeClient({
  childrenData,
}: {
  childrenData: any[];
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t.parent.welcome}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.parent.childrenOverview}
          </p>
        </div>

        <Link href="/parent/pay">
          <Button className="bg-blue-700 hover:bg-blue-800 text-white font-bold gap-2">
            <CreditCard className="h-4 w-4" />
            <span>{t.parent.payOnline}</span>
          </Button>
        </Link>
      </div>

      {/* Children Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {childrenData.map((child) => {
          const hasDues = child.totalOutstandingPaise > 0;
          const isOverdue = child.overdueCount > 0;

          return (
            <Card
              key={child.id}
              className="border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
            >
              <CardHeader className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {child.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {child.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {child.className} • {child.admissionNo}
                      </CardDescription>
                    </div>
                  </div>

                  {isOverdue ? (
                    <Badge variant="destructive" className="font-bold text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>{child.overdueCount} {t.status.overdue}</span>
                    </Badge>
                  ) : hasDues ? (
                    <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs">
                      {t.status.pending}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{t.parent.noDues}</span>
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {/* Fee Breakdown Stats */}
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.students.totalFee}</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                      {formatINR(child.totalFeePaise)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.students.totalPaid}</span>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                      {formatINR(child.totalPaidPaise)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{t.students.totalDue}</span>
                    <div className="text-sm font-bold text-rose-700 dark:text-rose-400 font-mono mt-0.5">
                      {formatINR(child.totalOutstandingPaise)}
                    </div>
                  </div>
                </div>

                {/* Next Due Information */}
                {hasDues ? (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="font-semibold">{t.parent.nextDue}: </span>
                        <span>{child.nextDueMonth} ({formatDate(child.nextDueDate)})</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                      {formatINR(child.nextDueAmountPaise)}
                    </span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>All fees are fully cleared for the current academic session.</span>
                  </div>
                )}

                {/* Card Action */}
                <div className="pt-2">
                  <Link href={`/parent/pay?studentId=${child.id}`}>
                    <Button
                      variant={hasDues ? "default" : "outline"}
                      className={`w-full font-bold gap-2 text-xs h-9 ${
                        hasDues ? "bg-blue-700 hover:bg-blue-800 text-white" : ""
                      }`}
                    >
                      <span>{hasDues ? t.parent.payNow : t.common.view}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
