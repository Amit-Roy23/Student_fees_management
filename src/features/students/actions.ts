"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StudentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInstallmentSchedule } from "@/lib/fees";

const studentFormSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  rollNo: z.string().optional().nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  gender: z.string().default("Male"),
  dob: z.string().optional().nullable(),
  guardianName: z.string().min(1, "Guardian name is required"),
  guardianRelation: z.string().default("Father"),
  guardianPhone: z.string().min(10, "10-digit phone is required"),
  guardianEmail: z.string().email().optional().or(z.literal("")).nullable(),
  address: z.string().optional().nullable(),
  city: z.string().default("Kolkata"),
  state: z.string().default("West Bengal"),
  pinCode: z.string().optional().nullable(),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  totalFeePaise: z.number().min(0),
  admissionFeePaise: z.number().default(0),
  discountPaise: z.number().default(0),
  discountReason: z.string().optional().nullable(),
});

export async function getStudents(params?: {
  classId?: string;
  sectionId?: string;
  query?: string;
  sessionId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const currentSession = params?.sessionId
    ? { id: params.sessionId }
    : await db.session.findFirst({ where: { isCurrent: true } });

  const whereClause: Prisma.StudentWhereInput = {};

  if (currentSession) {
    whereClause.sessionId = currentSession.id;
  }

  if (params?.classId && params.classId !== "ALL") {
    whereClause.classId = params.classId;
  }

  if (params?.sectionId && params.sectionId !== "ALL") {
    whereClause.sectionId = params.sectionId;
  }

  if (params?.status && params.status !== "ALL") {
    whereClause.status = params.status as StudentStatus;
  }

  if (params?.query && params.query.trim()) {
    const q = params.query.trim();
    whereClause.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { admissionNo: { contains: q } },
      { guardianPhone: { contains: q } },
      { guardianName: { contains: q } },
    ];
  }

  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const skip = (page - 1) * limit;

  const [students, totalCount] = await Promise.all([
    db.student.findMany({
      where: whereClause,
      include: {
        class: true,
        section: true,
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
      orderBy: [{ class: { order: "asc" } }, { firstName: "asc" }],
      skip,
      take: limit,
    }),
    db.student.count({ where: whereClause }),
  ]);

  // Compute calculated dues per student
  const formatted = students.map((s) => {
    const totalFee = s.feePlans[0]?.totalFeePaise || 0;
    const totalPaid = s.installments.reduce((sum, inst) => sum + inst.paidAmountPaise, 0);
    const totalDue = s.installments.reduce((sum, inst) => {
      const pending = inst.amountPaise - inst.paidAmountPaise;
      return sum + Math.max(0, pending);
    }, 0);
    const overdueCount = s.installments.filter((inst) => inst.status === "OVERDUE").length;

    return {
      ...s,
      summary: {
        totalFeePaise: totalFee,
        totalPaidPaise: totalPaid,
        totalDuePaise: totalDue,
        overdueCount,
        hasDues: totalDue > 0,
      },
    };
  });

  return {
    students: formatted,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    page,
  };
}

export async function getStudentById(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const student = await db.student.findUnique({
    where: { id },
    include: {
      class: true,
      section: true,
      session: true,
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
          waivedBy: {
            select: { name: true },
          },
        },
      },
      reminderLogs: {
        orderBy: { createdAt: "desc" },
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
  if (userRole === "VIEWER") throw new Error("Permission denied: Viewers cannot create students");

  const validated = studentFormSchema.parse(formData);

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });
  if (!activeSession) throw new Error("No active session found");

  const student = await db.student.create({
    data: {
      admissionNo: validated.admissionNo,
      rollNo: validated.rollNo,
      firstName: validated.firstName,
      lastName: validated.lastName,
      gender: validated.gender,
      dob: validated.dob ? new Date(validated.dob) : null,
      guardianName: validated.guardianName,
      guardianRelation: validated.guardianRelation,
      guardianPhone: validated.guardianPhone,
      guardianEmail: validated.guardianEmail || null,
      address: validated.address,
      city: validated.city,
      state: validated.state,
      pinCode: validated.pinCode,
      classId: validated.classId,
      sectionId: validated.sectionId,
      sessionId: activeSession.id,
      status: StudentStatus.ACTIVE,
    },
  });

  // Create Fee Plan & Auto-generate Installments
  const remainingFeePaise = Math.max(
    0,
    validated.totalFeePaise - validated.discountPaise - validated.admissionFeePaise
  );

  const feePlan = await db.studentFeePlan.create({
    data: {
      studentId: student.id,
      sessionId: activeSession.id,
      totalFeePaise: validated.totalFeePaise,
      admissionFeePaise: validated.admissionFeePaise,
      discountPaise: validated.discountPaise,
      discountReason: validated.discountReason,
      remainingFeePaise,
      installmentCount: 10,
      dueDayOfMonth: 10,
    },
  });

  const installmentTemplates = generateInstallmentSchedule({
    totalFeePaise: validated.totalFeePaise,
    admissionFeePaise: validated.admissionFeePaise,
    discountPaise: validated.discountPaise,
    installmentCount: 10,
    dueDayOfMonth: 10,
    sessionStartYear: activeSession.startDate.getFullYear(),
  });

  for (const inst of installmentTemplates) {
    await db.installment.create({
      data: {
        feePlanId: feePlan.id,
        studentId: student.id,
        sessionId: activeSession.id,
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

  // Audit Log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole,
      action: "STUDENT_CREATED",
      entityType: "Student",
      entityId: student.id,
      details: `Admitted student ${validated.firstName} ${validated.lastName} (${validated.admissionNo})`,
    },
  });

  revalidatePath("/students");
  return { success: true, studentId: student.id };
}

export async function bulkImportStudents(studentsList: any[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (userRole === "VIEWER") throw new Error("Permission denied: Viewers cannot import data");

  const activeSession = await db.session.findFirst({ where: { isCurrent: true } });
  if (!activeSession) throw new Error("No active session found");

  const classes = await db.class.findMany({ include: { sections: true } });

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < studentsList.length; i++) {
    const row = studentsList[i];
    try {
      const admissionNo = String(row.admissionNo || row["Admission No"] || `AVM-2026-IMP${i + 1}`).trim();
      const firstName = String(row.firstName || row["First Name"] || row.name?.split(" ")[0] || "Student").trim();
      const lastName = String(row.lastName || row["Last Name"] || row.name?.split(" ").slice(1).join(" ") || "Kumar").trim();
      const guardianName = String(row.guardianName || row["Guardian Name"] || row["Father Name"] || "Parent").trim();
      const guardianPhone = String(row.guardianPhone || row["Phone"] || row["Mobile"] || "9830000000").replace(/\D/g, "");
      const classNameStr = String(row.className || row["Class"] || "Class 1").trim();
      const sectionNameStr = String(row.sectionName || row["Section"] || "A").trim().toUpperCase();

      // Find matching class
      const targetClass = classes.find(
        (c) => c.name.toLowerCase() === classNameStr.toLowerCase() || c.code.toLowerCase() === classNameStr.toLowerCase()
      ) || classes[0];

      const targetSection = targetClass.sections.find(
        (s) => s.name.toUpperCase() === sectionNameStr
      ) || targetClass.sections[0];

      // Check duplicate
      const existing = await db.student.findUnique({ where: { admissionNo } });
      if (existing) {
        results.skipped++;
        continue;
      }

      const totalAnnualPaise = Number(row.annualFee || row["Annual Fee"] || row.totalFee)
        ? Math.round(Number(row.annualFee || row["Annual Fee"] || row.totalFee) * 100)
        : targetClass.annualFeePaise;

      const admissionFeePaise = Number(row.admissionFee || row["Admission Fee"])
        ? Math.round(Number(row.admissionFee || row["Admission Fee"]) * 100)
        : 600000;

      const student = await db.student.create({
        data: {
          admissionNo,
          rollNo: String(row.rollNo || row["Roll No"] || i + 1),
          firstName,
          lastName,
          gender: row.gender || row["Gender"] || "Male",
          guardianName,
          guardianRelation: "Father",
          guardianPhone: guardianPhone || "9830012345",
          guardianEmail: row.email || row["Email"] || null,
          address: row.address || row["Address"] || "Kolkata, WB",
          city: "Kolkata",
          state: "West Bengal",
          classId: targetClass.id,
          sectionId: targetSection.id,
          sessionId: activeSession.id,
        },
      });

      const remainingFeePaise = Math.max(0, totalAnnualPaise - admissionFeePaise);
      const feePlan = await db.studentFeePlan.create({
        data: {
          studentId: student.id,
          sessionId: activeSession.id,
          totalFeePaise: totalAnnualPaise,
          admissionFeePaise,
          discountPaise: 0,
          remainingFeePaise,
          installmentCount: 10,
          dueDayOfMonth: 10,
        },
      });

      const schedules = generateInstallmentSchedule({
        totalFeePaise: totalAnnualPaise,
        admissionFeePaise,
        discountPaise: 0,
        installmentCount: 10,
        sessionStartYear: activeSession.startDate.getFullYear(),
      });

      for (const inst of schedules) {
        await db.installment.create({
          data: {
            feePlanId: feePlan.id,
            studentId: student.id,
            sessionId: activeSession.id,
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

      results.imported++;
    } catch (e: any) {
      results.errors.push(`Row ${i + 1}: ${e.message || "Failed to import"}`);
    }
  }

  // Audit Log
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole,
      action: "EXCEL_IMPORT",
      entityType: "Student",
      details: `Imported ${results.imported} students, skipped ${results.skipped}`,
    },
  });

  revalidatePath("/students");
  return results;
}
