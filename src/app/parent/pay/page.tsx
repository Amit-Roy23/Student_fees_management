import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ParentPayClient } from "@/features/parent/ParentPayClient";

export default async function ParentPayPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const resolvedParams = await searchParams;

  const children = await db.student.findMany({
    where: { parentUserId: userId },
    include: { class: true },
    orderBy: { name: "asc" },
  });

  if (children.length === 0) {
    redirect("/parent");
  }

  const childrenList = children.map((c) => ({
    id: c.id,
    name: c.name,
    className: c.class.name,
  }));

  return (
    <ParentPayClient
      childrenList={childrenList}
      initialStudentId={resolvedParams.studentId || childrenList[0]?.id}
    />
  );
}
