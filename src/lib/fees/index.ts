import { startOfDay, differenceInDays } from "date-fns";
import { SCHOOL_CONFIG } from "@/lib/config";

export interface FeePlanInput {
  totalFeePaise: number;
  admissionFeePaise?: number;
  discountPaise?: number;
  installmentCount?: number;
  dueDayOfMonth?: number;
  sessionStartYear?: number;
  sessionStartMonth?: number; // 4 = April
}

export interface GeneratedInstallment {
  monthIndex: number; // 1 to 12
  monthName: string;
  title: string;
  dueDate: Date;
  amountPaise: number;
}

export interface FineCalculationResult {
  isOverdue: boolean;
  daysOverdue: number;
  billableDays: number;
  finePaise: number;
}

export interface InstallmentForAllocation {
  id: string;
  amountPaise: number;
  paidAmountPaise: number;
  finePaise?: number;
  dueDate: Date | string;
}

export interface PaymentAllocationResult {
  allocations: {
    installmentId: string;
    principalAmountPaise: number;
    finePaidPaise: number;
    totalAllocatedPaise: number;
  }[];
  totalAllocatedPaise: number;
  remainingAdvancePaise: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Generates month-wise installment schedule for an Indian academic session (April - March).
 */
export function generateInstallmentSchedule(input: FeePlanInput): GeneratedInstallment[] {
  const {
    totalFeePaise,
    admissionFeePaise = 0,
    discountPaise = 0,
    installmentCount = SCHOOL_CONFIG.defaultInstallmentsCount,
    dueDayOfMonth = SCHOOL_CONFIG.defaultDueDayOfMonth,
    sessionStartYear = SCHOOL_CONFIG.sessionStartYear,
    sessionStartMonth = 4, // April
  } = input;

  const netRemainingPaise = Math.max(0, totalFeePaise - discountPaise - admissionFeePaise);
  const count = Math.max(1, Math.min(12, installmentCount));

  const baseMonthlyAmount = Math.floor(netRemainingPaise / count);
  const remainder = netRemainingPaise % count;

  const installments: GeneratedInstallment[] = [];

  for (let i = 0; i < count; i++) {
    const currentMonth0Based = (sessionStartMonth - 1 + i) % 12;
    const yearOffset = Math.floor((sessionStartMonth - 1 + i) / 12);
    const targetYear = sessionStartYear + yearOffset;

    const monthName = MONTH_NAMES[currentMonth0Based];
    const dueDate = new Date(targetYear, currentMonth0Based, Math.min(28, dueDayOfMonth), 23, 59, 59);

    // Remainder added to first month
    const monthlyAmount = i === 0 ? baseMonthlyAmount + remainder : baseMonthlyAmount;
    const title = `${monthName} ${targetYear}`;

    installments.push({
      monthIndex: i + 1,
      monthName,
      title,
      dueDate,
      amountPaise: monthlyAmount,
    });
  }

  return installments;
}

/**
 * Calculates late fine: ₹10 per day after due date, capped at ₹500 (50,000 paise).
 * Supports both signatures:
 * 1. calculateLateFine(dueDate, asOfDate?)
 * 2. calculateLateFine(installmentAmountPaise, paidAmountPaise, dueDate, asOfDate?, config?)
 */
export function calculateLateFine(
  arg1: Date | string | number,
  arg2?: Date | string | number,
  arg3?: Date | string,
  arg4?: Date | string,
  arg5?: {
    graceDays?: number;
    fineType?: "FLAT_PER_DAY" | "FLAT_ONE_TIME" | "PERCENTAGE";
    ratePaiseOrPercent?: number;
    maxCapPaise?: number;
  }
): FineCalculationResult {
  let dueDate: Date;
  let asOfDate: Date;
  let pendingAmount: number = 1;
  const config = arg5 || {};

  if (typeof arg1 === "number") {
    // 5-argument signature: (installmentAmountPaise, paidAmountPaise, dueDate, asOfDate, config)
    const amount = arg1;
    const paid = typeof arg2 === "number" ? arg2 : 0;
    pendingAmount = Math.max(0, amount - paid);
    dueDate = startOfDay(typeof arg3 === "string" ? new Date(arg3) : (arg3 as Date));
    asOfDate = startOfDay(arg4 ? (typeof arg4 === "string" ? new Date(arg4) : arg4) : new Date());
  } else {
    // 2-argument signature: (dueDate, asOfDate)
    dueDate = startOfDay(typeof arg1 === "string" ? new Date(arg1) : arg1);
    asOfDate = startOfDay(arg2 ? (typeof arg2 === "string" ? new Date(arg2 as string) : (arg2 as Date)) : new Date());
  }

  if (pendingAmount === 0 || asOfDate <= dueDate) {
    return { isOverdue: false, daysOverdue: 0, billableDays: 0, finePaise: 0 };
  }

  const rawDays = differenceInDays(asOfDate, dueDate);
  const graceDays = config.graceDays ?? 0;

  if (rawDays <= graceDays) {
    return { isOverdue: true, daysOverdue: rawDays, billableDays: 0, finePaise: 0 };
  }

  const billableDays = rawDays - graceDays;
  const rate = config.ratePaiseOrPercent ?? SCHOOL_CONFIG.finePerDayPaise;
  const maxCap = config.maxCapPaise ?? SCHOOL_CONFIG.fineCapPaise;

  let finePaise = 0;
  if (config.fineType === "PERCENTAGE") {
    finePaise = Math.round((pendingAmount * rate) / 100);
  } else if (config.fineType === "FLAT_ONE_TIME") {
    finePaise = rate;
  } else {
    // FLAT_PER_DAY default (₹10/day)
    finePaise = billableDays * rate;
  }

  if (maxCap > 0) {
    finePaise = Math.min(finePaise, maxCap);
  }

  return {
    isOverdue: true,
    daysOverdue: rawDays,
    billableDays,
    finePaise: Math.max(0, finePaise),
  };
}

/**
 * Allocates a payment across pending installments (oldest due date first).
 */
export function allocatePayment(
  paymentAmountPaise: number,
  installments: InstallmentForAllocation[],
  payFinesFirst: boolean = true
): PaymentAllocationResult {
  let remainingMoney = paymentAmountPaise;
  const allocations: PaymentAllocationResult["allocations"] = [];

  const sorted = [...installments].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  for (const inst of sorted) {
    if (remainingMoney <= 0) break;

    const fineDue = inst.finePaise || 0;
    const principalDue = Math.max(0, inst.amountPaise - inst.paidAmountPaise);

    let finePaid = 0;
    let principalPaid = 0;

    if (payFinesFirst && fineDue > 0) {
      finePaid = Math.min(remainingMoney, fineDue);
      remainingMoney -= finePaid;
    }

    if (remainingMoney > 0 && principalDue > 0) {
      principalPaid = Math.min(remainingMoney, principalDue);
      remainingMoney -= principalPaid;
    }

    if (!payFinesFirst && fineDue > 0 && remainingMoney > 0) {
      finePaid = Math.min(remainingMoney, fineDue);
      remainingMoney -= finePaid;
    }

    if (principalPaid > 0 || finePaid > 0) {
      allocations.push({
        installmentId: inst.id,
        principalAmountPaise: principalPaid,
        finePaidPaise: finePaid,
        totalAllocatedPaise: principalPaid + finePaid,
      });
    }
  }

  return {
    allocations,
    totalAllocatedPaise: paymentAmountPaise - remainingMoney,
    remainingAdvancePaise: remainingMoney,
  };
}

/**
 * Generates clean formatted receipt number, e.g. "REC-2026-0001"
 */
export function formatReceiptNumber(
  sessionCode: string = SCHOOL_CONFIG.academicSession,
  sequenceNumber: number,
  prefix: string = "REC"
): string {
  const cleanSession = sessionCode.replace(/[^0-9]/g, "").slice(0, 4) || "2026";
  const paddedSeq = String(sequenceNumber).padStart(4, "0");
  return `${prefix}-${cleanSession}-${paddedSeq}`;
}
