import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDuesData } from "@/features/dues/actions";
import { DuesClient } from "@/features/dues/DuesClient";

export default async function DuesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const initialData = await getDuesData();

  return <DuesClient initialData={initialData} />;
}
