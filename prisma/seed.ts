import {
  PrismaClient,
  Role,
  InstallmentStatus,
  PaymentMode,
  PaymentMethod,
  PaymentSource,
  PaymentOrderStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateInstallmentSchedule, calculateLateFine } from "../src/lib/fees";
import { SCHOOL_CONFIG } from "../src/lib/config";

const prisma = new PrismaClient();

const BENGALI_STUDENT_NAMES = [
  // Parent 1 Children (Siblings)
  { name: "Rohan Sharma", guardian: "Suresh Sharma", phone: "9830100001", parentKey: "parent1", classCode: "C8" },
  { name: "Priya Sharma", guardian: "Suresh Sharma", phone: "9830100001", parentKey: "parent1", classCode: "C5" },
  
  // Parent 2 Child
  { name: "Aarav Roy", guardian: "Rajesh Roy", phone: "9830100002", parentKey: "parent2", classCode: "C1" },
  
  // Parent 3 Child
  { name: "Ananya Das", guardian: "Amit Das", phone: "9830100003", parentKey: "parent3", classCode: "C2" },
  
  // Parent 4 Child
  { name: "Sourav Banerjee", guardian: "Bikram Banerjee", phone: "9830100004", parentKey: "parent4", classCode: "C9" },
  
  // Remaining Students
  { name: "Aarav Ghosh", guardian: "Debasish Ghosh", phone: "9830100005", classCode: "C1" },
  { name: "Siddharth Sen", guardian: "Amitava Sen", phone: "9830100006", classCode: "C2" },
  { name: "Ananya Mukherjee", guardian: "Kalyan Mukherjee", phone: "9830100007", classCode: "C5" },
  { name: "Debrup Bhattacharya", guardian: "Tapas Bhattacharya", phone: "9830100008", classCode: "C8" },
  { name: "Ishani Das", guardian: "Pranab Das", phone: "9830100009", classCode: "C9" },
  { name: "Sourav Roy", guardian: "Biman Roy", phone: "9830100010", classCode: "C10" },
  { name: "Riya Chakraborty", guardian: "Partha Chakraborty", phone: "9830100011", classCode: "C1" },
  { name: "Tanmoy Dutta", guardian: "Sujit Dutta", phone: "9830100012", classCode: "C2" },
  { name: "Sneha Ganguly", guardian: "Arindam Ganguly", phone: "9830100013", classCode: "C5" },
  { name: "Abir Paul", guardian: "Somenath Paul", phone: "9830100014", classCode: "C8" },
  { name: "Moumita Mitra", guardian: "Biplab Mitra", phone: "9830100015", classCode: "C9" },
  { name: "Sayan Sarkar", guardian: "Dipankar Sarkar", phone: "9830100016", classCode: "C10" },
  { name: "Pooja Bose", guardian: "Arup Bose", phone: "9830100017", classCode: "C1" },
  { name: "Koushik Majumdar", guardian: "Niladri Majumdar", phone: "9830100018", classCode: "C2" },
  { name: "Trisha Guha", guardian: "Shantanu Guha", phone: "9830100019", classCode: "C5" },
  { name: "Indranil Ghosh", guardian: "Gouranga Ghosh", phone: "9830100020", classCode: "C8" },
  { name: "Anwesha Poddar", guardian: "Nirmal Poddar", phone: "9830100021", classCode: "C9" },
  { name: "Subhadip Saha", guardian: "Manoranjan Saha", phone: "9830100022", classCode: "C10" },
  { name: "Bhaswati Roy", guardian: "Shyamal Roy", phone: "9830100023", classCode: "C1" },
  { name: "Arpan Kundu", guardian: "Sukumar Kundu", phone: "9830100024", classCode: "C2" },
  { name: "Madhurima Seal", guardian: "Ashoke Seal", phone: "9830100025", classCode: "C5" },
  { name: "Arkadeep Nag", guardian: "Swapan Nag", phone: "9830100026", classCode: "C8" },
  { name: "Ritika Nandi", guardian: "Pradip Nandi", phone: "9830100027", classCode: "C9" },
  { name: "Debojyoti Kar", guardian: "Subrata Kar", phone: "9830100028", classCode: "C10" },
  { name: "Sohini Bagchi", guardian: "Anjan Bagchi", phone: "9830100029", classCode: "C1" },
  { name: "Nilanjan De", guardian: "Samir De", phone: "9830100030", classCode: "C2" },
  { name: "Shreya Mallick", guardian: "Tushar Mallick", phone: "9830100031", classCode: "C5" },
  { name: "Gourab Samanta", guardian: "Mihir Samanta", phone: "9830100032", classCode: "C8" },
  { name: "Payel Pramanik", guardian: "Alok Pramanik", phone: "9830100033", classCode: "C9" },
  { name: "Dipayan Halder", guardian: "Utpal Halder", phone: "9830100034", classCode: "C10" },
  { name: "Oindrila Pal", guardian: "Gautam Pal", phone: "9830100035", classCode: "C1" },
  { name: "Kingshuk Bhowmick", guardian: "Surajit Bhowmick", phone: "9830100036", classCode: "C2" },
  { name: "Tathagata Biswas", guardian: "Bratin Biswas", phone: "9830100037", classCode: "C5" },
  { name: "Susmita Barman", guardian: "Rabindra Barman", phone: "9830100038", classCode: "C8" },
  { name: "Ayanava Mondal", guardian: "Dilip Mondal", phone: "9830100039", classCode: "C9" },
];

