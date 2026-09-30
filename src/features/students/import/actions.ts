"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateInstallmentSchedule } from "@/lib/fees";
import { rupeesToPaise } from "@/lib/formatters";
import { hasPermission } from "@/lib/permissions";

export interface StudentImportRow {
  admissionNo: string;
  name: string;
  class: string;
  guardianName: string;
  guardianPhone: string;
  address?: string;
  admissionDate?: string;
  admissionFee: number;
  totalRemainingFee: number;
  installments?: number;
}

export interface ValidationResult {
  rowNumber: number;
  data: StudentImportRow;
  isValid: boolean;
  errors: string[];
}

export async function validateImportRows(rows: any[]): Promise<{
  results: ValidationResult[];
  validCount: number;
  invalidCount: number;
}> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "EXCEL_IMPORT")) {
    throw new Error("Permission denied: Only MD can import students via Excel");
  }

  const existingClasses = await db.class.findMany();
  const existingStudents = await db.student.findMany({
    select: { admissionNo: true },
  });
  const existingAdmissionNos = new Set(existingStudents.map((s) => s.admissionNo.toUpperCase()));
  const fileAdmissionNos = new Set<string>();

  const results: ValidationResult[] = [];
  let validCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const errors: string[] = [];

    const admissionNo = String(raw.admissionNo || raw["Admission No"] || "").trim();
    const name = String(raw.name || raw["Student Name"] || "").trim();
    const className = String(raw.class || raw["Class"] || "").trim();
    const guardianName = String(raw.guardianName || raw["Guardian Name"] || "").trim();
    const guardianPhone = String(raw.guardianPhone || raw["Guardian Phone"] || raw["Phone"] || "").trim();
    const address = String(raw.address || raw["Address"] || "").trim();
    const admissionDate = String(raw.admissionDate || raw["Admission Date"] || "").trim();
    const admissionFee = Number(raw.admissionFee || raw["Admission Fee"] || 0);
    const totalRemainingFee = Number(raw.totalRemainingFee || raw["Total Remaining Fee"] || raw["Remaining Fee"] || 0);
    const installments = Number(raw.installments || raw["Installments"] || 10);

    // Validation checks
    if (!admissionNo) errors.push("Admission Number is required");
    else if (existingAdmissionNos.has(admissionNo.toUpperCase())) {
      errors.push(`Admission No "${admissionNo}" already exists in database`);
    } else if (fileAdmissionNos.has(admissionNo.toUpperCase())) {
      errors.push(`Duplicate Admission No "${admissionNo}" within file`);
    } else {
      fileAdmissionNos.add(admissionNo.toUpperCase());
    }

    if (!name) errors.push("Student name is required");

    const matchedClass = existingClasses.find(
      (c) => c.name.toLowerCase() === className.toLowerCase() || c.code.toLowerCase() === className.toLowerCase()
    );
    if (!className) errors.push("Class name is required");
    else if (!matchedClass) {
      errors.push(`Class "${className}" not found in system (Available: ${existingClasses.map((c) => c.name).join(", ")})`);
    }

    if (!guardianName) errors.push("Guardian name is required");
    if (!guardianPhone || guardianPhone.length < 10) errors.push("Valid 10-digit guardian mobile is required");
    if (isNaN(admissionFee) || admissionFee < 0) errors.push("Admission fee must be a positive number");
    if (isNaN(totalRemainingFee) || totalRemainingFee < 0) errors.push("Total remaining fee must be a positive number");

    const isValid = errors.length === 0;
    if (isValid) validCount++;
    else invalidCount++;

    results.push({
      rowNumber: i + 1,
      data: {
        admissionNo,
        name,
        class: matchedClass ? matchedClass.name : className,
        guardianName,
        guardianPhone,
        address,
        admissionDate: admissionDate || new Date().toISOString().split("T")[0],
        admissionFee,
        totalRemainingFee,
        installments: installments || 10,
      },
      isValid,
      errors,
    });
  }

  return { results, validCount, invalidCount };
}

export async function executeImportStudents(validRows: StudentImportRow[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "EXCEL_IMPORT")) {
    throw new Error("Permission denied: Only MD can import students via Excel");
  }

  const existingClasses = await db.class.findMany();
  let importedCount = 0;

  for (const row of validRows) {
    const matchedClass = existingClasses.find(
      (c) => c.name.toLowerCase() === row.class.toLowerCase() || c.code.toLowerCase() === row.class.toLowerCase()
    );
    if (!matchedClass) continue;

    const admFeePaise = rupeesToPaise(row.admissionFee);
    const remFeePaise = rupeesToPaise(row.totalRemainingFee);
    const totalFeePaise = admFeePaise + remFeePaise;
    const instCount = Math.max(1, Math.min(12, row.installments || 10));
    const admDate = row.admissionDate ? new Date(row.admissionDate) : new Date();

    const student = await db.student.create({
      data: {
        admissionNo: row.admissionNo,
        name: row.name,
        classId: matchedClass.id,
        guardianName: row.guardianName,
        guardianPhone: row.guardianPhone,
        address: row.address || null,
        admissionDate: admDate,
      },
    });

    const feePlan = await db.feePlan.create({
      data: {
        studentId: student.id,
        admissionFeePaise: admFeePaise,
        remainingFeePaise: remFeePaise,
        installmentCount: instCount,
        dueDayOfMonth: matchedClass.dueDayOfMonth,
      },
    });

    const schedule = generateInstallmentSchedule({
      totalFeePaise,
      admissionFeePaise: admFeePaise,
      installmentCount: instCount,
      dueDayOfMonth: matchedClass.dueDayOfMonth,
      sessionStartYear: 2026,
    });

    for (const inst of schedule) {
      await db.installment.create({
        data: {
          feePlanId: feePlan.id,
          studentId: student.id,
          title: inst.title,
          monthIndex: inst.monthIndex,
          monthName: inst.monthName,
          dueDate: inst.dueDate,
          amountPaise: inst.amountPaise,
          paidAmountPaise: 0,
          status: "PENDING",
        },
      });
    }

    importedCount++;
  }

  revalidatePath("/students");
  revalidatePath("/dues");
  revalidatePath("/");

  return { success: true, count: importedCount };
}
