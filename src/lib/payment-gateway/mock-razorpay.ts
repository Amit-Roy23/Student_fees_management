import crypto from "crypto";
import { PaymentGateway, CreateOrderParams, RazorpayOrderResult, VerifyPaymentParams } from "./types";

export class MockRazorpayGateway implements PaymentGateway {
  private secret: string;

  constructor() {
    this.secret = process.env.RAZORPAY_KEY_SECRET || "demo_razorpay_secret_key_12345";
  }

  async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const orderId = `order_${Date.now()}_${randomSuffix}`;

    return {
      orderId,
      amountPaise: params.amountPaise,
      currency: "INR",
      status: "CREATED",
    };
  }

  generateSignature(orderId: string, paymentId: string): string {
    const payload = `${orderId}|${paymentId}`;
    return crypto.createHmac("sha256", this.secret).update(payload).digest("hex");
  }

  verifyPayment(params: VerifyPaymentParams): boolean {
    const expected = this.generateSignature(params.orderId, params.paymentId);
    return expected === params.signature;
  }
}

export const paymentGateway = new MockRazorpayGateway();
