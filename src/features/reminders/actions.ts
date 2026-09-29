"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ReminderChannel, ReminderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { defaultNotificationProvider, interpolateTemplate } from "@/lib/notifications";
import { formatINR, formatDate } from "@/lib/formatters";

export async function sendBulkReminders(params: {
  studentIds: string[];
  templateId?: string;
  customMessage?: string;
  channel?: ReminderChannel;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const { studentIds, templateId, customMessage, channel = ReminderChannel.WHATSAPP } = params;

  if (!studentIds || studentIds.length === 0) {
    throw new Error("No students selected for reminders");
  }

  const template = templateId
    ? await db.reminderTemplate.findUnique({ where: { id: templateId } })
    : await db.reminderTemplate.findFirst({ where: { isDefault: true } });

  const templateContent =
    customMessage ||
    template?.content ||
    "Dear Parent, this is a reminder from {school}. The pending fee for {student} of ₹{amount} was due on {due_date}. Kindly pay online: {portal_link}";

  const students = await db.student.findMany({
    where: { id: { in: studentIds } },
    include: {
      session: true,
      installments: {
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  const results = {
    total: students.length,
    sent: 0,
    failed: 0,
  };

  for (const s of students) {
    const totalDuePaise = s.installments.reduce(
      (sum, inst) => sum + (inst.amountPaise - inst.paidAmountPaise),
      0
    );
    const earliestDueDate = s.installments[0]?.dueDate || new Date();

    const interpolatedMsg = interpolateTemplate(templateContent, {
      studentName: `${s.firstName} ${s.lastName}`,
      amountFormatted: (totalDuePaise / 100).toLocaleString("en-IN"),
      dueDateFormatted: formatDate(earliestDueDate),
      schoolName: "Arohon Vidya Mandir",
      portalLink: "https://schoolpay.demo/pay",
    });

    try {
      const dispatch = await defaultNotificationProvider.sendMessage(
        s.guardianPhone,
        interpolatedMsg,
        channel
      );

      await db.reminderLog.create({
        data: {
          studentId: s.id,
          sessionId: s.sessionId,
          recipientPhone: s.guardianPhone,
          recipientName: s.guardianName,
          channel,
          templateName: template?.name || "Custom Message",
          messageContent: interpolatedMsg,
          amountDuePaise: totalDuePaise,
          status: dispatch.status,
          providerRef: dispatch.providerRef,
          sentById: session.user.id,
        },
      });

      results.sent++;
    } catch {
      results.failed++;
    }
  }

  // Audit Log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole: (session.user as any).role,
      action: "REMINDERS_DISPATCHED",
      entityType: "ReminderLog",
      details: `Dispatched ${results.sent} ${channel} fee reminders to parents`,
    },
  });

  revalidatePath("/reminders");
  revalidatePath("/dues");
  return results;
}
