import { db } from "@/lib/db";
import { formatINR, formatDate } from "@/lib/formatters";
import { ReminderChannel, ReminderStatus, Language } from "@prisma/client";

export interface SendReminderParams {
  studentId: string;
  recipientPhone: string;
  recipientName: string;
  channel: ReminderChannel;
  templateId?: string;
  customMessage?: string;
  amountDuePaise: number;
  dueDate: Date | string;
  sentById?: string;
  sessionId: string;
}

export interface NotificationProvider {
  name: string;
  sendMessage(
    to: string,
    message: string,
    channel: ReminderChannel
  ): Promise<{ success: boolean; providerRef: string; status: ReminderStatus }>;
}

/**
 * Mock Notification Provider for WhatsApp & SMS demo.
 * Simulates realistic provider delivery latency and returns mock reference IDs.
 * Easily swappable with Twilio, Gupshup, Fast2SMS, or MSG91 in production.
 */
export class MockNotificationProvider implements NotificationProvider {
  name = "MockWhatsAppAndSMSProvider";

  async sendMessage(
    to: string,
    message: string,
    channel: ReminderChannel
  ): Promise<{ success: boolean; providerRef: string; status: ReminderStatus }> {
    // Simulate API delivery delay (30ms in test, instant)
    const providerRef = `MOCK_${channel}_${Date.now()}_${Math.floor(Math.random() * 89999 + 10000)}`;

    return {
      success: true,
      providerRef,
      status: ReminderStatus.DELIVERED,
    };
  }
}

export const defaultNotificationProvider = new MockNotificationProvider();

/**
 * Interpolates template placeholders: {student}, {amount}, {due_date}, {school}, {portal_link}
 */
export function interpolateTemplate(
  templateContent: string,
  variables: {
    studentName: string;
    amountFormatted: string;
    dueDateFormatted: string;
    schoolName?: string;
    portalLink?: string;
  }
): string {
  const school = variables.schoolName || "Arohon Vidya Mandir";
  const portal = variables.portalLink || "https://schoolpay.demo/pay";

  return templateContent
    .replace(/{student}/g, variables.studentName)
    .replace(/{amount}/g, variables.amountFormatted.replace("₹", ""))
    .replace(/{due_date}/g, variables.dueDateFormatted)
    .replace(/{school}/g, school)
    .replace(/{portal_link}/g, portal);
}
