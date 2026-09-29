import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ExpensesClient } from "@/features/accounts/ExpensesClient";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });

  const expenses = await db.expense.findMany({
    where: { sessionId: activeSession?.id },
    include: { createdBy: true },
    orderBy: { paymentDate: "desc" },
  });

  return <ExpensesClient expenses={expenses} />;
}
