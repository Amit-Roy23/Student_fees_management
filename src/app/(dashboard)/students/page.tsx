import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getStudents } from "@/features/students/actions";
import { StudentsListClient } from "@/features/students/StudentsListClient";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [students, classes] = await Promise.all([
    getStudents(),
    db.class.findMany({
      orderBy: { order: "asc" },
    }),
  ]);

  const userRole = (session.user as any).role || "MD";

  return (
    <StudentsListClient
      students={students}
      classes={classes}
      userRole={userRole}
    />
  );
}
