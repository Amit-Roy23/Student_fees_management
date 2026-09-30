"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInstallmentSchedule } from "@/lib/fees";
import { SCHOOL_CONFIG } from "@/lib/config";
import { hasPermission } from "@/lib/permissions";

const studentFormSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  name: z.string().min(1, "Student name is required"),
  classId: z.string().min(1, "Class is required"),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianPhone: z.string().min(10, "10-digit phone is required"),
  address: z.string().optional().nullable(),
  admissionDate: z.string().optional().nullable(),
  admissionFeePaise: z.number().min(0),
  totalFeePaise: z.number().min(0),
  installmentCount: z.number().min(1).max(12).default(10),
});

export async function getStudents(params?: {
  classId?: string;
  query?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const whereClause: any = {};

  if (params?.classId && params.classId !== "ALL") {
    whereClause.classId = params.classId;
  }

  if (params?.query && params.query.trim()) {
    const q = params.query.trim();
    whereClause.OR = [
      { name: { contains: q } },
      { admissionNo: { contains: q } },
      { guardianPhone: { contains: q } },
      { guardianName: { contains: q } },
    ];
  }

  const students = await db.student.findMany({
    where: whereClause,
    include: {
      class: true,
      feePlans: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      installments: {
        select: {
          id: true,
          amountPaise: true,
          paidAmountPaise: true,
          status: true,
        },
      },
    },
    orderBy: [{ class: { order: "asc" } }, { name: "asc" }],
  });

  const formatted = students.map((s) => {
    const feePlan = s.feePlans[0];
    const totalFee = (feePlan?.admissionFeePaise || 0) + (feePlan?.remainingFeePaise || 0);
    const totalPaid = s.installments.reduce((sum, inst) => sum + inst.paidAmountPaise, 0);
    const totalDue = s.installments.reduce((sum, inst) => {
      const pending = inst.amountPaise - inst.paidAmountPaise;
      return sum + Math.max(0, pending);
    }, 0);
    const overdueCount = s.installments.filter((inst) => inst.status === "OVERDUE").length;

    return {
      id: s.id,
      admissionNo: s.admissionNo,
      name: s.name,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      address: s.address,
      admissionDate: s.admissionDate,
      classId: s.classId,
      class: s.class,
      summary: {
        totalFeePaise: totalFee,
        totalPaidPaise: totalPaid,
        totalDuePaise: totalDue,
        overdueCount,
        hasDues: totalDue > 0,
      },
    };
  });

  return formatted;
}

export async function getStudentById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const student = await db.student.findUnique({
    where: { id },
    include: {
      class: true,
      feePlans: {
        include: {
          installments: {
            orderBy: { monthIndex: "asc" },
            include: {
              fines: true,
              allocations: {
                include: {
                  payment: true,
                },
              },
            },
          },
        },
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        include: {
          collectedBy: {
            select: { name: true, role: true },
          },
          allocations: {
            include: {
              installment: true,
            },
          },
        },
      },
      fines: {
        orderBy: { createdAt: "desc" },
        include: {
          installment: true,
        },
      },
      reminderLogs: {
        orderBy: { sentAt: "desc" },
        include: {
          sentBy: {
            select: { name: true },
          },
        },
      },
    },
  });

  return student;
}

export async function createStudent(formData: z.input<typeof studentFormSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "STUDENT_ADMIT")) {
    throw new Error("Permission denied: You do not have permission to admit students");
  }

  const validated = studentFormSchema.parse(formData);

  const student = await db.student.create({
    data: {
      admissionNo: validated.admissionNo,
      name: validated.name,
      classId: validated.classId,
      guardianName: validated.guardianName,
      guardianPhone: validated.guardianPhone,
      address: validated.address || null,
      admissionDate: validated.admissionDate ? new Date(validated.admissionDate) : new Date(),
    },
  });

  const remainingFeePaise = Math.max(0, validated.totalFeePaise - validated.admissionFeePaise);

  const feePlan = await db.feePlan.create({
    data: {
      studentId: student.id,
      admissionFeePaise: validated.admissionFeePaise,
      remainingFeePaise,
      installmentCount: validated.installmentCount || 10,
      dueDayOfMonth: SCHOOL_CONFIG.defaultDueDayOfMonth,
    },
  });

  const schedules = generateInstallmentSchedule({
    totalFeePaise: validated.totalFeePaise,
    admissionFeePaise: validated.admissionFeePaise,
    installmentCount: validated.installmentCount || 10,
    dueDayOfMonth: SCHOOL_CONFIG.defaultDueDayOfMonth,
    sessionStartYear: SCHOOL_CONFIG.sessionStartYear,
  });

  for (const s of schedules) {
    await db.installment.create({
      data: {
        feePlanId: feePlan.id,
        studentId: student.id,
        title: s.title,
        monthIndex: s.monthIndex,
        monthName: s.monthName,
        dueDate: s.dueDate,
        amountPaise: s.amountPaise,
        paidAmountPaise: 0,
        status: "PENDING",
      },
    });
  }

  revalidatePath("/students");
  revalidatePath("/dues");
  return { success: true, studentId: student.id };
}
