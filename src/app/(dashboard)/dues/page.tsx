import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DuesClient } from "@/features/dues/DuesClient";

export default async function DuesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });

  const [classes, templates, studentsWithDues] = await Promise.all([
    db.class.findMany({
      include: { sections: true },
      orderBy: { order: "asc" },
    }),
    db.reminderTemplate.findMany(),
    db.student.findMany({
      where: {
        sessionId: activeSession?.id,
        installments: {
          some: {
            status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          },
        },
      },
      include: {
        class: true,
        section: true,
        installments: {
          where: {
            status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
          },
          include: {
            fines: { where: { isWaived: false } },
          },
        },
      },
    }),
  ]);

  // Compute defaulter metadata
  const defaulters = studentsWithDues
    .map((s) => {
      const principalDue = s.installments.reduce(
        (sum, inst) => sum + (inst.amountPaise - inst.paidAmountPaise),
        0
      );
      const fineDue = s.installments.reduce(
        (sum, inst) => sum + inst.fines.reduce((fSum, f) => fSum + f.amountPaise, 0),
        0
      );
      const overdueInsts = s.installments.filter((inst) => inst.status === "OVERDUE");
      const maxDaysOverdue = overdueInsts.length > 0
        ? Math.max(...overdueInsts.map((i) => i.fines[0]?.daysOverdue || 15))
        : 0;

      return {
        id: s.id,
        admissionNo: s.admissionNo,
        rollNo: s.rollNo,
        firstName: s.firstName,
        lastName: s.lastName,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        classId: s.classId,
        class: s.class,
        section: s.section,
        principalDuePaise: principalDue,
        fineDuePaise: fineDue,
        totalDuePaise: principalDue + fineDue,
        overdueCount: overdueInsts.length,
        daysOverdue: maxDaysOverdue,
      };
    })
    .filter((d) => d.totalDuePaise > 0)
    .sort((a, b) => b.totalDuePaise - a.totalDuePaise);

  return (
    <DuesClient
      defaulters={defaulters}
      classes={classes}
      templates={templates}
    />
  );
}
