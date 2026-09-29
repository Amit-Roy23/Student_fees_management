import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { CashBookClient } from "@/features/accounts/CashBookClient";

export default async function CashBookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });

  const days = await db.cashBookDay.findMany({
    where: { sessionId: activeSession?.id },
    include: { closedBy: true },
    orderBy: { date: "desc" },
    take: 30,
  });

  const userRole = (session.user as any).role || "ACCOUNTANT";

  return <CashBookClient days={days} userRole={userRole} />;
}
