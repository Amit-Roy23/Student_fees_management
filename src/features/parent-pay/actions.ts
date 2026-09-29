"use server";

import { db } from "@/lib/db";
import { PaymentMode, PaymentStatus, InstallmentStatus } from "@prisma/client";
import { calculateLateFine, formatReceiptNumber, allocatePayment } from "@/lib/fees";
import { defaultPaymentGateway } from "@/lib/payment-gateway";

export async function searchParentStudent(admissionNo: string, guardianPhone: string) {
  const cleanAdm = admissionNo.trim();
  const cleanPhone = guardianPhone.replace(/\D/g, "").slice(-10);

  if (!cleanAdm || !cleanPhone) {
    throw new Error("Please enter both Admission Number and registered 10-digit Phone Number");
  }

  const student = await db.student.findFirst({
    where: {
      admissionNo: { equals: cleanAdm },
      guardianPhone: { contains: cleanPhone },
      status: "ACTIVE",
    },
    include: {
      class: true,
      section: true,
      session: true,
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

  if (!student) {
    throw new Error("No active student found matching this Admission Number and Mobile Number. Please check your school ID card.");
  }

  const today = new Date();

  const installments = student.installments.map((inst) => {
    const pendingPrincipal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    let finePaise = 0;

    if (inst.fines.length > 0) {
      finePaise = inst.fines.reduce((sum, f) => sum + f.amountPaise, 0);
    } else if (pendingPrincipal > 0) {
      const fineCalc = calculateLateFine(inst.amountPaise, inst.paidAmountPaise, inst.dueDate, today);
      finePaise = fineCalc.finePaise;
    }

    return {
      id: inst.id,
      title: inst.title,
      monthName: inst.monthName,
      dueDate: inst.dueDate,
      amountPaise: inst.amountPaise,
      paidAmountPaise: inst.paidAmountPaise,
      pendingPrincipalPaise: pendingPrincipal,
      finePaise,
      totalDuePaise: pendingPrincipal + finePaise,
      status: inst.status,
    };
  });

  const totalDue = installments.reduce((sum, i) => sum + i.totalDuePaise, 0);

  return {
    student: {
      id: student.id,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      firstName: student.firstName,
      lastName: student.lastName,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      class: student.class,
      section: student.section,
      session: student.session,
    },
    installments,
    totalDuePaise: totalDue,
  };
}

export async function processOnlineParentPayment(params: {
  studentId: string;
  amountPaise: number;
  paymentMethod: "UPI" | "CARD" | "NETBANKING";
  gatewayTxnId: string;
}) {
  const { studentId, amountPaise, paymentMethod, gatewayTxnId } = params;

  if (amountPaise <= 0) throw new Error("Invalid payment amount");

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      session: true,
      class: true,
      section: true,
      installments: {
        where: { status: { in: ["PENDING", "PARTIAL", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
        include: { fines: { where: { isWaived: false } } },
      },
    },
  });

  if (!student) throw new Error("Student not found");

  // Get Admin user for system-collected record
  const adminUser = await db.user.findFirst({ where: { role: "ADMIN" } });
  const paymentCount = await db.payment.count({ where: { sessionId: student.sessionId } });
  const receiptNo = formatReceiptNumber(student.session.code, paymentCount + 1);

  // Record Payment
  const payment = await db.payment.create({
    data: {
      receiptNo,
      studentId: student.id,
      sessionId: student.sessionId,
      amountPaise,
      mode: PaymentMode.ONLINE_GATEWAY,
      transactionRef: gatewayTxnId,
      bankName: `Online Gateway (${paymentMethod})`,
      paymentDate: new Date(),
      collectedById: adminUser?.id || "system",
      remarks: `Parent Online Payment via ${paymentMethod} (Ref: ${gatewayTxnId})`,
      status: PaymentStatus.COMPLETED,
    },
  });

  // Allocate across pending installments
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

      if (alloc.finePaidPaise > 0) {
        await db.fine.updateMany({
          where: { installmentId: alloc.installmentId },
          data: { isWaived: true, waiverReason: `Paid online in Receipt ${receiptNo}` },
        });
      }
    }
  }

  // Audit Log
  await db.auditLog.create({
    data: {
      action: "PARENT_ONLINE_PAYMENT",
      entityType: "Payment",
      entityId: payment.id,
      details: `Parent paid ₹${(amountPaise / 100).toLocaleString("en-IN")} online for ${student.firstName} ${student.lastName} (${receiptNo})`,
    },
  });

  return {
    success: true,
    paymentId: payment.id,
    receiptNo: payment.receiptNo,
  };
}
