import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCashBookEntries } from "@/features/cash-book/actions";
import { CashBookClient } from "@/features/cash-book/CashBookClient";

export default async function CashBookPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role || "CLERK";
  const initialData = await getCashBookEntries();

  return <CashBookClient initialData={initialData} userRole={userRole} />;
}
