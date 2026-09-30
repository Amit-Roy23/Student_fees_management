import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { formatReceiptNumber, allocatePayment } from "@/lib/fees";
import { SESSION_CODE } from "@/lib/config";
import { PaymentMode, PaymentMethod, PaymentSource, PaymentOrderStatus, InstallmentStatus } from "@prisma/client";

/**
 * Demo Razorpay Webhook Stub
 * Handles event "payment.captured"
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const event = body.event;

    if (event !== "payment.captured") {
      return NextResponse.json({ status: "ignored", message: "Event not handled in demo stub" });
    }

    const payload = body.payload?.payment?.entity;
    const orderId = payload?.order_id;
    const paymentId = payload?.id || `pay_mock_${Date.now()}`;
    const amountPaise = payload?.amount;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const order = await db.paymentOrder.findUnique({
      where: { orderId },
      include: {
        student: {
          include: {
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

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent check
    if (order.status === PaymentOrderStatus.PAID) {
      const existingPayment = await db.payment.findUnique({
        where: { paymentOrderId: order.id },
      });
      return NextResponse.json({
        status: "already_processed",
        paymentId: existingPayment?.id,
        receiptNo: existingPayment?.receiptNo,
      });
    }

    const paymentCount = await db.payment.count();
    const receiptNo = formatReceiptNumber(SESSION_CODE, paymentCount + 1);

    const payment = await db.payment.create({
      data: {
        receiptNo,
        studentId: order.studentId,
        amountPaise: order.amountPaise,
        mode: PaymentMode.ONLINE,
        method: PaymentMethod.UPI,
        source: PaymentSource.PARENT,
        txnRef: paymentId,
        gatewayOrderId: order.orderId,
        gatewayPaymentId: paymentId,
        paymentOrderId: order.id,
        paymentDate: new Date(),
        remarks: "Webhook: Demo Razorpay Payment Captured",
      },
    });

    await db.paymentOrder.update({
      where: { id: order.id },
      data: { status: PaymentOrderStatus.PAID },
    });

    // Parse target installment IDs
    let selectedIds: string[] = [];
    try {
      selectedIds = JSON.parse(order.installmentIds);
    } catch {
      selectedIds = order.installmentIds.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const filteredInsts = order.student.installments.filter((i) => selectedIds.includes(i.id));
    const toAllocate = (filteredInsts.length > 0 ? filteredInsts : order.student.installments).map((inst) => ({
      id: inst.id,
      amountPaise: inst.amountPaise,
      paidAmountPaise: inst.paidAmountPaise,
      finePaise: inst.fines.reduce((sum, f) => sum + f.amountPaise, 0),
      dueDate: inst.dueDate,
    }));

    const allocationResult = allocatePayment(order.amountPaise, toAllocate);

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
            data: { isWaived: true, waiverReason: `Paid via Razorpay Webhook Receipt ${receiptNo}` },
          });
        }
      }
    }

    return NextResponse.json({
      status: "success",
      paymentId: payment.id,
      receiptNo: payment.receiptNo,
      demoNote: "Processed via demo webhook endpoint",
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
