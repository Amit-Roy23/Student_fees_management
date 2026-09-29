import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AuditLogsClient } from "@/features/audit-logs/AuditLogsClient";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <AuditLogsClient logs={logs} />;
}
