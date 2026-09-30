import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { ExcelImportClient } from "@/features/students/import/ExcelImportClient";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StudentsImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "EXCEL_IMPORT")) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <Card className="border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-center p-6">
          <CardContent className="space-y-4 pt-4">
            <AlertTriangle className="h-10 w-10 text-rose-600 dark:text-rose-400 mx-auto" />
            <h2 className="text-lg font-bold text-rose-950 dark:text-rose-100">Access Restricted</h2>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Only Managing Director (MD) has permission to perform bulk Excel student imports.
            </p>
            <Link href="/students">
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Back to Students
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ExcelImportClient />;
}
