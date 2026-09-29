import { PrismaClient, Role, StudentStatus, InstallmentStatus, PaymentMode, PaymentStatus, ExpenseCategory, ReminderChannel, ReminderStatus, Language } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const BENGALI_FIRST_NAMES = [
  "Sourav", "Ananya", "Debanjan", "Sneha", "Ritwik", "Priyanka", "Arindam", "Sohini",
  "Subhashis", "Mousumi", "Abhishek", "Tanushree", "Kaushik", "Sayani", "Indranil",
  "Rupali", "Suman", "Madhurima", "Anirban", "Paramita", "Saptarshi", "Bristi",
  "Arijit", "Debasmita", "Nilanjan", "Payel", "Satyajit", "Pooja", "Shuvadip", "Trisha"
];

const OTHER_FIRST_NAMES = [
  "Aarav", "Ananya", "Vihaan", "Aditi", "Reyansh", "Diya", "Kabir", "Meera",
  "Rohan", "Saanvi", "Ishaan", "Avani", "Arjun", "Myra", "Yash", "Tara",
  "Aditya", "Riya", "Dhruv", "Isha", "Kunal", "Kavya", "Pranav", "Nisha"
];

const SURNAMES = [
  "Mukherjee", "Banerjee", "Chatterjee", "Bhattacharya", "Sengupta", "Dasgupta",
  "Ghosh", "Roy", "Bose", "Dutta", "Mitra", "Chakraborty", "Sen", "Das",
  "Majumdar", "Ganguly", "Sarkar", "Chowdhury", "Sharma", "Verma", "Patel", "Gupta"
];

const LOCALITIES = [
  "Salt Lake, Sector 2", "Ballygunge Circular Rd", "New Town, Action Area 1",
  "Gariahat", "Behala Chowrasta", "Dum Dum Cantonment", "Howrah AC Market Area",
  "Alipore", "Kestopur", "Jadavpur Central Rd", "Lake Gardens", "Shyambazar"
];

