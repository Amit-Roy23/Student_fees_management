"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ExpenseCategory, PaymentMode, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { startOfDay, endOfDay } from "date-fns";

export async function createExpense(data: {
  title: string;
  category: ExpenseCategory;
  amountPaise: number;
  mode: PaymentMode;
  paymentDate?: string;
  vendorName?: string;
  receiptNo?: string;
  remarks?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (userRole === "VIEWER") throw new Error("Permission denied: Viewers cannot create expenses");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });
  if (!activeSession) throw new Error("No active session");

  const payDate = data.paymentDate ? new Date(data.paymentDate) : new Date();

  const expenseCount = await db.expense.count({ where: { sessionId: activeSession.id } });
  const expReceiptNo = data.receiptNo || `EXP-2026-${String(expenseCount + 1).padStart(4, "0")}`;

  const userId = session.user.id;
  if (!userId) throw new Error("Unauthorized: User ID missing");

  const expense = await db.expense.create({
    data: {
      sessionId: activeSession.id,
      title: data.title,
      category: data.category,
      amountPaise: data.amountPaise,
      mode: data.mode,
      paymentDate: payDate,
      receiptNo: expReceiptNo,
      vendorName: data.vendorName || null,
      remarks: data.remarks || null,
      createdById: userId,
    },
  });

  // If Cash expense, adjust CashBookDay
  if (data.mode === PaymentMode.CASH) {
    const dayStart = startOfDay(payDate);
    const existingCashDay = await db.cashBookDay.findUnique({
      where: {
        sessionId_date: {
          sessionId: activeSession.id,
          date: dayStart,
        },
      },
    });

    if (existingCashDay) {
      await db.cashBookDay.update({
        where: { id: existingCashDay.id },
        data: {
          totalExpensesPaise: { increment: data.amountPaise },
          closingBalancePaise: { decrement: data.amountPaise },
        },
      });
    } else {
      const prevDay = await db.cashBookDay.findFirst({
        where: { sessionId: activeSession.id, date: { lt: dayStart } },
        orderBy: { date: "desc" },
      });
      const opening = prevDay ? prevDay.closingBalancePaise : 0;

      await db.cashBookDay.create({
        data: {
          sessionId: activeSession.id,
          date: dayStart,
          openingBalancePaise: opening,
          totalReceiptsPaise: 0,
          totalExpensesPaise: data.amountPaise,
          closingBalancePaise: opening - data.amountPaise,
          isClosed: false,
        },
      });
    }
  }

  // Audit Log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole,
      action: "EXPENSE_RECORDED",
      entityType: "Expense",
      entityId: expense.id,
      details: `Recorded expense ₹${(data.amountPaise / 100).toLocaleString("en-IN")} for ${data.title} (${data.category}) via ${data.mode}`,
    },
  });

  revalidatePath("/accounts/expenses");
  revalidatePath("/accounts/cash-book");
  revalidatePath("/accounts/day-book");
  revalidatePath("/");

  return { success: true, expenseId: expense.id };
}

export async function closeCashBookDay(dateString: string, remarks?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetDate = startOfDay(new Date(dateString));
  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });
  if (!activeSession) throw new Error("No active session");

  const cashDay = await db.cashBookDay.findUnique({
    where: {
      sessionId_date: {
        sessionId: activeSession.id,
        date: targetDate,
      },
    },
  });

  if (!cashDay) throw new Error("No cash book entry found for this date");

  await db.cashBookDay.update({
    where: { id: cashDay.id },
    data: {
      isClosed: true,
      closedById: session.user.id,
      closedAt: new Date(),
      remarks: remarks || "Day verified and physically closed by cashier",
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole: (session.user as any).role,
      action: "CASH_BOOK_CLOSED",
      entityType: "CashBook",
      entityId: cashDay.id,
      details: `Closed cash book for ${dateString}. Closing balance: ₹${(cashDay.closingBalancePaise / 100).toLocaleString("en-IN")}`,
    },
  });

  revalidatePath("/accounts/cash-book");
  return { success: true };
}

export async function unlockCashBookDay(dayId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") throw new Error("Permission denied: Only Admin / MD can unlock closed cash books");

  const day = await db.cashBookDay.update({
    where: { id: dayId },
    data: {
      isClosed: false,
      closedById: null,
      closedAt: null,
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole,
      action: "CASH_BOOK_UNLOCKED",
      entityType: "CashBook",
      entityId: day.id,
      details: `Unlocked closed cash book for ${day.date.toISOString().split("T")[0]}`,
    },
  });

  revalidatePath("/accounts/cash-book");
  return { success: true };
}
