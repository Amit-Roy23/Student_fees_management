import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParentPaymentHistory } from "@/features/parent/actions";
import { ParentPaymentsClient } from "@/features/parent/ParentPaymentsClient";

export default async function ParentPaymentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const payments = await getParentPaymentHistory();

  return <ParentPaymentsClient payments={payments} />;
}
