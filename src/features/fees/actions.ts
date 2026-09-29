"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PaymentMode, PaymentStatus, InstallmentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateLateFine, formatReceiptNumber, allocatePayment } from "@/lib/fees";
import { startOfDay } from "date-fns";

export async function searchStudentsForPayment(query: string, sessionId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const q = query.trim();
  if (!q) return [];

  const activeSession = sessionId
    ? { id: sessionId }
    : await db.session.findFirst({ where: { isCurrent: true } });

  const students = await db.student.findMany({
    where: {
      sessionId: activeSession?.id,
      status: "ACTIVE",
      OR: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { admissionNo: { contains: q } },
        { guardianPhone: { contains: q } },
      ],
    },
    include: {
      class: true,
      section: true,
      installments: {
        where: {
          status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIAL, InstallmentStatus.OVERDUE] },
        },
        select: {
          id: true,
          amountPaise: true,
          paidAmountPaise: true,
          status: true,
        },
      },
    },
    take: 10,
  });

  return students.map((s) => {
    const pendingTotal = s.installments.reduce(
      (sum, inst) => sum + (inst.amountPaise - inst.paidAmountPaise),
      0
    );
    const overdueCount = s.installments.filter((inst) => inst.status === "OVERDUE").length;

    return {
      id: s.id,
      admissionNo: s.admissionNo,
      name: `${s.firstName} ${s.lastName}`,
      className: `${s.class.name} - ${s.section.name}`,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      pendingTotalPaise: pendingTotal,
      overdueCount,
    };
  });
}

export async function getStudentFeeCollectionData(studentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
      section: true,
      session: true,
      feePlans: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      installments: {
        orderBy: { monthIndex: "asc" },
        include: {
          fines: {
            where: { isWaived: false },
          },
          allocations: {
            include: { payment: true },
          },
        },
      },
    },
  });

  if (!student) throw new Error("Student not found");

  const today = new Date();

  // Compute live fines for pending/overdue installments
  const installmentsWithLiveFines = student.installments.map((inst) => {
    const pendingPrincipal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    let finePaise = 0;
    let daysOverdue = 0;

    if (inst.fines.length > 0) {
      finePaise = inst.fines.reduce((sum, f) => sum + f.amountPaise, 0);
      daysOverdue = inst.fines[0].daysOverdue;
    } else if (pendingPrincipal > 0) {
      const fineCalc = calculateLateFine(inst.amountPaise, inst.paidAmountPaise, inst.dueDate, today);
      finePaise = fineCalc.finePaise;
      daysOverdue = fineCalc.daysOverdue;
    }

    return {
      ...inst,
      pendingPrincipalPaise: pendingPrincipal,
      finePaise,
      daysOverdue,
      totalDuePaise: pendingPrincipal + finePaise,
    };
  });

  const totalPendingPrincipal = installmentsWithLiveFines.reduce(
    (sum, inst) => sum + inst.pendingPrincipalPaise,
    0
  );
  const totalFineDue = installmentsWithLiveFines.reduce((sum, inst) => sum + inst.finePaise, 0);

  return {
    student,
    installments: installmentsWithLiveFines,
    totals: {
      pendingPrincipalPaise: totalPendingPrincipal,
      fineDuePaise: totalFineDue,
      grandTotalDuePaise: totalPendingPrincipal + totalFineDue,
    },
  };
}

export interface CollectFeePayload {
  studentId: string;
  amountPaise: number;
  mode: PaymentMode;
  transactionRef?: string;
  bankName?: string;
  paymentDate?: string;
  remarks?: string;
  selectedInstallmentIds?: string[];
  waiveFinePaise?: number;
}

