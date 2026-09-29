import { PaymentMode } from "@prisma/client";

export interface CreateOrderParams {
  amountPaise: number;
  currency: string;
  studentId: string;
  admissionNo: string;
  guardianPhone: string;
  customerName: string;
}

export interface GatewayOrder {
  orderId: string;
  amountPaise: number;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED";
}

export interface PaymentGateway {
  name: string;
  createOrder(params: CreateOrderParams): Promise<GatewayOrder>;
  verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean>;
}

/**
 * Mock Razorpay / Cashfree / PayU Payment Gateway Implementation
 * Provides simulated checkout, UPI QR simulation, NetBanking OTP simulation, and instant verification.
 */
export class MockRazorpayGateway implements PaymentGateway {
  name = "MockRazorpayGateway (Demo Mode - Real API plugs in here)";

  async createOrder(params: CreateOrderParams): Promise<GatewayOrder> {
    const orderId = `order_demo_${Date.now()}_${Math.floor(Math.random() * 89999 + 10000)}`;
    return {
      orderId,
      amountPaise: params.amountPaise,
      currency: params.currency || "INR",
      status: "CREATED",
    };
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    return Boolean(orderId && paymentId);
  }
}

export const defaultPaymentGateway = new MockRazorpayGateway();
