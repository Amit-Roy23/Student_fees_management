"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hasPermission } from "@/lib/permissions";

const updateFeeSchema = z.object({
  classId: z.string().min(1),
  admissionFeePaise: z.number().min(0),
  remainingFeePaise: z.number().min(0),
  installmentCount: z.number().min(1).max(12),
  dueDayOfMonth: z.number().min(1).max(28),
});

export async function updateClassFee(formData: z.input<typeof updateFeeSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userRole = (session.user as any).role;
  if (!hasPermission(userRole, "FEE_STRUCTURE_MANAGE")) {
    throw new Error("Permission denied: You do not have permission to modify fee structures");
  }

  const validated = updateFeeSchema.parse(formData);

  await db.class.update({
    where: { id: validated.classId },
    data: {
      admissionFeePaise: validated.admissionFeePaise,
      remainingFeePaise: validated.remainingFeePaise,
      installmentCount: validated.installmentCount,
      dueDayOfMonth: validated.dueDayOfMonth,
    },
  });

  revalidatePath("/fee-structures");
  return { success: true };
}
