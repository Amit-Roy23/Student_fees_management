import { describe, it, expect } from "vitest";
import {
  generateInstallmentSchedule,
  calculateLateFine,
  allocatePayment,
  formatReceiptNumber,
} from "./index";
import { paiseToRupees, rupeesToPaise, formatINR, amountInWordsINR } from "../formatters";

describe("Fee Calculation Engine", () => {
  describe("generateInstallmentSchedule", () => {
    it("should split annual fee evenly across 10 months", () => {
      const schedule = generateInstallmentSchedule({
        totalFeePaise: 5000000, // ₹50,000
        admissionFeePaise: 1000000, // ₹10,000 upfront
        discountPaise: 0,
        installmentCount: 10,
        dueDayOfMonth: 10,
        sessionStartYear: 2026,
        sessionStartMonth: 4, // April
      });

      expect(schedule).toHaveLength(10);
      const totalInstallmentAmount = schedule.reduce((sum, item) => sum + item.amountPaise, 0);
      expect(totalInstallmentAmount).toBe(4000000); // ₹40,000 split across 10 months = ₹4,000/mo
      expect(schedule[0].monthName).toBe("April");
      expect(schedule[9].monthName).toBe("January");
      expect(schedule[0].amountPaise).toBe(400000);
    });

    it("should handle remainders by allocating odd paise to the first month", () => {
      const schedule = generateInstallmentSchedule({
        totalFeePaise: 1000005, // ₹10,000.05
        admissionFeePaise: 0,
        discountPaise: 0,
        installmentCount: 10,
        dueDayOfMonth: 15,
        sessionStartYear: 2026,
      });

      const totalSum = schedule.reduce((sum, item) => sum + item.amountPaise, 0);
      expect(totalSum).toBe(1000005);
      expect(schedule[0].amountPaise).toBe(100005); // 100000 + 5 remainder
      expect(schedule[1].amountPaise).toBe(100000);
    });
  });

  describe("calculateLateFine", () => {
    const dueDate = new Date(2026, 3, 10); // April 10, 2026

    it("should return zero fine if not overdue or within grace period", () => {
      // April 12 (2 days late, within 5 days grace)
      const asOfWithinGrace = new Date(2026, 3, 12);
      const res = calculateLateFine(400000, 0, dueDate, asOfWithinGrace, {
        graceDays: 5,
        fineType: "FLAT_PER_DAY",
        ratePaiseOrPercent: 2000, // ₹20/day
        maxCapPaise: 50000,
      });

      expect(res.isOverdue).toBe(true);
      expect(res.daysOverdue).toBe(2);
      expect(res.billableDays).toBe(0);
      expect(res.finePaise).toBe(0);
    });

    it("should calculate flat per day fine after grace period", () => {
      // April 20 (10 days late, 10 - 5 grace = 5 billable days @ ₹20/day = ₹100 = 10000 paise)
      const asOf = new Date(2026, 3, 20);
      const res = calculateLateFine(400000, 0, dueDate, asOf, {
        graceDays: 5,
        fineType: "FLAT_PER_DAY",
        ratePaiseOrPercent: 2000,
        maxCapPaise: 50000,
      });

      expect(res.daysOverdue).toBe(10);
      expect(res.billableDays).toBe(5);
      expect(res.finePaise).toBe(10000); // ₹100
    });

    it("should respect maximum fine cap", () => {
      // 100 days late
      const asOf = new Date(2026, 6, 20);
      const res = calculateLateFine(400000, 0, dueDate, asOf, {
        graceDays: 5,
        fineType: "FLAT_PER_DAY",
        ratePaiseOrPercent: 2000,
        maxCapPaise: 50000, // ₹500 cap = 50000 paise
      });

      expect(res.finePaise).toBe(50000);
    });

    it("should support percentage fine", () => {
      const asOf = new Date(2026, 3, 25);
      const res = calculateLateFine(400000, 0, dueDate, asOf, {
        graceDays: 5,
        fineType: "PERCENTAGE",
        ratePaiseOrPercent: 5, // 5% of ₹4,000 = ₹200 = 20000 paise
        maxCapPaise: 50000,
      });

      expect(res.finePaise).toBe(20000);
    });
  });

  describe("allocatePayment", () => {
    it("should allocate payment to oldest due installment first", () => {
      const installments = [
        {
          id: "inst-1",
          amountPaise: 400000,
          paidAmountPaise: 0,
          finePaise: 2000,
          dueDate: new Date(2026, 3, 10),
        },
        {
          id: "inst-2",
          amountPaise: 400000,
          paidAmountPaise: 0,
          finePaise: 0,
          dueDate: new Date(2026, 4, 10),
        },
      ];

      // Paying ₹5,000 (500000 paise): should pay inst-1 fine (₹20), inst-1 principal (₹4000), inst-2 principal (₹980)
      const res = allocatePayment(500000, installments, true);

      expect(res.allocations).toHaveLength(2);
      expect(res.allocations[0].installmentId).toBe("inst-1");
      expect(res.allocations[0].finePaidPaise).toBe(2000);
      expect(res.allocations[0].principalAmountPaise).toBe(400000);
      expect(res.allocations[1].installmentId).toBe("inst-2");
      expect(res.allocations[1].principalAmountPaise).toBe(98000);
      expect(res.remainingAdvancePaise).toBe(0);
    });
  });

  describe("formatReceiptNumber", () => {
    it("should format clean receipt numbers", () => {
      expect(formatReceiptNumber("2026-27", 1)).toBe("REC-2026-0001");
      expect(formatReceiptNumber("2026-27", 145)).toBe("REC-2026-0145");
    });
  });

  describe("INR Formatters", () => {
    it("should format INR currency correctly", () => {
      expect(formatINR(12500000)).toContain("1,25,000");
      expect(formatINR(450000)).toContain("4,500");
    });

    it("should convert INR to English words", () => {
      expect(amountInWordsINR(12500000)).toBe("One Lakh Twenty Five Thousand Rupees Only");
      expect(amountInWordsINR(450000)).toBe("Four Thousand Five Hundred Rupees Only");
    });
  });
});
