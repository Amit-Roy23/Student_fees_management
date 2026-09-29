import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getStudentById } from "@/features/students/actions";
import { StudentProfileClient } from "@/features/students/StudentProfileClient";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const resolvedParams = await params;
  const student = await getStudentById(resolvedParams.id);

  if (!student) {
    notFound();
  }

  const userRole = (session.user as any).role || "ACCOUNTANT";

  return <StudentProfileClient student={student} userRole={userRole} />;
}
