import { ParentPayClient } from "@/features/parent-pay/ParentPayClient";
import { searchParentStudent } from "@/features/parent-pay/actions";

export default async function ParentPayPage({
  searchParams,
}: {
  searchParams?: Promise<{ adm?: string; ph?: string }>;
}) {
  const resolved = await searchParams;
  const adm = resolved?.adm || "AVM-2026-0004";
  const ph = resolved?.ph || "9830100004";

  let initialData = null;
  try {
    initialData = await searchParentStudent(adm, ph);
  } catch {
    // If lookup fails fallback gracefully
    initialData = null;
  }

  return (
    <ParentPayClient
      initialStudentData={initialData}
      initialAdmissionNo={adm}
      initialPhone={ph}
    />
  );
}
