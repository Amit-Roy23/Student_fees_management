import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { pdf } from "@react-pdf/renderer";
import { ReceiptDocument } from "@/lib/pdf/ReceiptDocument";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { paymentId } = await params;

    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            class: true,
          },
        },
        collectedBy: true,
        allocations: {
          include: {
            installment: true,
          },
        },
      },
    });

    if (!payment) {
      return new NextResponse("Payment receipt not found", { status: 404 });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;

    // Enforce authorization
    if (userRole === "PARENT") {
      if (payment.student.parentUserId !== userId) {
        return new NextResponse("Forbidden: You can only download receipts for your own children", {
          status: 403,
        });
      }
    }

    const pdfDocument = React.createElement(ReceiptDocument, {
      data: {
        receiptNo: payment.receiptNo,
        paymentDate: payment.paymentDate,
        amountPaise: payment.amountPaise,
        mode: payment.mode,
        method: payment.method,
        txnRef: payment.txnRef,
        remarks: payment.remarks,
        student: {
          admissionNo: payment.student.admissionNo,
          name: payment.student.name,
          class: { name: payment.student.class.name },
          guardianName: payment.student.guardianName,
          guardianPhone: payment.student.guardianPhone,
        },
        collectedBy: payment.collectedBy ? { name: payment.collectedBy.name } : null,
        allocations: payment.allocations.map((a) => ({
          amountPaise: a.amountPaise,
          finePaidPaise: a.finePaidPaise,
          installment: {
            title: a.installment.title,
            monthName: a.installment.monthName,
          },
        })),
      },
    });

    const pdfInstance = pdf(pdfDocument as any);
    const pdfBuffer = await pdfInstance.toBuffer();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Bill-${payment.receiptNo}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return new NextResponse(error.message || "Failed to generate PDF", { status: 500 });
  }
}
