import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getStudents } from "@/features/students/actions";
import { StudentsListClient } from "@/features/students/StudentsListClient";

export default async function StudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [studentsData, classes] = await Promise.all([
    getStudents({ limit: 300 }),
    db.class.findMany({
      include: { sections: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <StudentsListClient
      students={studentsData.students}
      classes={classes}
      totalCount={studentsData.totalCount}
    />
  );
}
