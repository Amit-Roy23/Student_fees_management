import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FeeStructuresClient } from "@/features/fee-structures/FeeStructuresClient";
import { hasPermission } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FeeStructuresPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "FEE_STRUCTURE_MANAGE")) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-center p-6">
          <CardContent className="space-y-4 pt-4">
            <AlertTriangle className="h-10 w-10 text-rose-600 dark:text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-950 dark:text-rose-100">Access Restricted</h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Only Managing Director (MD) has permission to manage class fee structures.
            </p>
            <Link href="/collect-fee">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Go to Collect Fee
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classes = await db.class.findMany({
    orderBy: { order: "asc" },
  });

  return <FeeStructuresClient classes={classes} userRole={userRole} />;
}
