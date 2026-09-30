export type PaymentGatewayMethod = "UPI" | "NETBANKING" | "CARD" | "BANK_TRANSFER";

export interface CreateOrderParams {
  studentId: string;
  installmentIds: string[];
  amountPaise: number;
}

export interface RazorpayOrderResult {
  orderId: string;
  amountPaise: number;
  currency: string;
  status: "CREATED" | "PAID" | "FAILED";
}

export interface VerifyPaymentParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface PaymentGateway {
  createOrder(params: CreateOrderParams): Promise<RazorpayOrderResult>;
  verifyPayment(params: VerifyPaymentParams): boolean;
  generateSignature(orderId: string, paymentId: string): string;
}
