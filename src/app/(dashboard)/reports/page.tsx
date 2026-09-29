import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ReportsClient } from "@/features/reports/ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });

  const [classes, feeHeads, allInstallments] = await Promise.all([
    db.class.findMany({
      include: {
        students: {
          where: { sessionId: activeSession?.id, status: "ACTIVE" },
        },
      },
      orderBy: { order: "asc" },
    }),
    db.feeHead.findMany(),
    db.installment.findMany({
      where: { sessionId: activeSession?.id },
      select: {
        amountPaise: true,
        paidAmountPaise: true,
        student: { select: { classId: true } },
      },
    }),
  ]);

  // Compute class-wise aggregates
  const classSummaries = classes.map((c) => {
    const classInsts = allInstallments.filter((i) => i.student.classId === c.id);
    const expected = classInsts.reduce((sum, i) => sum + i.amountPaise, 0);
    const collected = classInsts.reduce((sum, i) => sum + i.paidAmountPaise, 0);
    const due = Math.max(0, expected - collected);
    const recoveryPercent = expected > 0 ? Math.round((collected / expected) * 100) : 0;

    return {
      classId: c.id,
      className: c.name,
      studentCount: c.students.length,
      expectedFeePaise: expected,
      collectedFeePaise: collected,
      dueFeePaise: due,
      recoveryPercent,
    };
  });

  const totalExpected = classSummaries.reduce((sum, c) => sum + c.expectedFeePaise, 0);
  const totalCollected = classSummaries.reduce((sum, c) => sum + c.collectedFeePaise, 0);
  const totalDue = classSummaries.reduce((sum, c) => sum + c.dueFeePaise, 0);

  const headSummaries = feeHeads.map((h) => ({
    code: h.code,
    name: h.name,
    type: h.isRecurring ? "Recurring Monthly" : "Annual One-Time",
    estimatedDemandPaise: h.defaultAmountPaise * 300,
  }));

  return (
    <ReportsClient
      classSummaries={classSummaries}
      headSummaries={headSummaries}
      sessionTotal={{
        totalExpectedFeePaise: totalExpected,
        totalCollectedPaise: totalCollected,
        totalDuePaise: totalDue,
      }}
    />
  );
}
