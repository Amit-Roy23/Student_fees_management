"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PaymentMode, PaymentSource } from "@prisma/client";
import { startOfDay, endOfDay, parseISO } from "date-fns";

export async function getCashBookEntries(startDateStr?: string, endDateStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  const now = new Date();

  // Enforce server-side rule: Clerk gets Today Only unless specific dates provided
  const isClerk = userRole === "CLERK";
  const start = isClerk
    ? startOfDay(now)
    : startDateStr
    ? startOfDay(parseISO(startDateStr))
    : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = isClerk ? endOfDay(now) : endDateStr ? endOfDay(parseISO(endDateStr)) : endOfDay(now);

  const payments = await db.payment.findMany({
    where: {
      mode: PaymentMode.CASH,
      paymentDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      student: {
        include: {
          class: true,
        },
      },
      collectedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      paymentDate: "asc",
    },
  });

  let runningTotalPaise = 0;
  const entriesWithRunning = payments.map((p) => {
    runningTotalPaise += p.amountPaise;
    return {
      id: p.id,
      receiptNo: p.receiptNo,
      date: p.paymentDate,
      studentId: p.studentId,
      studentName: p.student.name,
      admissionNo: p.student.admissionNo,
      className: p.student.class.name,
      amountPaise: p.amountPaise,
      txnRef: p.txnRef,
      remarks: p.remarks,
      collectedByName: p.collectedBy?.name || "Counter Cashier",
      runningTotalPaise,
    };
  });

  // Group by date for per-day totals
  const dayGroupsMap = new Map<string, { date: string; dayTotalPaise: number; count: number }>();
  for (const entry of entriesWithRunning) {
    const dayKey = new Date(entry.date).toISOString().split("T")[0];
    const existing = dayGroupsMap.get(dayKey) || { date: dayKey, dayTotalPaise: 0, count: 0 };
    existing.dayTotalPaise += entry.amountPaise;
    existing.count += 1;
    dayGroupsMap.set(dayKey, existing);
  }

  const dayTotals = Array.from(dayGroupsMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  return {
    entries: entriesWithRunning.reverse(), // most recent at top for viewing
    dayTotals,
    totalCashPaise: runningTotalPaise,
    totalTransactions: payments.length,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    isClerk,
  };
}

export async function getOnlineBookEntries(startDateStr?: string, endDateStr?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  const now = new Date();

  const isClerk = userRole === "CLERK";
  const start = isClerk
    ? startOfDay(now)
    : startDateStr
    ? startOfDay(parseISO(startDateStr))
    : startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const end = isClerk ? endOfDay(now) : endDateStr ? endOfDay(parseISO(endDateStr)) : endOfDay(now);

  const payments = await db.payment.findMany({
    where: {
      mode: PaymentMode.ONLINE,
      paymentDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      student: {
        include: {
          class: true,
        },
      },
      collectedBy: {
        select: {
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      paymentDate: "asc",
    },
  });

  let runningTotalPaise = 0;
  const entriesWithRunning = payments.map((p) => {
    runningTotalPaise += p.amountPaise;
    return {
      id: p.id,
      receiptNo: p.receiptNo,
      date: p.paymentDate,
      studentId: p.studentId,
      studentName: p.student.name,
      admissionNo: p.student.admissionNo,
      className: p.student.class.name,
      amountPaise: p.amountPaise,
      method: p.method,
      source: p.source,
      txnRef: p.txnRef || p.gatewayPaymentId,
      gatewayOrderId: p.gatewayOrderId,
      gatewayPaymentId: p.gatewayPaymentId,
      remarks: p.remarks,
      collectedByName:
        p.collectedBy?.name ||
        (p.source === PaymentSource.PARENT ? "Parent Online Portal" : "Online Gateway"),
      runningTotalPaise,
    };
  });

  // Group by date for per-day totals
  const dayGroupsMap = new Map<string, { date: string; dayTotalPaise: number; count: number }>();
  for (const entry of entriesWithRunning) {
    const dayKey = new Date(entry.date).toISOString().split("T")[0];
    const existing = dayGroupsMap.get(dayKey) || { date: dayKey, dayTotalPaise: 0, count: 0 };
    existing.dayTotalPaise += entry.amountPaise;
    existing.count += 1;
    dayGroupsMap.set(dayKey, existing);
  }

  const dayTotals = Array.from(dayGroupsMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  return {
    entries: entriesWithRunning.reverse(),
    dayTotals,
    totalOnlinePaise: runningTotalPaise,
    totalTransactions: payments.length,
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
    isClerk,
  };
}

export async function getPaymentReceiptData(paymentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      student: {
        include: {
          class: true,
        },
      },
      collectedBy: {
        select: {
          name: true,
          role: true,
        },
      },
      allocations: {
        include: {
          installment: true,
        },
      },
    },
  });

  if (!payment) throw new Error("Payment record not found");

  const userRole = (session.user as any).role;
  const userId = session.user.id;
  if (userRole === "PARENT" && payment.student.parentUserId !== userId) {
    throw new Error("Unauthorized access to receipt");
  }

  return {
    id: payment.id,
    receiptNo: payment.receiptNo,
    paymentDate: payment.paymentDate,
    amountPaise: payment.amountPaise,
    mode: payment.mode,
    txnRef: payment.txnRef || payment.gatewayPaymentId || null,
    remarks: payment.remarks,
    student: {
      admissionNo: payment.student.admissionNo,
      name: payment.student.name,
      guardianName: payment.student.guardianName,
      guardianPhone: payment.student.guardianPhone,
      class: { name: payment.student.class.name },
    },
    collectedBy: payment.collectedBy || {
      name: payment.source === PaymentSource.PARENT ? "Parent Online Portal" : "School Office",
      role: "STAFF",
    },
    allocations: payment.allocations.map((a) => ({
      amountPaise: a.amountPaise,
      finePaidPaise: a.finePaidPaise,
      installment: {
        title: a.installment.title,
        monthName: a.installment.monthName,
      },
    })),
  };
}
