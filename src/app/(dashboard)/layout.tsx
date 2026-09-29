import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClientLayout } from "@/components/layout/DashboardClientLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // If not logged in, redirect to login
  if (!session?.user) {
    redirect("/login");
  }

  // Fetch sessions for switcher
  const sessions = await db.session.findMany({
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, code: true, isCurrent: true },
  });

  const currentSession = sessions.find((s) => s.isCurrent) || sessions[0];

  // Count overdue students for sidebar badge
  const defaulterCount = await db.installment.groupBy({
    by: ["studentId"],
    where: {
      status: "OVERDUE",
      sessionId: currentSession?.id,
    },
  });

  return (
    <DashboardClientLayout
      sessions={sessions}
      currentSessionId={currentSession?.id || ""}
      defaulterCount={defaulterCount.length}
    >
      {children}
    </DashboardClientLayout>
  );
}
