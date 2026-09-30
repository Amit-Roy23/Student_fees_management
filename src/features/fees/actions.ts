"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PaymentMode, PaymentMethod, PaymentSource, InstallmentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { calculateLateFine, formatReceiptNumber, allocatePayment } from "@/lib/fees";
import { SESSION_CODE } from "@/lib/config";
import { hasPermission } from "@/lib/permissions";

export async function searchStudentsForPayment(query: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const q = query.trim();
  if (!q) return [];

  const students = await db.student.findMany({
    where: {
      OR: [
        { name: { contains: q } },
        { admissionNo: { contains: q } },
        { guardianPhone: { contains: q } },
      ],
    },
    include: {
      class: true,
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
      name: s.name,
      className: s.class.name,
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
      const fineCalc = calculateLateFine(inst.dueDate, today);
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
  txnRef?: string;
  paymentDate?: string;
  remarks?: string;
}

export async function collectFee(payload: CollectFeePayload) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "COLLECT_FEE")) {
    throw new Error("Permission denied: You do not have permission to collect fees");
  }

  const { studentId, amountPaise, mode, txnRef, paymentDate, remarks } = payload;

  if (amountPaise <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  if (mode === PaymentMode.ONLINE && !txnRef?.trim()) {
    throw new Error("Transaction ID / UTR is required for Online payment");
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      class: true,
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

  const paymentCount = await db.payment.count();
  const receiptNo = formatReceiptNumber(SESSION_CODE, paymentCount + 1);
  const payDate = paymentDate ? new Date(paymentDate) : new Date();

  const userId = session.user.id;
  if (!userId) throw new Error("Unauthorized: User ID missing");

  // Create Payment Record
  const payment = await db.payment.create({
    data: {
      receiptNo,
      studentId: student.id,
      amountPaise,
      mode,
      method: mode === PaymentMode.ONLINE ? PaymentMethod.UPI : PaymentMethod.CASH,
      source: PaymentSource.STAFF,
      txnRef: txnRef?.trim() || null,
      paymentDate: payDate,
      collectedById: userId,
      remarks: remarks?.trim() || null,
    },
  });

  // Calculate allocation across pending installments
  const installmentsToAllocate = student.installments.map((inst) => ({
    id: inst.id,
    amountPaise: inst.amountPaise,
    paidAmountPaise: inst.paidAmountPaise,
    finePaise: inst.fines.reduce((sum, f) => sum + f.amountPaise, 0),
    dueDate: inst.dueDate,
  }));

  const allocationResult = allocatePayment(amountPaise, installmentsToAllocate);

  const receiptAllocations: {
    amountPaise: number;
    finePaidPaise: number;
    installment: { title: string; monthName: string };
  }[] = [];

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

      if (alloc.finePaidPaise > 0) {
        await db.fine.updateMany({
          where: { installmentId: alloc.installmentId },
          data: { isWaived: true, waiverReason: `Paid in Receipt ${receiptNo}` },
        });
      }

      receiptAllocations.push({
        amountPaise: alloc.principalAmountPaise,
        finePaidPaise: alloc.finePaidPaise,
        installment: {
          title: currentInst.title,
          monthName: currentInst.monthName,
        },
      });
    }
  }

  revalidatePath("/collect-fee");
  revalidatePath("/students");
  revalidatePath("/dues");
  revalidatePath("/cash-book");
  revalidatePath("/");

  return {
    success: true,
    paymentId: payment.id,
    receiptNo: payment.receiptNo,
    receipt: {
      id: payment.id,
      receiptNo: payment.receiptNo,
      paymentDate: payment.paymentDate,
      amountPaise: payment.amountPaise,
      mode: payment.mode,
      txnRef: payment.txnRef,
      remarks: payment.remarks,
      student: {
        admissionNo: student.admissionNo,
        name: student.name,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        class: { name: student.class.name },
      },
      collectedBy: {
        name: session.user.name || "Accountant",
        role: userRole,
      },
      allocations: receiptAllocations,
    },
  };
}
