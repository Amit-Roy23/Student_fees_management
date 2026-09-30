import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOnlineBookEntries } from "@/features/cash-book/actions";
import { OnlineBookClient } from "@/features/cash-book/OnlineBookClient";

export default async function OnlineBookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role || "MD";
  const initialData = await getOnlineBookEntries();

  return <OnlineBookClient initialData={initialData} userRole={userRole} />;
}
