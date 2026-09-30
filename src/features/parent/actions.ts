"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { calculateLateFine, formatReceiptNumber, allocatePayment } from "@/lib/fees";
import { SESSION_CODE } from "@/lib/config";
import { paymentGateway } from "@/lib/payment-gateway";
import { PaymentMode, PaymentMethod, PaymentSource, PaymentOrderStatus, InstallmentStatus } from "@prisma/client";

export async function getParentDashboardData() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  if (userRole !== "PARENT") {
    throw new Error("Access restricted to parents only");
  }

  const children = await db.student.findMany({
    where: { parentUserId: userId },
    include: {
      class: true,
      feePlans: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      installments: {
        orderBy: { dueDate: "asc" },
        include: {
          fines: { where: { isWaived: false } },
        },
      },
    },
  });

  const today = new Date();

  return children.map((child) => {
    const feePlan = child.feePlans[0];
    const admissionFee = feePlan?.admissionFeePaise || 0;
    const remainingFee = feePlan?.remainingFeePaise || 0;
    const totalFeePaise = admissionFee + remainingFee;

    const totalPaidPaise = child.installments.reduce((sum, i) => sum + i.paidAmountPaise, 0);
    const totalPrincipalDuePaise = child.installments.reduce(
      (sum, i) => sum + Math.max(0, i.amountPaise - i.paidAmountPaise),
      0
    );

    let totalFinePaise = 0;
    let overdueCount = 0;
    let nextDueInstallment: any = null;

    child.installments.forEach((inst) => {
      const pendingPrincipal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
      if (pendingPrincipal > 0) {
        const fineCalc = calculateLateFine(inst.dueDate, today);
        const fine = inst.fines.length > 0 ? inst.fines[0].amountPaise : fineCalc.finePaise;
        if (fineCalc.daysOverdue > 0 || inst.status === "OVERDUE") {
          overdueCount++;
          totalFinePaise += fine;
        }
        if (!nextDueInstallment) {
          nextDueInstallment = inst;
        }
      }
    });

    return {
      id: child.id,
      name: child.name,
      admissionNo: child.admissionNo,
      className: child.class.name,
      guardianName: child.guardianName,
      guardianPhone: child.guardianPhone,
      totalFeePaise,
      totalPaidPaise,
      totalOutstandingPaise: totalPrincipalDuePaise + totalFinePaise,
      overdueCount,
      totalFinePaise,
      nextDueDate: nextDueInstallment?.dueDate || null,
      nextDueMonth: nextDueInstallment?.monthName || null,
      nextDueAmountPaise: nextDueInstallment
        ? Math.max(0, nextDueInstallment.amountPaise - nextDueInstallment.paidAmountPaise)
        : 0,
    };
  });
}

export async function getChildInstallments(studentId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  if (userRole !== "PARENT") {
    throw new Error("Access restricted to parents only");
  }

  const student = await db.student.findFirst({
    where: { id: studentId, parentUserId: userId },
    include: {
      class: true,
      installments: {
        orderBy: { monthIndex: "asc" },
        include: {
          fines: { where: { isWaived: false } },
        },
      },
    },
  });

  if (!student) {
    throw new Error("Student record not found or not linked to your parent account");
  }

  const today = new Date();

  const installments = student.installments.map((inst) => {
    const pendingPrincipal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    let finePaise = 0;
    let daysOverdue = 0;

    if (inst.fines.length > 0) {
      finePaise = inst.fines[0].amountPaise;
      daysOverdue = inst.fines[0].daysOverdue;
    } else if (pendingPrincipal > 0) {
      const fineCalc = calculateLateFine(inst.dueDate, today);
      finePaise = fineCalc.finePaise;
      daysOverdue = fineCalc.daysOverdue;
    }

    const isOverdue = daysOverdue > 0 || inst.status === "OVERDUE";
    const totalDuePaise = pendingPrincipal + finePaise;

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
      daysOverdue,
      totalDuePaise,
      status: inst.paidAmountPaise >= inst.amountPaise ? "PAID" : isOverdue ? "OVERDUE" : inst.status,
      isPayable: pendingPrincipal > 0,
    };
  });

  return {
    student: {
      id: student.id,
      name: student.name,
      admissionNo: student.admissionNo,
      className: student.class.name,
    },
    installments,
  };
}

