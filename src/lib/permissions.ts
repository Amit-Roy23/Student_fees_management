import { Role } from "@prisma/client";

export type AppCapability =
  | "DASHBOARD_VIEW"
  | "STUDENTS_VIEW_ALL"
  | "STUDENTS_VIEW_OWN"
  | "STUDENT_ADMIT"
  | "STUDENT_EDIT_DELETE"
  | "FEE_STRUCTURE_MANAGE"
  | "COLLECT_FEE"
  | "DUES_VIEW_REMIND"
  | "CASH_BOOK_ANY_DATE"
  | "CASH_BOOK_TODAY_ONLY"
  | "EXCEL_IMPORT"
  | "EXCEL_EXPORT"
  | "PARENT_PORTAL"
  | "DOWNLOAD_BILL_ANY"
  | "DOWNLOAD_BILL_OWN";

export const ROLE_PERMISSIONS: Record<Role, Set<AppCapability>> = {
  MD: new Set<AppCapability>([
    "DASHBOARD_VIEW",
    "STUDENTS_VIEW_ALL",
    "STUDENT_ADMIT",
    "STUDENT_EDIT_DELETE",
    "FEE_STRUCTURE_MANAGE",
    "COLLECT_FEE",
    "DUES_VIEW_REMIND",
    "CASH_BOOK_ANY_DATE",
    "EXCEL_IMPORT",
    "EXCEL_EXPORT",
    "DOWNLOAD_BILL_ANY",
  ]),
  CLERK: new Set<AppCapability>([
    "STUDENTS_VIEW_ALL",
    "STUDENT_ADMIT",
    "COLLECT_FEE",
    "DUES_VIEW_REMIND",
    "CASH_BOOK_TODAY_ONLY",
    "DOWNLOAD_BILL_ANY",
  ]),
  PARENT: new Set<AppCapability>([
    "STUDENTS_VIEW_OWN",
    "PARENT_PORTAL",
    "DOWNLOAD_BILL_OWN",
  ]),
};

export function hasPermission(role: Role | string | undefined | null, capability: AppCapability): boolean {
  if (!role) return false;
  const userRole = role as Role;
  const permissions = ROLE_PERMISSIONS[userRole];
  if (!permissions) return false;
  return permissions.has(capability);
}

export function getDefaultRedirectForRole(role: Role | string | undefined | null): string {
  if (role === "PARENT") return "/parent";
  if (role === "CLERK") return "/collect-fee";
  return "/";
}
