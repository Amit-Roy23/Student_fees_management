"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculateLateFine } from "@/lib/fees";
import { formatINR, formatDate } from "@/lib/formatters";
import { dictionaries, Locale } from "@/lib/i18n/dictionaries";
import { hasPermission } from "@/lib/permissions";
import { formatReminderMessage } from "./reminder-utils";

export async function getDuesData(selectedClassId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const classes = await db.class.findMany({
    orderBy: { order: "asc" },
  });

  const installments = await db.installment.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL", "OVERDUE"] },
      ...(selectedClassId && selectedClassId !== "ALL"
        ? { student: { classId: selectedClassId } }
        : {}),
    },
    include: {
      student: {
        include: {
          class: true,
          reminderLogs: {
            orderBy: { sentAt: "desc" },
            take: 1,
          },
        },
      },
      fines: {
        where: { isWaived: false },
      },
    },
    orderBy: [
      { dueDate: "asc" },
      { student: { name: "asc" } },
    ],
  });

  const today = new Date();

  const duesList = installments.map((inst) => {
    const remainingPrincipalPaise = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    const fineCalc = calculateLateFine(inst.dueDate, today);
    const finePaise = inst.fines.length > 0 ? inst.fines[0].amountPaise : fineCalc.finePaise;
    const daysOverdue = fineCalc.daysOverdue;
    const isOverdue = daysOverdue > 0 || inst.status === "OVERDUE";
    const totalPayablePaise = remainingPrincipalPaise + finePaise;

    const lastReminder = inst.student.reminderLogs[0];

    return {
      installmentId: inst.id,
      studentId: inst.student.id,
      studentName: inst.student.name,
      admissionNo: inst.student.admissionNo,
      classId: inst.student.classId,
      className: inst.student.class.name,
      guardianName: inst.student.guardianName,
      guardianPhone: inst.student.guardianPhone,
      installmentTitle: inst.title,
      dueDate: inst.dueDate,
      principalPaise: inst.amountPaise,
      paidAmountPaise: inst.paidAmountPaise,
      remainingPrincipalPaise,
      daysOverdue,
      finePaise,
      totalPayablePaise,
      status: isOverdue ? "OVERDUE" : inst.status,
      lastRemindedAt: lastReminder ? lastReminder.sentAt : null,
      lastReminderMessage: lastReminder ? lastReminder.message : null,
    };
  });

  const totalOverdueCount = duesList.filter((d) => d.daysOverdue > 0).length;
  const totalOverduePaise = duesList
    .filter((d) => d.daysOverdue > 0)
    .reduce((sum, d) => sum + d.totalPayablePaise, 0);
  const totalFinesPaise = duesList.reduce((sum, d) => sum + d.finePaise, 0);

  return {
    classes,
    duesList,
    totalOverdueCount,
    totalOverduePaise,
    totalFinesPaise,
  };
}

export async function sendMockReminder(payload: {
  studentId: string;
  installmentId?: string;
  guardianName: string;
  studentName: string;
  amountPaise: number;
  dueDate: Date | string;
  locale?: Locale;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "DUES_VIEW_REMIND")) {
    throw new Error("Permission denied");
  }

  const message = formatReminderMessage(
    payload.guardianName,
    payload.studentName,
    payload.amountPaise,
    payload.dueDate,
    payload.locale || "en"
  );

  const userId = session.user.id;
  if (!userId) throw new Error("Unauthorized");

  const log = await db.reminderLog.create({
    data: {
      studentId: payload.studentId,
      installmentId: payload.installmentId || null,
      message,
      sentById: userId,
      sentAt: new Date(),
    },
  });

  revalidatePath("/dues");

  return {
    success: true,
    message,
    sentAt: log.sentAt,
  };
}

export async function sendBulkOverdueReminders(
  items: {
    studentId: string;
    installmentId: string;
    guardianName: string;
    studentName: string;
    amountPaise: number;
    dueDate: Date | string;
  }[],
  locale: Locale = "en"
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "DUES_VIEW_REMIND")) {
    throw new Error("Permission denied");
  }

  const userId = session.user.id;
  if (!userId) throw new Error("Unauthorized");
  const now = new Date();

  for (const item of items) {
    const message = formatReminderMessage(
      item.guardianName,
      item.studentName,
      item.amountPaise,
      item.dueDate,
      locale
    );

    await db.reminderLog.create({
      data: {
        studentId: item.studentId,
        installmentId: item.installmentId,
        message,
        sentById: userId,
        sentAt: now,
      },
    });
  }

  revalidatePath("/dues");

  return {
    success: true,
    count: items.length,
  };
}
