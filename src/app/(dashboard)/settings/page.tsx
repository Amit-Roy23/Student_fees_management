import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SettingsClient } from "@/features/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [settingsList, sessions, users] = await Promise.all([
    db.setting.findMany(),
    db.session.findMany({ orderBy: { startDate: "desc" } }),
    db.user.findMany({ orderBy: { role: "asc" } }),
  ]);

  const settingsMap: Record<string, string> = {};
  settingsList.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const userRole = (session.user as any).role || "ACCOUNTANT";

  return (
    <SettingsClient
      settings={settingsMap}
      sessions={sessions}
      users={users}
      userRole={userRole}
    />
  );
}
