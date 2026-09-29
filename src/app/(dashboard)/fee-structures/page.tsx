import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FeeStructuresClient } from "@/features/fee-structures/FeeStructuresClient";

export default async function FeeStructuresPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [classes, feeHeads, feeStructures] = await Promise.all([
    db.class.findMany({
      include: { sections: true },
      orderBy: { order: "asc" },
    }),
    db.feeHead.findMany({
      orderBy: { name: "asc" },
    }),
    db.feeStructure.findMany(),
  ]);

  return (
    <FeeStructuresClient
      classes={classes}
      feeHeads={feeHeads}
      feeStructures={feeStructures}
    />
  );
}
