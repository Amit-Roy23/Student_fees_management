"use server";

import { db } from "@/lib/db";
import { PaymentMode, PaymentStatus, InstallmentStatus } from "@prisma/client";
import { calculateLateFine, formatReceiptNumber, allocatePayment } from "@/lib/fees";

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
      feePlans: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      installments: {
        orderBy: { monthIndex: "asc" },
        include: {
          fines: { where: { isWaived: false } },
        },
      },
      payments: {
        where: { status: "COMPLETED" },
        orderBy: { paymentDate: "desc" },
        include: {
          collectedBy: { select: { name: true } },
          allocations: {
            include: {
              installment: { select: { title: true, monthName: true } },
            },
          },
        },
      },
    },
  });

  if (!student) {
    throw new Error("No active student found matching this Admission Number and Mobile Number. Please check your school ID card or receipt.");
  }

  const today = new Date();

  // Process all installments
  const allInstallments = student.installments.map((inst) => {
    const pendingPrincipal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    let finePaise = 0;

    if (inst.fines.length > 0) {
      finePaise = inst.fines.reduce((sum, f) => sum + f.amountPaise, 0);
    } else if (pendingPrincipal > 0 && inst.status === "OVERDUE") {
      const fineCalc = calculateLateFine(inst.amountPaise, inst.paidAmountPaise, inst.dueDate, today);
      finePaise = fineCalc.finePaise;
    }

    return {
      id: inst.id,
      title: inst.title,
      monthName: inst.monthName,
      monthIndex: inst.monthIndex,
      dueDate: inst.dueDate,
      amountPaise: inst.amountPaise,
      paidAmountPaise: inst.paidAmountPaise,
      pendingPrincipalPaise: pendingPrincipal,
      finePaise,
      totalDuePaise: pendingPrincipal + finePaise,
      status: inst.status,
    };
  });

  // Pending installments available for online payment
  const pendingInstallments = allInstallments.filter(
    (i) => i.status === "PENDING" || i.status === "PARTIAL" || i.status === "OVERDUE" || i.totalDuePaise > 0
  );

  const totalFeePaise = student.feePlans[0]?.totalFeePaise || student.class.annualFeePaise || 4200000;
  const totalPaidPaise = allInstallments.reduce((sum, i) => sum + i.paidAmountPaise, 0);
  const totalDuePaise = pendingInstallments.reduce((sum, i) => sum + i.totalDuePaise, 0);
  const totalFinePaise = pendingInstallments.reduce((sum, i) => sum + i.finePaise, 0);
  const paidPercent = totalFeePaise > 0 ? Math.min(100, Math.round((totalPaidPaise / totalFeePaise) * 100)) : 0;

  // Format past payment receipts
  const receipts = student.payments.map((p) => ({
    id: p.id,
    receiptNo: p.receiptNo,
    paymentDate: p.paymentDate,
    amountPaise: p.amountPaise,
    mode: p.mode,
    transactionRef: p.transactionRef || "-",
    bankName: p.bankName || "School Counter",
    remarks: p.remarks || "School Fee Payment",
    collectedBy: { name: p.collectedBy?.name || "School Office" },
    student: {
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      firstName: student.firstName,
      lastName: student.lastName,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      class: { name: student.class.name },
      section: { name: student.section.name },
    },
    session: {
      code: student.session.code,
      name: student.session.name,
    },
    allocations: p.allocations.map((a) => ({
      amountPaise: a.amountPaise,
      finePaidPaise: a.finePaidPaise,
      installment: {
        title: a.installment.title,
        monthName: a.installment.monthName,
      },
    })),
  }));

  return {
    student: {
      id: student.id,
      admissionNo: student.admissionNo,
      rollNo: student.rollNo,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianEmail: student.guardianEmail,
      address: student.address,
      city: student.city,
      class: student.class,
      section: student.section,
      session: student.session,
    },
    installments: pendingInstallments,
    allInstallments,
    receipts,
    summary: {
      totalFeePaise,
      totalPaidPaise,
      totalDuePaise,
      totalFinePaise,
      paidPercent,
    },
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
