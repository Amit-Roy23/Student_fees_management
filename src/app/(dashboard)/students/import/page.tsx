import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ExcelImportClient } from "@/features/students/ExcelImportClient";

export default async function StudentImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const classes = await db.class.findMany({
    include: { sections: true },
    orderBy: { order: "asc" },
  });

  return <ExcelImportClient classes={classes} />;
}