async function main() {
  console.log("🌱 Starting SchoolPay Database Seed...");

  // 1. Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.reminderLog.deleteMany();
  await prisma.reminderTemplate.deleteMany();
  await prisma.cashBookDay.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.paymentAllocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.installment.deleteMany();
  await prisma.studentFeePlan.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.student.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.feeHead.deleteMany();
  await prisma.session.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Cleaned old records.");

  // 2. Create Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const accountantPassword = await bcrypt.hash("account123", 10);
  const viewerPassword = await bcrypt.hash("viewer123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@schoolpay.demo",
      name: "Dr. Anirban Mukherjee (MD)",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      phone: "+91 98300 12345",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: "accountant@schoolpay.demo",
      name: "Subhashis Roy (Sr. Accountant)",
      passwordHash: accountantPassword,
      role: Role.ACCOUNTANT,
      phone: "+91 98311 23456",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: "viewer@schoolpay.demo",
      name: "Priyanka Sen (Auditor / Trustee)",
      passwordHash: viewerPassword,
      role: Role.VIEWER,
      phone: "+91 98322 34567",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    },
  });

  console.log("👤 Created Demo Users: Admin, Accountant, Viewer.");

  // 3. Create Academic Session
  const session = await prisma.session.create({
    data: {
      name: "Academic Year 2026-2027",
      code: "2026-27",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isCurrent: true,
    },
  });

  // Previous Session for archive
  await prisma.session.create({
    data: {
      name: "Academic Year 2025-2026",
      code: "2025-26",
      startDate: new Date("2025-04-01T00:00:00Z"),
      endDate: new Date("2026-03-31T23:59:59Z"),
      isCurrent: false,
    },
  });

  console.log("📅 Created Academic Sessions.");

  // 4. Create Fee Heads
  const feeHeads = await Promise.all([
    prisma.feeHead.create({
      data: { name: "Admission Fee (One-Time)", code: "ADMISSION", isRecurring: false, defaultAmountPaise: 1000000 },
    }),
    prisma.feeHead.create({
      data: { name: "Monthly Tuition Fee", code: "TUITION", isRecurring: true, defaultAmountPaise: 350000 },
    }),
    prisma.feeHead.create({
      data: { name: "Exam & Assessment Fee", code: "EXAM", isRecurring: false, defaultAmountPaise: 250000 },
    }),
    prisma.feeHead.create({
      data: { name: "Computer & STEM Lab Fee", code: "LAB", isRecurring: true, defaultAmountPaise: 80000 },
    }),
    prisma.feeHead.create({
      data: { name: "Library & Digital Resources", code: "LIBRARY", isRecurring: false, defaultAmountPaise: 120000 },
    }),
    prisma.feeHead.create({
      data: { name: "Sports & Annual Activities", code: "SPORTS", isRecurring: false, defaultAmountPaise: 180000 },
    }),
    prisma.feeHead.create({
      data: { name: "School Transport Service", code: "TRANSPORT", isRecurring: true, defaultAmountPaise: 180000 },
    }),
  ]);

  // 5. Create Classes & Sections
  const classData = [
    { name: "Nursery", code: "NUR", order: 1, annualFeePaise: 3200000 },
    { name: "LKG", code: "LKG", order: 2, annualFeePaise: 3400000 },
    { name: "UKG", code: "UKG", order: 3, annualFeePaise: 3600000 },
    { name: "Class 1", code: "C1", order: 4, annualFeePaise: 4200000 },
    { name: "Class 2", code: "C2", order: 5, annualFeePaise: 4400000 },
    { name: "Class 3", code: "C3", order: 6, annualFeePaise: 4600000 },
    { name: "Class 4", code: "C4", order: 7, annualFeePaise: 4800000 },
    { name: "Class 5", code: "C5", order: 8, annualFeePaise: 5000000 },
    { name: "Class 6", code: "C6", order: 9, annualFeePaise: 5400000 },
    { name: "Class 7", code: "C7", order: 10, annualFeePaise: 5600000 },
    { name: "Class 8", code: "C8", order: 11, annualFeePaise: 5800000 },
    { name: "Class 9", code: "C9", order: 12, annualFeePaise: 6400000 },
    { name: "Class 10", code: "C10", order: 13, annualFeePaise: 6800000 },
    { name: "Class 11 (Sci/Com/Arts)", code: "C11", order: 14, annualFeePaise: 7400000 },
    { name: "Class 12 (Board Prep)", code: "C12", order: 15, annualFeePaise: 7800000 },
  ];

  const createdClasses = [];
  for (const c of classData) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        code: c.code,
        order: c.order,
        annualFeePaise: c.annualFeePaise,
        sections: {
          create: [{ name: "A" }, { name: "B" }],
        },
      },
      include: { sections: true },
    });
    createdClasses.push(cls);

    // Fee structure for class
    await prisma.feeStructure.create({
      data: {
        sessionId: session.id,
        classId: cls.id,
        name: `${cls.name} Standard Fee Structure`,
        totalAnnualPaise: cls.annualFeePaise,
        headsJson: JSON.stringify([
          { headCode: "ADMISSION", name: "Admission Fee", amountPaise: 800000 },
          { headCode: "TUITION", name: "Tuition Fee (Annual)", amountPaise: cls.annualFeePaise - 1600000 },
          { headCode: "EXAM", name: "Exam & Lab Fee", amountPaise: 400000 },
          { headCode: "SPORTS", name: "Sports & Activity", amountPaise: 400000 },
        ]),
      },
    });
  }

  console.log(`🏫 Created ${createdClasses.length} Classes with Sections & Fee Structures.`);

  // 6. Seed Students & Fee Plans (~280-300 students)
  const students = [];
  let studentCounter = 1;
  let receiptCounter = 1;
  const currentYear = 2026;
  const months = [
    { index: 1, name: "April", year: 2026, dueDay: 10 },
    { index: 2, name: "May", year: 2026, dueDay: 10 },
    { index: 3, name: "June", year: 2026, dueDay: 10 },
    { index: 4, name: "July", year: 2026, dueDay: 10 },
    { index: 5, name: "August", year: 2026, dueDay: 10 },
    { index: 6, name: "September", year: 2026, dueDay: 10 },
    { index: 7, name: "October", year: 2026, dueDay: 10 },
    { index: 8, name: "November", year: 2026, dueDay: 10 },
    { index: 9, name: "December", year: 2026, dueDay: 10 },
    { index: 10, name: "January", year: 2027, dueDay: 10 },
  ];

  // We are currently simulating September/October 2026
  // Months 1 (Apr), 2 (May), 3 (Jun), 4 (Jul), 5 (Aug), 6 (Sep) are due/past.

  for (const cls of createdClasses) {
    for (const sec of cls.sections) {
      // 10 students per section = 20 per class * 15 classes = 300 students
      for (let sIdx = 1; sIdx <= 10; sIdx++) {
        const isBengali = Math.random() > 0.3;
        const firstName = isBengali
          ? BENGALI_FIRST_NAMES[Math.floor(Math.random() * BENGALI_FIRST_NAMES.length)]
          : OTHER_FIRST_NAMES[Math.floor(Math.random() * OTHER_FIRST_NAMES.length)];
        const lastName = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
        const guardianFirst = BENGALI_FIRST_NAMES[Math.floor(Math.random() * BENGALI_FIRST_NAMES.length)];
        const guardianName = `${guardianFirst} ${lastName}`;
        const admissionNo = `AVM-${currentYear}-${String(studentCounter).padStart(4, "0")}`;
        const phone = `9830${String(100000 + studentCounter).slice(1)}`;
        const locality = LOCALITIES[Math.floor(Math.random() * LOCALITIES.length)];
        const gender = sIdx % 2 === 0 ? "Female" : "Male";

        // Concessions for some students
        let discountPaise = 0;
        let discountReason: string | null = null;
        if (sIdx === 3) {
          discountPaise = 400000; // ₹4,000 sibling concession
          discountReason = "Sibling Concession (Elder sibling in C10)";
        } else if (sIdx === 8) {
          discountPaise = 600000; // ₹6,000 merit scholarship
          discountReason = "Merit Scholarship (Top 5% in entrance exam)";
        }

        const admissionFeePaise = 600000; // ₹6,000
        const totalFeePaise = cls.annualFeePaise;
        const remainingFeePaise = Math.max(0, totalFeePaise - discountPaise - admissionFeePaise);
        const monthlyAmount = Math.floor(remainingFeePaise / 10);
        const remainder = remainingFeePaise % 10;

        const student = await prisma.student.create({
          data: {
            admissionNo,
            rollNo: String(sIdx),
            firstName,
            lastName,
            gender,
            guardianName,
            guardianRelation: "Father",
            guardianPhone: phone,
            guardianEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            address: `${sIdx * 12 + 4}, ${locality}`,
            city: "Kolkata",
            state: "West Bengal",
            pinCode: `7000${String(10 + (sIdx % 80)).padStart(2, "0")}`,
            status: StudentStatus.ACTIVE,
            admissionDate: new Date("2026-04-01T00:00:00Z"),
            classId: cls.id,
            sectionId: sec.id,
            sessionId: session.id,
          },
        });
        students.push(student);

        // Create Fee Plan
        const feePlan = await prisma.studentFeePlan.create({
          data: {
            studentId: student.id,
            sessionId: session.id,
            totalFeePaise,
            admissionFeePaise,
            discountPaise,
            discountReason,
            remainingFeePaise,
            installmentCount: 10,
            dueDayOfMonth: 10,
            notes: discountReason ? `Approved Concession: ${discountReason}` : null,
          },
        });

        // Create 10 Installments
        const installments = [];
        for (let mIdx = 0; mIdx < months.length; mIdx++) {
          const m = months[mIdx];
          const mAmount = mIdx === 0 ? monthlyAmount + remainder : monthlyAmount;
          // Month index in JS Date is 0-indexed. April is 3, May is 4, etc.
          const month0Based = (3 + mIdx) % 12;
          const dueDate = new Date(Date.UTC(m.year, month0Based, m.dueDay, 18, 29, 59));

          const inst = await prisma.installment.create({
            data: {
              feePlanId: feePlan.id,
              studentId: student.id,
              sessionId: session.id,
              title: `${m.name} ${m.year} - Tuition Fee`,
              monthIndex: m.index,
              monthName: m.name,
              dueDate,
              amountPaise: mAmount,
              paidAmountPaise: 0,
              status: InstallmentStatus.PENDING,
            },
          });
          installments.push(inst);
        }

        // Simulate realistic payment behaviors:
        // Group A (50%): Paid April, May, June, July, August, September on time
        // Group B (25%): Paid April, May, June, July; August & September Pending/Overdue
        // Group C (15%): Paid April, May; June, July, August, September Overdue with fines
        // Group D (10%): Paid only Admission/April; Rest Overdue (Chronic Defaulters)
        let paidMonthsCount = 6;
        if (sIdx === 2 || sIdx === 7) paidMonthsCount = 4;
        else if (sIdx === 4 || sIdx === 9) paidMonthsCount = 2;
        else if (sIdx === 5) paidMonthsCount = 1;

        for (let pIdx = 0; pIdx < paidMonthsCount; pIdx++) {
          const inst = installments[pIdx];
          const payDate = new Date(Date.UTC(inst.dueDate.getUTCFullYear(), inst.dueDate.getUTCMonth(), Math.floor(Math.random() * 8) + 2, 10, 30, 0));
          const modes: PaymentMode[] = [PaymentMode.UPI, PaymentMode.CASH, PaymentMode.BANK_TRANSFER, PaymentMode.ONLINE_GATEWAY];
          const mode = modes[(studentCounter + pIdx) % modes.length];
          const receiptNo = `REC-2026-${String(receiptCounter++).padStart(4, "0")}`;
          const isCash = mode === PaymentMode.CASH;
          const txnRef = isCash ? null : `TXN${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 9000 + 1000)}`;

          const payment = await prisma.payment.create({
            data: {
              receiptNo,
              studentId: student.id,
              sessionId: session.id,
              amountPaise: inst.amountPaise,
              mode,
              transactionRef: txnRef,
              paymentDate: payDate,
              collectedById: (receiptCounter % 3 === 0) ? admin.id : accountant.id,
              remarks: `Payment received for ${inst.monthName} fee`,
              status: PaymentStatus.COMPLETED,
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

        // For overdue installments beyond paid months up to month index 6 (Sep), mark OVERDUE and create Fine
        for (let oIdx = paidMonthsCount; oIdx < 6; oIdx++) {
          const inst = installments[oIdx];
          const daysLate = (6 - oIdx) * 30 + 15;
          const finePaise = Math.min(50000, daysLate * 2000); // ₹20/day up to ₹500

          await prisma.installment.update({
            where: { id: inst.id },
            data: {
              status: InstallmentStatus.OVERDUE,
            },
          });

          await prisma.fine.create({
            data: {
              installmentId: inst.id,
              studentId: student.id,
              sessionId: session.id,
              amountPaise: finePaise,
              daysOverdue: daysLate,
              isWaived: false,
            },
          });
        }

        studentCounter++;
      }
    }
  }

  console.log(`🎓 Created ${students.length} Students with Fee Plans, Installments, Payments & Overdue Fines.`);

  // 7. Seed Reminder Templates & Logs
  const templateWAEn = await prisma.reminderTemplate.create({
    data: {
      name: "Standard Fee Due Reminder (English)",
      channel: ReminderChannel.WHATSAPP,
      language: Language.EN,
      content: "Dear Parent, this is a reminder from {school}. The pending fee for {student} of ₹{amount} was due on {due_date}. Kindly pay at the earliest to avoid late charges: {portal_link}",
      isDefault: true,
    },
  });

  const templateWABn = await prisma.reminderTemplate.create({
    data: {
      name: "ফি জমা দেওয়ার অনুরোধ (বাংলা)",
      channel: ReminderChannel.WHATSAPP,
      language: Language.BN,
      content: "শ্রদ্ধেয় অভিভাবক, {school}-এর পক্ষ থেকে জানানো হচ্ছে যে {student}-এর বকেয়া ফি ₹{amount} জমা দেওয়ার তারিখ ছিল {due_date}। অবিলম্বে ফি প্রদান করার জন্য অনুরোধ করা হচ্ছে: {portal_link}",
      isDefault: false,
    },
  });

  const templateWAHi = await prisma.reminderTemplate.create({
    data: {
      name: "शुल्क भुगतान अनुस्मारक (हिंदी)",
      channel: ReminderChannel.WHATSAPP,
      language: Language.HI,
      content: "आदरणीय अभिभावक, {school} से विनम्र निवेदन है कि {student} का बकाया शुल्क ₹{amount}, नियत तिथि {due_date} तक देय था। कृपया शीघ्र भुगतान करें: {portal_link}",
      isDefault: false,
    },
  });

  // Create sample reminder logs for overdue students
  const overdueStudents = await prisma.student.findMany({
    where: {
      installments: {
        some: { status: InstallmentStatus.OVERDUE },
      },
    },
    take: 35,
    include: {
      installments: {
        where: { status: InstallmentStatus.OVERDUE },
      },
    },
  });

  for (const s of overdueStudents) {
    const totalDue = s.installments.reduce((sum, inst) => sum + (inst.amountPaise - inst.paidAmountPaise), 0);
    await prisma.reminderLog.create({
      data: {
        studentId: s.id,
        sessionId: session.id,
        recipientPhone: s.guardianPhone,
        recipientName: s.guardianName,
        channel: ReminderChannel.WHATSAPP,
        templateName: templateWAEn.name,
        messageContent: `Dear Parent, reminder from Arohon Vidya Mandir: Fee of ₹${(totalDue / 100).toLocaleString("en-IN")} is pending for ${s.firstName} ${s.lastName}. Please pay online or at cash counter.`,
        amountDuePaise: totalDue,
        status: ReminderStatus.DELIVERED,
        providerRef: `MOCK_WA_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`,
        sentById: accountant.id,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 86400000)),
      },
    });
  }

  console.log(`📱 Seeded Reminder Templates & WhatsApp logs.`);

  // 8. Seed Expenses
  const expenseCategories = [
    { title: "WBSEDCL Electricity Bill - Main Campus & Labs", category: ExpenseCategory.UTILITIES, amountPaise: 4850000, mode: PaymentMode.BANK_TRANSFER, vendor: "WBSEDCL" },
    { title: "Monthly Teachers & Staff Payroll - August 2026", category: ExpenseCategory.SALARIES, amountPaise: 38500000, mode: PaymentMode.BANK_TRANSFER, vendor: "Staff Direct Bank Transfer" },
    { title: "Smart Classroom Projector Maintenance & Bulbs", category: ExpenseCategory.MAINTENANCE, amountPaise: 1250000, mode: PaymentMode.CASH, vendor: "Infotech Solutions Kolkata" },
    { title: "Annual Exam Answer Booklets & Printing Stationery", category: ExpenseCategory.PRINTING, amountPaise: 2450000, mode: PaymentMode.UPI, vendor: "Modern Printers College St" },
    { title: "Sports Equipment (Cricket kits, footballs, nets)", category: ExpenseCategory.SUPPLIES, amountPaise: 1850000, mode: PaymentMode.UPI, vendor: "Das Sports Esplanade" },
    { title: "Science Lab Reagents & Physics Apparatus", category: ExpenseCategory.SUPPLIES, amountPaise: 1650000, mode: PaymentMode.BANK_TRANSFER, vendor: "Bengal Scientific Instruments" },
    { title: "Independence Day Cultural Function Stage & Sound", category: ExpenseCategory.EVENTS, amountPaise: 3500000, mode: PaymentMode.CASH, vendor: "Sur Sangeet Events" },
    { title: "Drinking Water Filtration Plant RO Filter Replacement", category: ExpenseCategory.MAINTENANCE, amountPaise: 850000, mode: PaymentMode.CASH, vendor: "AquaCare Kolkata" },
  ];

  for (let i = 0; i < expenseCategories.length; i++) {
    const exp = expenseCategories[i];
    const expDate = new Date(Date.now() - (i * 4 + 2) * 86400000);
    await prisma.expense.create({
      data: {
        sessionId: session.id,
        title: exp.title,
        category: exp.category,
        amountPaise: exp.amountPaise,
        mode: exp.mode,
        paymentDate: expDate,
        receiptNo: `EXP-2026-${String(i + 1).padStart(4, "0")}`,
        vendorName: exp.vendor,
        remarks: "Approved by Managing Director",
        createdById: accountant.id,
      },
    });
  }

  console.log(`🧾 Seeded School Expenses.`);

  // 9. Seed Cash Book Days
  for (let d = 10; d >= 0; d--) {
    const dayDate = new Date(Date.now() - d * 86400000);
    dayDate.setUTCHours(0, 0, 0, 0);

    const opening = 15000000 + d * 500000;
    const receipts = Math.floor(Math.random() * 8000000) + 2000000;
    const expenses = Math.floor(Math.random() * 3000000) + 500000;
    const closing = opening + receipts - expenses;
    const isClosed = d > 0; // Past days closed, today open

    await prisma.cashBookDay.create({
      data: {
        sessionId: session.id,
        date: dayDate,
        openingBalancePaise: opening,
        totalReceiptsPaise: receipts,
        totalExpensesPaise: expenses,
        closingBalancePaise: closing,
        isClosed,
        closedById: isClosed ? accountant.id : null,
        closedAt: isClosed ? new Date(dayDate.getTime() + 18 * 3600000) : null,
        remarks: isClosed ? "Day closed and physical cash verified with register" : "Open for transactions",
      },
    });
  }

  console.log(`📖 Seeded Cash Book Days.`);

  // 10. Seed Settings
  const settings = [
    { key: "school_name", value: "Arohon Vidya Mandir", category: "school" },
    { key: "school_tagline", value: "Excellence in Education Since 1994 (Affiliated to CISCE / State Board)", category: "school" },
    { key: "school_address", value: "Plot 14, Sector V, Salt Lake City, Kolkata - 700091, West Bengal", category: "school" },
    { key: "school_phone", value: "+91 33 2357 8900 / +91 98300 12345", category: "school" },
    { key: "school_email", value: "accounts@arohonvidyamandir.edu.in", category: "school" },
    { key: "school_website", value: "https://arohonvidyamandir.edu.in", category: "school" },
    { key: "receipt_prefix", value: "REC", category: "fees" },
    { key: "receipt_footer_note", value: "This is a computer-generated fee receipt. Valid without physical signature. Fees once paid are non-refundable.", category: "fees" },
    { key: "fine_grace_days", value: "5", category: "fines" },
    { key: "fine_type", value: "FLAT_PER_DAY", category: "fines" },
    { key: "fine_rate_paise", value: "2000", category: "fines" }, // ₹20/day
    { key: "fine_max_cap_paise", value: "50000", category: "fines" }, // ₹500 max
    { key: "due_day_of_month", value: "10", category: "fees" },
    { key: "currency_code", value: "INR", category: "general" },
  ];

  for (const s of settings) {
    await prisma.setting.create({
      data: {
        key: s.key,
        value: s.value,
        category: s.category,
      },
    });
  }

  // 11. Seed Audit Logs
  const auditLogs = [
    { action: "SESSION_SWITCHED", entityType: "Session", entityId: session.id, details: "Active session set to 2026-27", userId: admin.id, userName: admin.name, userRole: "ADMIN" },
    { action: "BULK_STUDENT_IMPORT", entityType: "Student", entityId: null, details: "Imported 300 students from CBSE_Students_2026.xlsx", userId: admin.id, userName: admin.name, userRole: "ADMIN" },
    { action: "FEE_STRUCTURE_UPDATED", entityType: "FeeStructure", entityId: null, details: "Configured Class 1 - Class 12 fee breakdown", userId: admin.id, userName: admin.name, userRole: "ADMIN" },
    { action: "FINE_WAIVED", entityType: "Fine", entityId: "fine_demo_01", details: "Waived ₹400 late fee for medical leave (Doc ref #402)", userId: admin.id, userName: admin.name, userRole: "ADMIN" },
    { action: "DAY_BOOK_CLOSED", entityType: "CashBook", entityId: null, details: "Cash book verified and closed for yesterday", userId: accountant.id, userName: accountant.name, userRole: "ACCOUNTANT" },
  ];

  for (const a of auditLogs) {
    await prisma.auditLog.create({
      data: {
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
        userId: a.userId,
        userName: a.userName,
        userRole: a.userRole,
      },
    });
  }

  console.log("📜 Seeded Audit Logs.");
  console.log("✨ Seed completed successfully! All demo data is live.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