export async function collectFee(payload: CollectFeePayload) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (userRole === "VIEWER") {
    throw new Error("Permission denied: Viewers cannot collect fees");
  }

  const { studentId, amountPaise, mode, transactionRef, bankName, paymentDate, remarks } = payload;

  if (amountPaise <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (mode !== PaymentMode.CASH && !transactionRef?.trim()) {
    throw new Error("Transaction Reference / UTR is required for non-cash payment modes");
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      session: true,
      class: true,
      section: true,
      installments: {
        where: {
          status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIAL, InstallmentStatus.OVERDUE] },
        },
        orderBy: { dueDate: "asc" },
        include: {
          fines: { where: { isWaived: false } },
        },
      },
    },
  });

  if (!student) throw new Error("Student not found");

  // Determine sequential receipt number
  const paymentCount = await db.payment.count({
    where: { sessionId: student.sessionId },
  });
  const receiptNo = formatReceiptNumber(student.session.code, paymentCount + 1);

  const payDate = paymentDate ? new Date(paymentDate) : new Date();

  const userId = session.user.id;
  if (!userId) throw new Error("Unauthorized: User ID missing");

  // Create Payment Record
  const payment = await db.payment.create({
    data: {
      receiptNo,
      studentId: student.id,
      sessionId: student.sessionId,
      amountPaise,
      mode,
      transactionRef: transactionRef || null,
      bankName: bankName || null,
      paymentDate: payDate,
      collectedById: userId,
      remarks: remarks || "Fee payment recorded",
      status: PaymentStatus.COMPLETED,
    },
  });

  // Calculate allocation across installments
  const installmentsToAllocate = student.installments.map((inst) => ({
    id: inst.id,
    amountPaise: inst.amountPaise,
    paidAmountPaise: inst.paidAmountPaise,
    finePaise: inst.fines.reduce((sum, f) => sum + f.amountPaise, 0),
    dueDate: inst.dueDate,
  }));

  const allocationResult = allocatePayment(amountPaise, installmentsToAllocate, true);

  for (const alloc of allocationResult.allocations) {
    await db.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        installmentId: alloc.installmentId,
        amountPaise: alloc.principalAmountPaise,
        finePaidPaise: alloc.finePaidPaise,
      },
    });

    const currentInst = student.installments.find((i) => i.id === alloc.installmentId);
    if (currentInst) {
      const newPaidTotal = currentInst.paidAmountPaise + alloc.principalAmountPaise;
      const isFullyPaid = newPaidTotal >= currentInst.amountPaise;

      await db.installment.update({
        where: { id: alloc.installmentId },
        data: {
          paidAmountPaise: newPaidTotal,
          status: isFullyPaid ? InstallmentStatus.PAID : InstallmentStatus.PARTIAL,
        },
      });

      // If fine paid, mark fine waived/settled
      if (alloc.finePaidPaise > 0) {
        await db.fine.updateMany({
          where: { installmentId: alloc.installmentId },
          data: { isWaived: true, waiverReason: `Paid in Receipt ${receiptNo}` },
        });
      }
    }
  }

  // If Cash payment, update or create today's CashBookDay
  if (mode === PaymentMode.CASH) {
    const dayStart = startOfDay(payDate);
    const existingCashDay = await db.cashBookDay.findUnique({
      where: {
        sessionId_date: {
          sessionId: student.sessionId,
          date: dayStart,
        },
      },
    });

    if (existingCashDay) {
      await db.cashBookDay.update({
        where: { id: existingCashDay.id },
        data: {
          totalReceiptsPaise: { increment: amountPaise },
          closingBalancePaise: { increment: amountPaise },
        },
      });
    } else {
      // Find latest previous day closing
      const prevDay = await db.cashBookDay.findFirst({
        where: { sessionId: student.sessionId, date: { lt: dayStart } },
        orderBy: { date: "desc" },
      });
      const opening = prevDay ? prevDay.closingBalancePaise : 0;

      await db.cashBookDay.create({
        data: {
          sessionId: student.sessionId,
          date: dayStart,
          openingBalancePaise: opening,
          totalReceiptsPaise: amountPaise,
          totalExpensesPaise: 0,
          closingBalancePaise: opening + amountPaise,
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
      action: "PAYMENT_COLLECTED",
      entityType: "Payment",
      entityId: payment.id,
      details: `Collected ₹${(amountPaise / 100).toLocaleString("en-IN")} via ${mode} for ${student.firstName} ${student.lastName} (${receiptNo})`,
    },
  });

  revalidatePath("/collect-fee");
  revalidatePath("/students");
  revalidatePath("/dues");
  revalidatePath("/accounts/cash-book");
  revalidatePath("/");

  return {
    success: true,
    paymentId: payment.id,
    receiptNo: payment.receiptNo,
  };
}

export async function reversePayment(paymentId: string, reason: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    throw new Error("Permission denied: Only Admin / MD can reverse a payment");
  }

  if (!reason?.trim()) {
    throw new Error("A valid reason is required to reverse a payment");
  }

  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      allocations: {
        include: { installment: true },
      },
      student: true,
    },
  });

  if (!payment) throw new Error("Payment record not found");
  if (payment.status === PaymentStatus.REVERSED) {
    throw new Error("Payment has already been reversed");
  }

  // Restore installment balances
  for (const alloc of payment.allocations) {
    const inst = alloc.installment;
    const restoredPaid = Math.max(0, inst.paidAmountPaise - alloc.amountPaise);
    const newStatus =
      restoredPaid === 0
        ? inst.dueDate < new Date()
          ? InstallmentStatus.OVERDUE
          : InstallmentStatus.PENDING
        : InstallmentStatus.PARTIAL;

    await db.installment.update({
      where: { id: inst.id },
      data: {
        paidAmountPaise: restoredPaid,
        status: newStatus,
      },
    });
  }

  // Update payment status to REVERSED
  await db.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.REVERSED,
      reversalReason: reason,
      reversedAt: new Date(),
      reversedById: session.user.id,
    },
  });

  // Adjust Cash Book if it was a Cash payment
  if (payment.mode === PaymentMode.CASH) {
    const dayStart = startOfDay(payment.paymentDate);
    const cashDay = await db.cashBookDay.findUnique({
      where: {
        sessionId_date: {
          sessionId: payment.sessionId,
          date: dayStart,
        },
      },
    });

    if (cashDay) {
      await db.cashBookDay.update({
        where: { id: cashDay.id },
        data: {
          totalReceiptsPaise: { decrement: payment.amountPaise },
          closingBalancePaise: { decrement: payment.amountPaise },
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
      action: "PAYMENT_REVERSED",
      entityType: "Payment",
      entityId: payment.id,
      details: `Reversed payment ${payment.receiptNo} of ₹${(payment.amountPaise / 100).toLocaleString("en-IN")}. Reason: ${reason}`,
    },
  });

  revalidatePath("/students");
  revalidatePath("/dues");
  revalidatePath("/accounts/cash-book");
  revalidatePath("/");

  return { success: true };
}

export async function waiveFine(fineId: string, waiverReason: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (userRole !== "ADMIN") {
    throw new Error("Permission denied: Only Admin / MD can waive fines");
  }

  const fine = await db.fine.findUnique({
    where: { id: fineId },
    include: { student: true },
  });

  if (!fine) throw new Error("Fine record not found");

  await db.fine.update({
    where: { id: fineId },
    data: {
      isWaived: true,
      waiverReason,
      waivedById: session.user.id,
      waivedAt: new Date(),
    },
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole,
      action: "FINE_WAIVED",
      entityType: "Fine",
      entityId: fine.id,
      details: `Waived late fine of ₹${(fine.amountPaise / 100).toLocaleString("en-IN")} for ${fine.student.firstName} ${fine.student.lastName}. Reason: ${waiverReason}`,
    },
  });

  revalidatePath("/dues");
  revalidatePath("/students");
  return { success: true };
}
