import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CollectFeeClient } from "@/features/fees/CollectFeeClient";

export default async function CollectFeePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const resolvedParams = await searchParams;

  return <CollectFeeClient initialStudentId={resolvedParams.studentId} />;
}
