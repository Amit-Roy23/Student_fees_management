import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Payment Gateway Webhook Endpoint Stub (Razorpay / PayU / Cashfree)
 * Receives webhook callbacks for asynchronous payment capture/failure events.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log the incoming webhook event
    console.log("🔔 [Payment Webhook Received]:", body?.event || "PAYMENT_EVENT");

    return NextResponse.json({
      status: "SUCCESS",
      message: "Webhook processed (Demo Gateway Stub)",
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: "ERROR", message: err.message || "Failed to process webhook" },
      { status: 400 }
    );
  }
}