export async function createParentOrder(payload: { studentId: string; installmentIds: string[] }) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  if (userRole !== "PARENT") {
    throw new Error("Access restricted to parents only");
  }

  const { studentId, installmentIds } = payload;
  if (!installmentIds || installmentIds.length === 0) {
    throw new Error("Please select at least one installment to pay");
  }

  // Validate student ownership
  const student = await db.student.findFirst({
    where: { id: studentId, parentUserId: userId },
    include: {
      installments: {
        where: { id: { in: installmentIds } },
        include: { fines: { where: { isWaived: false } } },
      },
    },
  });

  if (!student || student.installments.length === 0) {
    throw new Error("Selected student or installments not found");
  }

  const today = new Date();

  // SERVER-SIDE Amount Computation (Never trust client amount)
  let calculatedTotalPaise = 0;
  for (const inst of student.installments) {
    const pendingPrincipal = Math.max(0, inst.amountPaise - inst.paidAmountPaise);
    let finePaise = 0;
    if (inst.fines.length > 0) {
      finePaise = inst.fines[0].amountPaise;
    } else if (pendingPrincipal > 0) {
      const fineCalc = calculateLateFine(inst.dueDate, today);
      finePaise = fineCalc.finePaise;
    }
    calculatedTotalPaise += pendingPrincipal + finePaise;
  }

  if (calculatedTotalPaise <= 0) {
    throw new Error("Selected installments have already been paid");
  }

  // Call mock payment gateway
  const orderResult = await paymentGateway.createOrder({
    studentId: student.id,
    installmentIds,
    amountPaise: calculatedTotalPaise,
  });

  // Record PaymentOrder in database
  const paymentOrder = await db.paymentOrder.create({
    data: {
      orderId: orderResult.orderId,
      studentId: student.id,
      parentUserId: userId,
      amountPaise: calculatedTotalPaise,
      status: PaymentOrderStatus.CREATED,
      installmentIds: JSON.stringify(installmentIds),
    },
  });

  return {
    orderId: paymentOrder.orderId,
    amountPaise: calculatedTotalPaise,
    currency: "INR",
    studentName: student.name,
    installmentIds,
  };
}

