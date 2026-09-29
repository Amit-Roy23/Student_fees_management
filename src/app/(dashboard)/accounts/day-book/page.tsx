import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DayBookClient } from "@/features/accounts/DayBookClient";

export default async function DayBookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });

  const [payments, expenses] = await Promise.all([
    db.payment.findMany({
      where: {
        sessionId: activeSession?.id,
        status: "COMPLETED",
      },
      include: {
        student: { include: { class: true } },
      },
      orderBy: { paymentDate: "desc" },
      take: 150,
    }),
    db.expense.findMany({
      where: { sessionId: activeSession?.id },
      orderBy: { paymentDate: "desc" },
      take: 100,
    }),
  ]);

  const transactions = [
    ...payments.map((p) => ({
      id: p.id,
      date: p.paymentDate,
      type: "RECEIPT" as const,
      voucherNo: p.receiptNo,
      particulars: `Fee Collection: ${p.student.firstName} ${p.student.lastName} (${p.student.class.name})`,
      mode: p.mode,
      amountPaise: p.amountPaise,
    })),
    ...expenses.map((e) => ({
      id: e.id,
      date: e.paymentDate,
      type: "PAYMENT" as const,
      voucherNo: e.receiptNo || "EXP",
      particulars: `Expense: ${e.title} (${e.vendorName || e.category})`,
      mode: e.mode,
      amountPaise: e.amountPaise,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return <DayBookClient transactions={transactions} />;
}
