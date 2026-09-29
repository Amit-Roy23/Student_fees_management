import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { RemindersListClient } from "@/features/reminders/RemindersListClient";

export default async function RemindersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [logs, templates] = await Promise.all([
    db.reminderLog.findMany({
      include: {
        student: {
          include: { class: true },
        },
        sentBy: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.reminderTemplate.findMany({
      orderBy: { isDefault: "desc" },
    }),
  ]);

  return <RemindersListClient logs={logs} templates={templates} />;
}