async function main() {
  console.log("🌱 Seeding SchoolPay demo database with MD, Clerk, and 4 Parents...");

  // 1. Create Staff & Parent Users
  const mdHash = await bcrypt.hash("md123", 10);
  const clerkHash = await bcrypt.hash("clerk123", 10);
  const parentHash = await bcrypt.hash("parent123", 10);

  const md = await prisma.user.upsert({
    where: { email: "md@schoolpay.demo" },
    update: {},
    create: {
      email: "md@schoolpay.demo",
      name: "Dr. Anirban Sengupta (MD)",
      passwordHash: mdHash,
      role: Role.MD,
    },
  });

  const clerk = await prisma.user.upsert({
    where: { email: "clerk@schoolpay.demo" },
    update: {},
    create: {
      email: "clerk@schoolpay.demo",
      name: "Bikash Roy (Accountant / Clerk)",
      passwordHash: clerkHash,
      role: Role.CLERK,
    },
  });

  // Also support accountant alias if needed
  await prisma.user.upsert({
    where: { email: "accountant@schoolpay.demo" },
    update: {},
    create: {
      email: "accountant@schoolpay.demo",
      name: "Bikash Roy (Accountant)",
      passwordHash: clerkHash,
      role: Role.CLERK,
    },
  });

  const parent1 = await prisma.user.upsert({
    where: { email: "parent1@schoolpay.demo" },
    update: {},
    create: {
      email: "parent1@schoolpay.demo",
      name: "Suresh Sharma",
      passwordHash: parentHash,
      role: Role.PARENT,
    },
  });

  const parent2 = await prisma.user.upsert({
    where: { email: "parent2@schoolpay.demo" },
    update: {},
    create: {
      email: "parent2@schoolpay.demo",
      name: "Rajesh Roy",
      passwordHash: parentHash,
      role: Role.PARENT,
    },
  });

  const parent3 = await prisma.user.upsert({
    where: { email: "parent3@schoolpay.demo" },
    update: {},
    create: {
      email: "parent3@schoolpay.demo",
      name: "Amit Das",
      passwordHash: parentHash,
      role: Role.PARENT,
    },
  });

  const parent4 = await prisma.user.upsert({
    where: { email: "parent4@schoolpay.demo" },
    update: {},
    create: {
      email: "parent4@schoolpay.demo",
      name: "Bikram Banerjee",
      passwordHash: parentHash,
      role: Role.PARENT,
    },
  });

  const parentMap: Record<string, typeof parent1> = {
    parent1,
    parent2,
    parent3,
    parent4,
  };

  console.log("✓ Created MD, Clerk, and 4 Parent users");

  // 2. Create 6 Classes
  const classData = [
    { name: "Class 1", code: "C1", order: 1, admissionFeePaise: 600000, remainingFeePaise: 3600000 },
    { name: "Class 2", code: "C2", order: 2, admissionFeePaise: 600000, remainingFeePaise: 3800000 },
    { name: "Class 5", code: "C5", order: 3, admissionFeePaise: 750000, remainingFeePaise: 4200000 },
    { name: "Class 8", code: "C8", order: 4, admissionFeePaise: 800000, remainingFeePaise: 4800000 },
    { name: "Class 9", code: "C9", order: 5, admissionFeePaise: 900000, remainingFeePaise: 5400000 },
    { name: "Class 10", code: "C10", order: 6, admissionFeePaise: 1000000, remainingFeePaise: 6000000 },
  ];

  const classMap = new Map<string, any>();
  for (const c of classData) {
    const cls = await prisma.class.upsert({
      where: { code: c.code },
      update: {},
      create: {
        name: c.name,
        code: c.code,
        order: c.order,
        admissionFeePaise: c.admissionFeePaise,
        remainingFeePaise: c.remainingFeePaise,
        installmentCount: 10,
        dueDayOfMonth: 10,
      },
    });
    classMap.set(c.code, cls);
  }
  console.log(`✓ Created ${classMap.size} classes`);

  // 3. Create 40 Students
  let receiptSeq = 1;
  const asOfToday = new Date(2026, 6, 15); // July 15, 2026

  for (let i = 0; i < BENGALI_STUDENT_NAMES.length; i++) {
    const raw = BENGALI_STUDENT_NAMES[i];
    const targetClass = classMap.get(raw.classCode) || Array.from(classMap.values())[0];
    const admNo = `AVM-2026-${String(i + 1).padStart(4, "0")}`;
    const linkedParent = raw.parentKey ? parentMap[raw.parentKey] : null;

    const student = await prisma.student.create({
      data: {
        admissionNo: admNo,
        name: raw.name,
        classId: targetClass.id,
        parentUserId: linkedParent?.id || null,
        guardianName: raw.guardian,
        guardianPhone: raw.phone,
        address: "Kolkata, West Bengal",
        admissionDate: new Date(2026, 3, 2), // April 2, 2026
      },
    });

    // Create Fee Plan
    const feePlan = await prisma.feePlan.create({
      data: {
        studentId: student.id,
        admissionFeePaise: targetClass.admissionFeePaise,
        remainingFeePaise: targetClass.remainingFeePaise,
        installmentCount: targetClass.installmentCount,
        dueDayOfMonth: targetClass.dueDayOfMonth,
      },
    });

    // Generate 10 Installments (April to January)
    const schedules = generateInstallmentSchedule({
      totalFeePaise: targetClass.admissionFeePaise + targetClass.remainingFeePaise,
      admissionFeePaise: targetClass.admissionFeePaise,
      installmentCount: 10,
      dueDayOfMonth: 10,
      sessionStartYear: 2026,
    });

    const createdInstallments = [];
    for (const s of schedules) {
      const inst = await prisma.installment.create({
        data: {
          feePlanId: feePlan.id,
          studentId: student.id,
          title: s.title,
          monthIndex: s.monthIndex,
          monthName: s.monthName,
          dueDate: s.dueDate,
          amountPaise: s.amountPaise,
          paidAmountPaise: 0,
          status: InstallmentStatus.PENDING,
        },
      });
      createdInstallments.push(inst);
    }

    // Handle payments:
    // Sibling 1 (Rohan Sharma, Parent 1): Paid April via UPI online
    if (i === 0) {
      const inst = createdInstallments[0];
      const receiptNo = `REC-2026-${String(receiptSeq++).padStart(4, "0")}`;
      const orderId = `order_demo_${Date.now()}_01`;
      const paymentId = `pay_upi_demo_01`;

      const order = await prisma.paymentOrder.create({
        data: {
          orderId,
          studentId: student.id,
          parentUserId: parent1.id,
          amountPaise: inst.amountPaise,
          status: PaymentOrderStatus.PAID,
          installmentIds: JSON.stringify([inst.id]),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          receiptNo,
          studentId: student.id,
          amountPaise: inst.amountPaise,
          mode: PaymentMode.ONLINE,
          method: PaymentMethod.UPI,
          source: PaymentSource.PARENT,
          txnRef: "sharma@okhdfcbank",
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: "demo_sig_upi_01",
          paymentOrderId: order.id,
          paymentDate: new Date(2026, 3, 10),
          remarks: "Online Fee Payment via UPI",
        },
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          installmentId: inst.id,
          amountPaise: inst.amountPaise,
          finePaidPaise: 0,
        },
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: { paidAmountPaise: inst.amountPaise, status: InstallmentStatus.PAID },
      });
    }
    // Sibling 2 (Priya Sharma, Parent 1): Paid April via Card online
    else if (i === 1) {
      const inst = createdInstallments[0];
      const receiptNo = `REC-2026-${String(receiptSeq++).padStart(4, "0")}`;
      const orderId = `order_demo_${Date.now()}_02`;
      const paymentId = `pay_card_demo_02`;

      const order = await prisma.paymentOrder.create({
        data: {
          orderId,
          studentId: student.id,
          parentUserId: parent1.id,
          amountPaise: inst.amountPaise,
          status: PaymentOrderStatus.PAID,
          installmentIds: JSON.stringify([inst.id]),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          receiptNo,
          studentId: student.id,
          amountPaise: inst.amountPaise,
          mode: PaymentMode.ONLINE,
          method: PaymentMethod.CARD,
          source: PaymentSource.PARENT,
          txnRef: "Visa Card ending 4242",
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: "demo_sig_card_02",
          paymentOrderId: order.id,
          paymentDate: new Date(2026, 3, 12),
          remarks: "Online Fee Payment via Card",
        },
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          installmentId: inst.id,
          amountPaise: inst.amountPaise,
          finePaidPaise: 0,
        },
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: { paidAmountPaise: inst.amountPaise, status: InstallmentStatus.PAID },
      });
    }
    // Parent 2 (Aarav Roy): Paid April via Net Banking
    else if (i === 2) {
      const inst = createdInstallments[0];
      const receiptNo = `REC-2026-${String(receiptSeq++).padStart(4, "0")}`;
      const orderId = `order_demo_${Date.now()}_03`;
      const paymentId = `pay_nb_demo_03`;

      const order = await prisma.paymentOrder.create({
        data: {
          orderId,
          studentId: student.id,
          parentUserId: parent2.id,
          amountPaise: inst.amountPaise,
          status: PaymentOrderStatus.PAID,
          installmentIds: JSON.stringify([inst.id]),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          receiptNo,
          studentId: student.id,
          amountPaise: inst.amountPaise,
          mode: PaymentMode.ONLINE,
          method: PaymentMethod.NETBANKING,
          source: PaymentSource.PARENT,
          txnRef: "HDFC NetBanking Ref #988231",
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: "demo_sig_nb_03",
          paymentOrderId: order.id,
          paymentDate: new Date(2026, 3, 8),
          remarks: "Online Fee Payment via HDFC NetBanking",
        },
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          installmentId: inst.id,
          amountPaise: inst.amountPaise,
          finePaidPaise: 0,
        },
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: { paidAmountPaise: inst.amountPaise, status: InstallmentStatus.PAID },
      });
    }
    // Parent 3 (Ananya Das): Paid April via Bank Transfer (NEFT/RTGS)
    else if (i === 3) {
      const inst = createdInstallments[0];
      const receiptNo = `REC-2026-${String(receiptSeq++).padStart(4, "0")}`;
      const orderId = `order_demo_${Date.now()}_04`;
      const paymentId = `pay_neft_demo_04`;

      const order = await prisma.paymentOrder.create({
        data: {
          orderId,
          studentId: student.id,
          parentUserId: parent3.id,
          amountPaise: inst.amountPaise,
          status: PaymentOrderStatus.PAID,
          installmentIds: JSON.stringify([inst.id]),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          receiptNo,
          studentId: student.id,
          amountPaise: inst.amountPaise,
          mode: PaymentMode.ONLINE,
          method: PaymentMethod.BANK_TRANSFER,
          source: PaymentSource.PARENT,
          txnRef: "NEFT-SBIN000123-UTR884920",
          gatewayOrderId: orderId,
          gatewayPaymentId: paymentId,
          gatewaySignature: "demo_sig_neft_04",
          paymentOrderId: order.id,
          paymentDate: new Date(2026, 3, 9),
          remarks: "Online Fee Payment via NEFT Bank Transfer",
        },
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          installmentId: inst.id,
          amountPaise: inst.amountPaise,
          finePaidPaise: 0,
        },
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: { paidAmountPaise: inst.amountPaise, status: InstallmentStatus.PAID },
      });
    }
    // Parent 4 (Sourav Banerjee): Seed one FAILED payment order
    else if (i === 4) {
      const inst = createdInstallments[0];
      const orderId = `order_demo_${Date.now()}_05_failed`;

      await prisma.paymentOrder.create({
        data: {
          orderId,
          studentId: student.id,
          parentUserId: parent4.id,
          amountPaise: inst.amountPaise,
          status: PaymentOrderStatus.FAILED,
          installmentIds: JSON.stringify([inst.id]),
        },
      });
    }
    // Students 5 to 24: Paid April & May via staff counter
    else if (i >= 5 && i < 25) {
      for (let m = 0; m < 2; m++) {
        const inst = createdInstallments[m];
        const isCash = (i + m) % 2 === 0;
        const receiptNo = `REC-2026-${String(receiptSeq++).padStart(4, "0")}`;
        const pDate = new Date(2026, 3 + m, 8);

        const payment = await prisma.payment.create({
          data: {
            receiptNo,
            studentId: student.id,
            amountPaise: inst.amountPaise,
            mode: isCash ? PaymentMode.CASH : PaymentMode.ONLINE,
            method: isCash ? PaymentMethod.CASH : PaymentMethod.UPI,
            source: PaymentSource.STAFF,
            txnRef: isCash ? "Cash Counter Receipt" : `UPI-REF-${i}${m}`,
            paymentDate: pDate,
            remarks: `${inst.monthName} Tuition Fee`,
            collectedById: clerk.id,
          },
        });

        await prisma.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            installmentId: inst.id,
            amountPaise: inst.amountPaise,
            finePaidPaise: 0,
          },
        });

        await prisma.installment.update({
          where: { id: inst.id },
          data: {
            paidAmountPaise: inst.amountPaise,
            status: InstallmentStatus.PAID,
          },
        });
      }
    }
    // Students 25 to 29: Paid April only
    else if (i >= 25 && i < 30) {
      const inst = createdInstallments[0];
      const receiptNo = `REC-2026-${String(receiptSeq++).padStart(4, "0")}`;
      const pDate = new Date(2026, 3, 8);

      const payment = await prisma.payment.create({
        data: {
          receiptNo,
          studentId: student.id,
          amountPaise: inst.amountPaise,
          mode: PaymentMode.CASH,
          method: PaymentMethod.CASH,
          source: PaymentSource.STAFF,
          txnRef: "Cash Counter Receipt",
          paymentDate: pDate,
          remarks: `${inst.monthName} Tuition Fee`,
          collectedById: clerk.id,
        },
      });

      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          installmentId: inst.id,
          amountPaise: inst.amountPaise,
          finePaidPaise: 0,
        },
      });

      await prisma.installment.update({
        where: { id: inst.id },
        data: {
          paidAmountPaise: inst.amountPaise,
          status: InstallmentStatus.PAID,
        },
      });
    }

    // For unpaid past installments (April, May, June), mark as OVERDUE and compute fine
    const monthsToCalculate = i < 4 ? 0 : i === 4 ? 0 : i < 25 ? 2 : i < 30 ? 1 : 0;
    for (let m = monthsToCalculate; m < 3; m++) {
      const inst = createdInstallments[m];
      if (inst.paidAmountPaise < inst.amountPaise) {
        const fineResult = calculateLateFine(inst.amountPaise, inst.paidAmountPaise, inst.dueDate, asOfToday);

        if (fineResult.isOverdue) {
          await prisma.installment.update({
            where: { id: inst.id },
            data: { status: InstallmentStatus.OVERDUE },
          });

          if (fineResult.finePaise > 0) {
            await prisma.fine.create({
              data: {
                installmentId: inst.id,
                studentId: student.id,
                amountPaise: fineResult.finePaise,
                daysOverdue: fineResult.daysOverdue,
                isWaived: false,
              },
            });
          }
        }
      }
    }

    // Add sample reminder logs for defaulters
    if (i >= 30 && i <= 34) {
      const overdueInst = createdInstallments[0];
      await prisma.reminderLog.create({
        data: {
          studentId: student.id,
          installmentId: overdueInst.id,
          message: `Dear ${raw.guardian}, the fee of ₹${(overdueInst.amountPaise / 100).toLocaleString("en-IN")} for ${raw.name} was due on ${overdueInst.dueDate.toLocaleDateString("en-IN")}. Please pay at the earliest.`,
          sentAt: new Date(2026, 4, 15),
          sentById: clerk.id,
        },
      });
    }
  }

  console.log(`✓ Seeded 40 students with parent links, sibling accounts, online payments, and failed order.`);
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