export async function verifyAndRecordParentPayment(payload: {
  orderId: string;
  paymentId: string;
  signature: string;
  method: "UPI" | "NETBANKING" | "CARD" | "BANK_TRANSFER";
  txnRef?: string;
  bankDetails?: { utr: string; transferDate: string };
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const { orderId, paymentId, signature, method, txnRef, bankDetails } = payload;

  const order = await db.paymentOrder.findUnique({
    where: { orderId },
    include: {
      student: {
        include: {
          class: true,
          installments: {
            where: {
              status: { in: [InstallmentStatus.PENDING, InstallmentStatus.PARTIAL, InstallmentStatus.OVERDUE] },
            },
            orderBy: { dueDate: "asc" },
            include: { fines: { where: { isWaived: false } } },
          },
        },
      },
    },
  });

  if (!order || order.parentUserId !== userId) {
    throw new Error("Payment order not found or unauthorized");
  }

  // Idempotency: If already paid, return existing receipt details
  if (order.status === PaymentOrderStatus.PAID) {
    const existing = await db.payment.findUnique({
      where: { paymentOrderId: order.id },
    });
    if (existing) {
      return {
        success: true,
        paymentId: existing.id,
        receiptNo: existing.receiptNo,
      };
    }
  }

  // Signature verification (for demo, bank transfers use mock signature or UTR validation)
  const isValid = paymentGateway.verifyPayment({
    orderId,
    paymentId,
    signature,
  });

  if (!isValid && method !== "BANK_TRANSFER") {
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: PaymentOrderStatus.FAILED },
    });
    throw new Error("Payment verification failed. Invalid signature.");
  }

  // Determine sequential receipt number
  const paymentCount = await db.payment.count();
  const receiptNo = formatReceiptNumber(SESSION_CODE, paymentCount + 1);

  const finalTxnRef = method === "BANK_TRANSFER" ? bankDetails?.utr || txnRef : txnRef || paymentId;

  // Create official Payment record
  const payment = await db.payment.create({
    data: {
      receiptNo,
      studentId: order.studentId,
      amountPaise: order.amountPaise,
      mode: PaymentMode.ONLINE,
      method: method as PaymentMethod,
      source: PaymentSource.PARENT,
      txnRef: finalTxnRef || paymentId,
      gatewayOrderId: order.orderId,
      gatewayPaymentId: paymentId,
      gatewaySignature: signature,
      paymentOrderId: order.id,
      paymentDate: new Date(),
      remarks: `Online Payment via ${method} (Razorpay Demo)`,
    },
  });

  // Mark order as PAID
  await db.paymentOrder.update({
    where: { id: order.id },
    data: { status: PaymentOrderStatus.PAID },
  });

  // Parse installment IDs
  let targetInstallmentIds: string[] = [];
  try {
    targetInstallmentIds = JSON.parse(order.installmentIds);
  } catch {
    targetInstallmentIds = order.installmentIds.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const installmentsToAllocate = order.student.installments
    .filter((i) => targetInstallmentIds.includes(i.id))
    .map((inst) => ({
      id: inst.id,
      amountPaise: inst.amountPaise,
      paidAmountPaise: inst.paidAmountPaise,
      finePaise: inst.fines.reduce((sum, f) => sum + f.amountPaise, 0),
      dueDate: inst.dueDate,
    }));

  const allocationResult = allocatePayment(order.amountPaise, installmentsToAllocate);

  for (const alloc of allocationResult.allocations) {
    await db.paymentAllocation.create({
      data: {
        paymentId: payment.id,
        installmentId: alloc.installmentId,
        amountPaise: alloc.principalAmountPaise,
        finePaidPaise: alloc.finePaidPaise,
      },
    });

    const currentInst = order.student.installments.find((i) => i.id === alloc.installmentId);
    if (currentInst) {
      const newPaid = currentInst.paidAmountPaise + alloc.principalAmountPaise;
      const isFullyPaid = newPaid >= currentInst.amountPaise;

      await db.installment.update({
        where: { id: alloc.installmentId },
        data: {
          paidAmountPaise: newPaid,
          status: isFullyPaid ? InstallmentStatus.PAID : InstallmentStatus.PARTIAL,
        },
      });

      if (alloc.finePaidPaise > 0) {
        await db.fine.updateMany({
          where: { installmentId: alloc.installmentId },
          data: { isWaived: true, waiverReason: `Paid in Online Receipt ${receiptNo}` },
        });
      }
    }
  }

  revalidatePath("/parent");
  revalidatePath("/parent/pay");
  revalidatePath("/parent/payments");
  revalidatePath("/students");
  revalidatePath("/dues");
  revalidatePath("/");

  return {
    success: true,
    paymentId: payment.id,
    receiptNo: payment.receiptNo,
  };
}

export async function recordFailedParentOrder(orderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;

  const order = await db.paymentOrder.findUnique({
    where: { orderId },
  });

  if (order && order.parentUserId === userId) {
    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: PaymentOrderStatus.FAILED },
    });
  }

  return { success: true };
}

export async function getParentPaymentHistory() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id;
  const userRole = (session.user as any).role;

  if (userRole !== "PARENT") {
    throw new Error("Access restricted to parents only");
  }

  const payments = await db.payment.findMany({
    where: {
      student: { parentUserId: userId },
    },
    include: {
      student: {
        include: { class: true },
      },
      allocations: {
        include: { installment: true },
      },
    },
    orderBy: { paymentDate: "desc" },
  });

  return payments.map((p) => ({
    id: p.id,
    receiptNo: p.receiptNo,
    paymentDate: p.paymentDate,
    amountPaise: p.amountPaise,
    method: p.method,
    txnRef: p.txnRef,
    studentName: p.student.name,
    admissionNo: p.student.admissionNo,
    className: p.student.class.name,
    installmentsCovered: p.allocations.map((a) => a.installment.title).join(", "),
    status: "PAID",
  }));
}
