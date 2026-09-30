import { describe, it, expect } from "vitest";
import { hasPermission, getDefaultRedirectForRole, ROLE_PERMISSIONS } from "./permissions";

describe("Permissions Matrix", () => {
  it("MD should have full access to dashboard, fee structures, excel import/export, and any date cash book", () => {
    expect(hasPermission("MD", "DASHBOARD_VIEW")).toBe(true);
    expect(hasPermission("MD", "FEE_STRUCTURE_MANAGE")).toBe(true);
    expect(hasPermission("MD", "EXCEL_IMPORT")).toBe(true);
    expect(hasPermission("MD", "EXCEL_EXPORT")).toBe(true);
    expect(hasPermission("MD", "STUDENT_EDIT_DELETE")).toBe(true);
    expect(hasPermission("MD", "CASH_BOOK_ANY_DATE")).toBe(true);
    expect(hasPermission("MD", "PARENT_PORTAL")).toBe(false);
  });

  it("Clerk should have restricted access: No dashboard, no fee structures, no excel, today-only cash book", () => {
    expect(hasPermission("CLERK", "DASHBOARD_VIEW")).toBe(false);
    expect(hasPermission("CLERK", "FEE_STRUCTURE_MANAGE")).toBe(false);
    expect(hasPermission("CLERK", "EXCEL_IMPORT")).toBe(false);
    expect(hasPermission("CLERK", "EXCEL_EXPORT")).toBe(false);
    expect(hasPermission("CLERK", "STUDENT_EDIT_DELETE")).toBe(false);
    expect(hasPermission("CLERK", "STUDENTS_VIEW_ALL")).toBe(true);
    expect(hasPermission("CLERK", "STUDENT_ADMIT")).toBe(true);
    expect(hasPermission("CLERK", "COLLECT_FEE")).toBe(true);
    expect(hasPermission("CLERK", "DUES_VIEW_REMIND")).toBe(true);
    expect(hasPermission("CLERK", "CASH_BOOK_TODAY_ONLY")).toBe(true);
    expect(hasPermission("CLERK", "CASH_BOOK_ANY_DATE")).toBe(false);
    expect(hasPermission("CLERK", "PARENT_PORTAL")).toBe(false);
  });

  it("Parent should only have access to own children, parent portal, and own bills", () => {
    expect(hasPermission("PARENT", "PARENT_PORTAL")).toBe(true);
    expect(hasPermission("PARENT", "STUDENTS_VIEW_OWN")).toBe(true);
    expect(hasPermission("PARENT", "DOWNLOAD_BILL_OWN")).toBe(true);
    expect(hasPermission("PARENT", "DASHBOARD_VIEW")).toBe(false);
    expect(hasPermission("PARENT", "STUDENTS_VIEW_ALL")).toBe(false);
    expect(hasPermission("PARENT", "COLLECT_FEE")).toBe(false);
    expect(hasPermission("PARENT", "DUES_VIEW_REMIND")).toBe(false);
  });

  it("Default redirect per role", () => {
    expect(getDefaultRedirectForRole("MD")).toBe("/");
    expect(getDefaultRedirectForRole("CLERK")).toBe("/collect-fee");
    expect(getDefaultRedirectForRole("PARENT")).toBe("/parent");
  });
});
