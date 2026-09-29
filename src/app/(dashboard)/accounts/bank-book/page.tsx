import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BankBookClient } from "@/features/accounts/BankBookClient";

export default async function BankBookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });

  // Fetch non-cash payments (UPI, Bank Transfer, Online Gateway, Cheque)
  const payments = await db.payment.findMany({
    where: {
      sessionId: activeSession?.id,
      mode: { not: "CASH" },
      status: "COMPLETED",
    },
    include: {
      student: { include: { class: true } },
    },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  // Fetch non-cash expenses
  const expenses = await db.expense.findMany({
    where: {
      sessionId: activeSession?.id,
      mode: { not: "CASH" },
    },
    orderBy: { paymentDate: "desc" },
    take: 100,
  });

  // Merge into transactions
  const transactions = [
    ...payments.map((p) => ({
      id: p.id,
      date: p.paymentDate,
      type: "RECEIPT" as const,
      voucherNo: p.receiptNo,
      particulars: `Fee Receipt: ${p.student.firstName} ${p.student.lastName} (${p.student.class.name})`,
      mode: p.mode,
      refNo: p.transactionRef,
      bankName: p.bankName || "SBI - Current A/C",
      amountPaise: p.amountPaise,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      date: e.paymentDate,
      type: "PAYMENT" as const,
      voucherNo: e.receiptNo || "EXP",
      particulars: `Expense: ${e.title} (${e.vendorName || e.category})`,
      mode: e.mode,
      refNo: null,
      bankName: "SBI - Current A/C",
      amountPaise: e.amountPaise,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return <BankBookClient transactions={transactions} />;
}
