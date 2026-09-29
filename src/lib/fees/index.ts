import { addMonths, setDate, startOfDay, differenceInDays } from "date-fns";

export interface FeePlanInput {
  totalFeePaise: number;
  admissionFeePaise?: number;
  discountPaise?: number;
  installmentCount?: number; // default 10
  dueDayOfMonth?: number; // default 10
  sessionStartYear?: number; // e.g. 2026
  sessionStartMonth?: number; // 4 = April
}

export interface GeneratedInstallment {
  monthIndex: number; // 1 to 12
  monthName: string;
  title: string;
  dueDate: Date;
  amountPaise: number;
}

export interface FineRuleConfig {
  graceDays: number;
  fineType: "FLAT_PER_DAY" | "FLAT_ONE_TIME" | "PERCENTAGE";
  ratePaiseOrPercent: number; // paise for flat (e.g. 2000 = ₹20/day) or percentage integer/float (e.g. 5 = 5%)
  maxCapPaise: number; // maximum cap in paise (e.g. 100000 = ₹1,000 max)
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
    installmentCount = 10,
    dueDayOfMonth = 10,
    sessionStartYear = new Date().getFullYear(),
    sessionStartMonth = 4, // April
  } = input;

  const netRemainingPaise = Math.max(0, totalFeePaise - discountPaise - admissionFeePaise);
  const count = Math.max(1, Math.min(12, installmentCount));

  const baseMonthlyAmount = Math.floor(netRemainingPaise / count);
  const remainder = netRemainingPaise % count;

  const installments: GeneratedInstallment[] = [];

  for (let i = 0; i < count; i++) {
    // Determine calendar month (0-indexed for JS Date)
    const monthOffset = i;
    // Starting in April (month index 3 in 0-based, or sessionStartMonth - 1)
    const currentMonth0Based = (sessionStartMonth - 1 + monthOffset) % 12;
    const yearOffset = Math.floor((sessionStartMonth - 1 + monthOffset) / 12);
    const targetYear = sessionStartYear + yearOffset;

    const monthName = MONTH_NAMES[currentMonth0Based];
    
    // Set due date to specific day of month
    let dueDate = new Date(targetYear, currentMonth0Based, Math.min(28, dueDayOfMonth), 23, 59, 59);

    // Any remainder is added to the 1st installment so sum matches exactly
    const monthlyAmount = i === 0 ? baseMonthlyAmount + remainder : baseMonthlyAmount;
    const title = `${monthName} ${targetYear} - Tuition Fee`;

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
 * Calculates late fine based on grace period and fine rules.
 */
export function calculateLateFine(
  installmentAmountPaise: number,
  paidAmountPaise: number,
  dueDate: Date | string,
  asOfDate: Date | string = new Date(),
  config: FineRuleConfig = {
    graceDays: 5,
    fineType: "FLAT_PER_DAY",
    ratePaiseOrPercent: 2000, // ₹20/day
    maxCapPaise: 50000, // ₹500 cap
  }
): FineCalculationResult {
  const due = startOfDay(typeof dueDate === "string" ? new Date(dueDate) : dueDate);
  const asOf = startOfDay(typeof asOfDate === "string" ? new Date(asOfDate) : asOfDate);

  const pendingAmount = Math.max(0, installmentAmountPaise - paidAmountPaise);
  if (pendingAmount === 0 || asOf <= due) {
    return {
      isOverdue: false,
      daysOverdue: 0,
      billableDays: 0,
      finePaise: 0,
    };
  }

  const rawDays = differenceInDays(asOf, due);
  if (rawDays <= config.graceDays) {
    return {
      isOverdue: true,
      daysOverdue: rawDays,
      billableDays: 0,
      finePaise: 0,
    };
  }

  const billableDays = rawDays - config.graceDays;
  let finePaise = 0;

  switch (config.fineType) {
    case "FLAT_PER_DAY":
      finePaise = billableDays * config.ratePaiseOrPercent;
      break;
    case "FLAT_ONE_TIME":
      finePaise = config.ratePaiseOrPercent;
      break;
    case "PERCENTAGE":
      // ratePaiseOrPercent represents percentage (e.g. 5 for 5%)
      finePaise = Math.round((pendingAmount * config.ratePaiseOrPercent) / 100);
      break;
  }

  if (config.maxCapPaise > 0) {
    finePaise = Math.min(finePaise, config.maxCapPaise);
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

  // Sort installments by dueDate ascending
  const sorted = [...installments].sort((a, b) => {
    const da = new Date(a.dueDate).getTime();
    const db = new Date(b.dueDate).getTime();
    return da - db;
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
  sessionCode: string,
  sequenceNumber: number,
  prefix: string = "REC"
): string {
  const cleanSession = sessionCode.replace(/[^0-9]/g, "").slice(0, 4) || "2026";
  const paddedSeq = String(sequenceNumber).padStart(4, "0");
  return `${prefix}-${cleanSession}-${paddedSeq}`;
}
