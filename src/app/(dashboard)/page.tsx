import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClient } from "@/features/dashboard/DashboardClient";
import { startOfMonth } from "date-fns";
import { SCHOOL_CONFIG } from "@/lib/config";
import { hasPermission } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "DASHBOARD_VIEW")) {
    redirect("/collect-fee");
  }

  const now = new Date();
  const monthStart = startOfMonth(now);

  // Parallel database aggregates
  const [
    monthCollectedAgg,
    totalStudents,
    allInstallments,
    finesAgg,
    recentPayments,
  ] = await Promise.all([
    db.payment.aggregate({
      where: { paymentDate: { gte: monthStart } },
      _sum: { amountPaise: true },
    }),
    db.student.count(),
    db.installment.findMany({
      select: {
        studentId: true,
        amountPaise: true,
        paidAmountPaise: true,
        status: true,
        monthName: true,
        monthIndex: true,
      },
    }),
    db.fine.aggregate({
      where: { isWaived: false },
      _sum: { amountPaise: true },
    }),
    db.payment.findMany({
      include: {
        student: {
          include: { class: true },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 6,
    }),
  ]);

  let totalOutstanding = 0;
  let totalOverdue = 0;
  const defaulterStudentMap = new Map<string, number>();

  for (const inst of allInstallments) {
    const pending = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    if (pending > 0) {
      totalOutstanding += pending;
      if (inst.status === "OVERDUE") {
        totalOverdue += pending;
      }
      defaulterStudentMap.set(
        inst.studentId,
        (defaulterStudentMap.get(inst.studentId) || 0) + pending
      );
    }
  }

  const topDefaulterIds = Array.from(defaulterStudentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);

  const topDefaulterStudents = await db.student.findMany({
    where: { id: { in: topDefaulterIds } },
    include: { class: true },
  });

  const formattedTopDefaulters = topDefaulterStudents
    .map((s) => ({
      id: s.id,
      admissionNo: s.admissionNo,
      name: s.name,
      class: s.class,
      guardianPhone: s.guardianPhone,
      totalDuePaise: defaulterStudentMap.get(s.id) || 0,
    }))
    .sort((a, b) => b.totalDuePaise - a.totalDuePaise);

  return (
    <DashboardClient
      sessionCode={SCHOOL_CONFIG.academicSession}
      kpis={{
        totalMonthCollectedPaise: monthCollectedAgg._sum.amountPaise || 0,
        totalOutstandingPaise: totalOutstanding,
        totalOverduePaise: totalOverdue,
        totalFinesCollectedPaise: finesAgg._sum.amountPaise || 0,
        defaulterCount: defaulterStudentMap.size,
        totalStudents,
      }}
      recentPayments={recentPayments}
      topDefaulters={formattedTopDefaulters}
    />
  );
}
