import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParentDashboardData } from "@/features/parent/actions";
import { ParentHomeClient } from "@/features/parent/ParentHomeClient";

export default async function ParentHomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const childrenData = await getParentDashboardData();

  return <ParentHomeClient childrenData={childrenData} />;
}
