import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardClientLayout } from "@/components/layout/DashboardClientLayout";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = (session.user as any).role;
  if (userRole === "PARENT") {
    redirect("/parent");
  }

  const defaulterCount = await db.installment.count({
    where: { status: "OVERDUE" },
  });

  return (
    <DashboardClientLayout
      user={session.user}
      defaulterCount={defaulterCount}
    >
      {children}
    </DashboardClientLayout>
  );
}
