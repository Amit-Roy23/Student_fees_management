import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DashboardClient } from "@/features/dashboard/DashboardClient";
import { startOfMonth, startOfDay } from "date-fns";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({
    where: { isCurrent: true },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const todayStart = startOfDay(now);

  // 1. Fetch KPI aggregates
  const [
    totalSessionCollected,
    totalMonthCollected,
    totalTodayCollected,
    totalStudents,
    allInstallments,
    allFines,
    recentPayments,
  ] = await Promise.all([
    // Total Session Collections
    db.payment.aggregate({
      where: { sessionId: activeSession?.id, status: "COMPLETED" },
      _sum: { amountPaise: true },
    }),
    // This Month Collections
    db.payment.aggregate({
      where: {
        sessionId: activeSession?.id,
        status: "COMPLETED",
        paymentDate: { gte: monthStart },
      },
      _sum: { amountPaise: true },
    }),
    // Today Collections
    db.payment.aggregate({
      where: {
        sessionId: activeSession?.id,
        status: "COMPLETED",
        paymentDate: { gte: todayStart },
      },
      _sum: { amountPaise: true },
    }),
    // Student Count
    db.student.count({
      where: { sessionId: activeSession?.id, status: "ACTIVE" },
    }),
    // All Installments for session
    db.installment.findMany({
      where: { sessionId: activeSession?.id },
      select: {
        studentId: true,
        amountPaise: true,
        paidAmountPaise: true,
        status: true,
        monthName: true,
        monthIndex: true,
      },
    }),
    // All Fines
    db.fine.findMany({
      where: { sessionId: activeSession?.id },
      select: { amountPaise: true, isWaived: true },
    }),
    // Recent Payments
    db.payment.findMany({
      where: { sessionId: activeSession?.id, status: "COMPLETED" },
      include: {
        student: {
          include: { class: true, section: true },
        },
      },
      orderBy: { paymentDate: "desc" },
      take: 8,
    }),
  ]);

  // Compute total outstanding and overdue amount
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

  const totalFinesCollected = allFines
    .filter((f) => f.isWaived)
    .reduce((sum, f) => sum + f.amountPaise, 0);

  // 2. Fetch payment mode split
  const modeGroups = await db.payment.groupBy({
    by: ["mode"],
    where: { sessionId: activeSession?.id, status: "COMPLETED" },
    _sum: { amountPaise: true },
  });

  const totalCollectedSum = totalSessionCollected._sum.amountPaise || 1;
  const modeSplitData = modeGroups.map((m) => {
    const val = m._sum.amountPaise || 0;
    return {
      name: m.mode.replace("_", " "),
      value: val,
      percent: Math.round((val / totalCollectedSum) * 100),
    };
  });

  // 3. Monthly Trend Chart (April to Jan)
  const monthNames = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January"];
  const monthlyChartData = monthNames.map((mName, idx) => {
    const monthInsts = allInstallments.filter((i) => i.monthIndex === idx + 1);
    const expected = monthInsts.reduce((sum, i) => sum + i.amountPaise, 0);
    const collected = monthInsts.reduce((sum, i) => sum + i.paidAmountPaise, 0);

    return {
      month: mName.slice(0, 3),
      expectedLakhs: Number((expected / 10000000).toFixed(2)),
      collectedLakhs: Number((collected / 10000000).toFixed(2)),
    };
  });

  // 4. Fetch Top Defaulters
  const topDefaulterIds = Array.from(defaulterStudentMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((e) => e[0]);

  const topDefaulterStudents = await db.student.findMany({
    where: { id: { in: topDefaulterIds } },
    include: { class: true, section: true },
  });

  const formattedTopDefaulters = topDefaulterStudents
    .map((s) => ({
      id: s.id,
      admissionNo: s.admissionNo,
      firstName: s.firstName,
      lastName: s.lastName,
      class: s.class,
      guardianPhone: s.guardianPhone,
      totalDuePaise: defaulterStudentMap.get(s.id) || 0,
    }))
    .sort((a, b) => b.totalDuePaise - a.totalDuePaise);

  return (
    <DashboardClient
      sessionCode={activeSession?.code || "2026-27"}
      kpis={{
        totalSessionCollectedPaise: totalSessionCollected._sum.amountPaise || 0,
        totalMonthCollectedPaise: totalMonthCollected._sum.amountPaise || 0,
        totalTodayCollectedPaise: totalTodayCollected._sum.amountPaise || 0,
        totalOutstandingPaise: totalOutstanding,
        totalOverduePaise: totalOverdue,
        totalFinesCollectedPaise: totalFinesCollected,
        defaulterCount: defaulterStudentMap.size,
        totalStudents,
      }}
      monthlyChartData={monthlyChartData}
      modeSplitData={modeSplitData}
      classDuesData={[]}
      recentPayments={recentPayments}
      topDefaulters={formattedTopDefaulters}
    />
  );
}
