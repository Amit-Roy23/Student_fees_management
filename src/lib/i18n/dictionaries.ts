export type Locale = "en" | "bn" | "hi";

export interface Dictionary {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    cancel: string;
    search: string;
    filter: string;
    all: string;
    allClasses: string;
    actions: string;
    status: string;
    date: string;
    amount: string;
    rupeesSymbol: string;
    view: string;
    edit: string;
    delete: string;
    print: string;
    downloadBill: string;
    exportExcel: string;
    importExcel: string;
    logout: string;
    roleMD: string;
    roleClerk: string;
    roleParent: string;
    success: string;
    error: string;
    accessDeniedTitle: string;
    accessDeniedDesc: string;
    backToSafety: string;
    demoNotice: string;
    themeLight: string;
    themeDark: string;
  };
  nav: {
    dashboard: string;
    students: string;
    feeStructure: string;
    collectFee: string;
    cashBook: string;
    dues: string;
    parentHome: string;
    parentPay: string;
    parentPayments: string;
  };
  status: {
    paid: string;
    partial: string;
    pending: string;
    overdue: string;
    created: string;
    failed: string;
  };
  auth: {
    title: string;
    subtitle: string;
    staffTab: string;
    parentTab: string;
    email: string;
    password: string;
    signIn: string;
    quickDemoLogin: string;
    orSignInWithEmail: string;
    invalidCredentials: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    kpiCollectedThisMonth: string;
    kpiTotalOutstanding: string;
    kpiOverdueAmount: string;
    kpiFinesCollected: string;
    kpiStudentsWithDues: string;
    chartTitle: string;
    chartCollected: string;
    chartExpected: string;
    recentPayments: string;
    topDefaulters: string;
    receiptNo: string;
    student: string;
    mode: string;
    daysOverdue: string;
  };
  students: {
    title: string;
    subtitle: string;
    addStudent: string;
    admissionNo: string;
    name: string;
    class: string;
    guardian: string;
    guardianPhone: string;
    address: string;
    admissionDate: string;
    admissionFee: string;
    totalRemainingFee: string;
    installmentsCount: string;
    searchPlaceholder: string;
    noStudents: string;
    studentProfile: string;
    feePlan: string;
    installmentSchedule: string;
    paymentHistory: string;
    fines: string;
    totalFee: string;
    totalPaid: string;
    totalDue: string;
    month: string;
    dueDate: string;
    paidAmount: string;
    fineAmount: string;
  };
  feeStructure: {
    title: string;
    subtitle: string;
    classCol: string;
    admissionFeeCol: string;
    remainingFeeCol: string;
    installmentsCol: string;
    dueDayCol: string;
    editStructure: string;
    updateSuccess: string;
  };
  collectFee: {
    title: string;
    subtitle: string;
    searchStudent: string;
    searchHint: string;
    selectInstallments: string;
    selectAllDue: string;
    amountToCollect: string;
    paymentMode: string;
    modeCash: string;
    modeOnline: string;
    txnRefRequired: string;
    cashNoteOptional: string;
    remarks: string;
    collectAndPrint: string;
    successToast: string;
  };
  cashBook: {
    title: string;
    subtitle: string;
    dateRangeFilter: string;
    fromDate: string;
    toDate: string;
    totalCashCollected: string;
    receiptsCount: string;
    perDaySummary: string;
    runningTotal: string;
    collectedBy: string;
    todayOnlyNotice: string;
  };
  dues: {
    title: string;
    subtitle: string;
    totalOverdueAmount: string;
    lateFinesComputed: string;
    totalDuesListed: string;
    daysLate: string;
    upcoming: string;
    lastReminded: string;
    notReminded: string;
    sendReminder: string;
    sendReminderAll: string;
    sendAndLog: string;
    previewTitle: string;
    bulkConfirmTitle: string;
    bulkConfirmDesc: string;
  };
  reminders: {
    template: string;
  };
  parent: {
    welcome: string;
    childrenOverview: string;
    payOnline: string;
    nextDue: string;
    noDues: string;
    selectChild: string;
    selectInstallmentsToPay: string;
    payableTotal: string;
    payNow: string;
    allInstallmentsPaid: string;
    paymentHistoryTitle: string;
    installmentsCovered: string;
    method: string;
    paymentSuccessTitle: string;
    paymentSuccessDesc: string;
    paymentFailedTitle: string;
    paymentFailedDesc: string;
    tryAgain: string;
  };
  razorpay: {
    modalTitle: string;
    schoolName: string;
    demoNotice: string;
    selectPaymentMethod: string;
    tabUpi: string;
    tabNetbanking: string;
    tabCard: string;
    tabBankTransfer: string;
    enterUpiId: string;
    popularApps: string;
    selectBank: string;
    popularBanks: string;
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardTestHint: string;
    schoolBankDetails: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    enterUtr: string;
    transferDate: string;
    bankTransferNotice: string;
    simulateSuccess: string;
    simulateFailure: string;
    processing: string;
  };
  bill: {
    schoolName: string;
    headerSubtitle: string;
    officialReceipt: string;
    studentName: string;
    admissionNo: string;
    class: string;
    academicSession: string;
    guardianName: string;
    guardianPhone: string;
    particulars: string;
    fee: string;
    lateFine: string;
    total: string;
    grandTotal: string;
    amountInWords: string;
    paymentMethod: string;
    txnId: string;
    statusPaid: string;
    authorizedSignatory: string;
    footerNote: string;
  };
  importExport: {
    importTitle: string;
    importSubtitle: string;
    downloadTemplate: string;
    uploadFile: string;
    dropFileHere: string;
    validRows: string;
    invalidRows: string;
    errorSummary: string;
    importValidRows: string;
    importSuccess: string;
    exportSuccess: string;
  };
}

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    common: {
      appName: "SchoolPay",
      tagline: "School Fee & Accounts Management",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      filter: "Filter",
      all: "All",
      allClasses: "All Classes",
      actions: "Actions",
      status: "Status",
      date: "Date",
      amount: "Amount",
      rupeesSymbol: "₹",
      view: "View",
      edit: "Edit",
      delete: "Delete",
      print: "Print",
      downloadBill: "Download Bill (PDF)",
      exportExcel: "Export to Excel",
      importExcel: "Import from Excel",
      logout: "Sign Out",
      roleMD: "Managing Director",
      roleClerk: "Accountant / Clerk",
      roleParent: "Parent / Guardian",
      success: "Success",
      error: "Error",
      accessDeniedTitle: "Access Restricted",
      accessDeniedDesc: "You do not have permission to view this page.",
      backToSafety: "Back to Home",
      demoNotice: "Demo mode – no real money is charged",
      themeLight: "Light",
      themeDark: "Dark",
    },
    nav: {
      dashboard: "Dashboard",
      students: "Students",
      feeStructure: "Fee Structure",
      collectFee: "Collect Fee",
      cashBook: "Cash Book",
      dues: "Dues & Fines",
      parentHome: "My Children",
      parentPay: "Pay Fees Online",
      parentPayments: "Payment History",
    },
    status: {
      paid: "PAID",
      partial: "PARTIAL",
      pending: "PENDING",
      overdue: "OVERDUE",
      created: "CREATED",
      failed: "FAILED",
    },
    auth: {
      title: "SchoolPay Portal",
      subtitle: "Sign in to manage fee collection & student records",
      staffTab: "Staff Login",
      parentTab: "Parent Portal",
      email: "Email Address",
      password: "Password",
      signIn: "Sign In",
      quickDemoLogin: "Quick Demo Personas",
      orSignInWithEmail: "Or enter credentials manually",
      invalidCredentials: "Invalid email or password",
    },
    dashboard: {
      title: "MD Executive Dashboard",
      subtitle: "Real-time fee collection, outstanding demand & defaulter analytics",
      kpiCollectedThisMonth: "Collected This Month",
      kpiTotalOutstanding: "Total Outstanding",
      kpiOverdueAmount: "Overdue Amount",
      kpiFinesCollected: "Fines Collected",
      kpiStudentsWithDues: "Students with Dues",
      chartTitle: "Monthly Collection vs Target",
      chartCollected: "Collected (₹)",
      chartExpected: "Target Demand (₹)",
      recentPayments: "Recent Payment Entries",
      topDefaulters: "Top 5 Defaulters",
      receiptNo: "Receipt No.",
      student: "Student",
      mode: "Mode",
      daysOverdue: "Days Overdue",
    },
    students: {
      title: "Students Directory",
      subtitle: "Manage student admissions, profiles and installment ledgers",
      addStudent: "New Admission",
      admissionNo: "Admission No.",
      name: "Student Name",
      class: "Class",
      guardian: "Guardian Name",
      guardianPhone: "Guardian Phone",
      address: "Address",
      admissionDate: "Admission Date",
      admissionFee: "Admission Fee (₹)",
      totalRemainingFee: "Total Remaining Fee (₹)",
      installmentsCount: "Installments",
      searchPlaceholder: "Search by name, admission no., or phone...",
      noStudents: "No students found matching your criteria.",
      studentProfile: "Student Profile",
      feePlan: "Annual Fee Plan",
      installmentSchedule: "Installment Schedule",
      paymentHistory: "Payment History",
      fines: "Fines & Penalties",
      totalFee: "Total Annual Fee",
      totalPaid: "Total Paid",
      totalDue: "Net Outstanding",
      month: "Month",
      dueDate: "Due Date",
      paidAmount: "Paid (₹)",
      fineAmount: "Fine (₹)",
    },
    feeStructure: {
      title: "Class Fee Structure",
      subtitle: "Configure default annual fee schedules and due days per class",
      classCol: "Class",
      admissionFeeCol: "Default Admission Fee",
      remainingFeeCol: "Remaining Fee (Annual)",
      installmentsCol: "Installments",
      dueDayCol: "Due Day of Month",
      editStructure: "Edit Fee Rule",
      updateSuccess: "Fee structure updated successfully",
    },
    collectFee: {
      title: "Collect Fee Counter",
      subtitle: "Fast counter payment entry (Cash & Online) with instant receipt",
      searchStudent: "Search Student",
      searchHint: "Enter student name, admission number, or guardian phone",
      selectInstallments: "Select Pending Installments",
      selectAllDue: "Select All Due",
      amountToCollect: "Amount to Collect (₹)",
      paymentMode: "Payment Mode",
      modeCash: "Cash",
      modeOnline: "Online (UPI / Bank)",
      txnRefRequired: "Transaction ID / UTR is required",
      cashNoteOptional: "Receipt Note (Optional)",
      remarks: "Remarks",
      collectAndPrint: "Collect & Print Receipt",
      successToast: "Payment recorded successfully",
    },
    cashBook: {
      title: "Cash Book",
      subtitle: "Date-wise register of physical cash receipts with running balance",
      dateRangeFilter: "Date Range Filter",
      fromDate: "From Date",
      toDate: "To Date",
      totalCashCollected: "Total Cash Collected",
      receiptsCount: "Receipts Count",
      perDaySummary: "Per-Day Cash Summary",
      runningTotal: "Running Total",
      collectedBy: "Collected By",
      todayOnlyNotice: "Clerk Mode: Showing today's cash entries only.",
    },
    dues: {
      title: "Dues & Late Fines",
      subtitle: "Overdue fee tracking, late fine calculation & multi-lingual reminders",
      totalOverdueAmount: "Total Overdue Amount",
      lateFinesComputed: "Late Fines Computed",
      totalDuesListed: "Total Dues Listed",
      daysLate: "Days Late",
      upcoming: "Upcoming",
      lastReminded: "Last Reminded",
      notReminded: "Not Reminded",
      sendReminder: "Send Reminder",
      sendReminderAll: "Send reminder to all overdue",
      sendAndLog: "Send & Log",
      previewTitle: "Fee Reminder Preview",
      bulkConfirmTitle: "Send Overdue Reminders to All?",
      bulkConfirmDesc: "This will log reminder messages for all overdue guardians in the current language.",
    },
    reminders: {
      template: "Dear {guardian}, the fee of {amount} for {student} was due on {date}. Please pay at the earliest.",
    },
    parent: {
      welcome: "Welcome to Parent Portal",
      childrenOverview: "My Children's Fee Summary",
      payOnline: "Pay Fees Online",
      nextDue: "Next Due",
      noDues: "All Dues Paid",
      selectChild: "Select Child",
      selectInstallmentsToPay: "Select Installments to Pay",
      payableTotal: "Payable Total",
      payNow: "Proceed to Pay",
      allInstallmentsPaid: "No pending installments for this student.",
      paymentHistoryTitle: "Online Payment Receipts",
      installmentsCovered: "Installments Covered",
      method: "Method",
      paymentSuccessTitle: "Payment Successful!",
      paymentSuccessDesc: "Your fee payment has been recorded and an official receipt has been issued.",
      paymentFailedTitle: "Payment Failed",
      paymentFailedDesc: "The payment transaction could not be processed. Please try again.",
      tryAgain: "Try Again",
    },
    razorpay: {
      modalTitle: "Demo Razorpay – Test Mode",
      schoolName: "Arohon Vidya Mandir",
      demoNotice: "Demo mode – no real money is charged",
      selectPaymentMethod: "Select Payment Method",
      tabUpi: "UPI",
      tabNetbanking: "Net Banking",
      tabCard: "Debit / Credit Card",
      tabBankTransfer: "Bank Transfer",
      enterUpiId: "Enter UPI ID (e.g. parent@upi)",
      popularApps: "Or select UPI App",
      selectBank: "Select Your Bank",
      popularBanks: "Popular Banks",
      cardNumber: "Card Number",
      expiry: "Expiry (MM/YY)",
      cvv: "CVV",
      cardTestHint: "Use 4111 2222 3333 4444 for testing",
      schoolBankDetails: "School Beneficiary Bank Account",
      accountNumber: "A/C No: 50200012345678",
      ifscCode: "IFSC: HDFC0001234",
      bankName: "HDFC Bank, Salt Lake Branch",
      enterUtr: "Enter UTR / Transaction Ref No.",
      transferDate: "Transfer Date",
      bankTransferNotice: "In production, bank transfers are verified via statement sync.",
      simulateSuccess: "Simulate Success",
      simulateFailure: "Simulate Failure",
      processing: "Processing payment...",
    },
    bill: {
      schoolName: "Arohon Vidya Mandir",
      headerSubtitle: "Kolkata, West Bengal • Official Fee Receipt",
      officialReceipt: "Official Fee Receipt",
      studentName: "Student Name",
      admissionNo: "Admission No",
      class: "Class",
      academicSession: "Academic Session",
      guardianName: "Guardian Name",
      guardianPhone: "Guardian Mobile",
      particulars: "Fee Particulars",
      fee: "Fee (₹)",
      lateFine: "Late Fine (₹)",
      total: "Total (₹)",
      grandTotal: "Grand Total Paid",
      amountInWords: "Amount in words",
      paymentMethod: "Payment Method",
      txnId: "Transaction Ref / UTR",
      statusPaid: "PAID",
      authorizedSignatory: "Authorized Signatory",
      footerNote: "* Computer generated receipt. Fees once deposited are non-refundable.",
    },
    importExport: {
      importTitle: "Bulk Student Admission via Excel",
      importSubtitle: "Upload standard .xlsx workbook with student admission records",
      downloadTemplate: "Download Excel Template",
      uploadFile: "Choose .xlsx File",
      dropFileHere: "Drag and drop student excel file here, or click to browse",
      validRows: "Valid Rows",
      invalidRows: "Invalid Rows",
      errorSummary: "Validation Errors",
      importValidRows: "Import Valid Students",
      importSuccess: "Successfully imported students into database",
      exportSuccess: "Excel spreadsheet exported successfully",
    },
  },
  bn: {
    common: {
      appName: "স্কুলপে (SchoolPay)",
      tagline: "স্কুল ফি এবং হিসাব ব্যবস্থাপনা",
      loading: "লোড হচ্ছে...",
      save: "সংরক্ষণ করুন",
      cancel: "বাতিল",
      search: "অনুসন্ধান",
      filter: "ফিল্টার",
      all: "সব",
      allClasses: "সকল শ্রেণী",
      actions: "পদক্ষেপ",
      status: "অবস্থা",
      date: "তারিখ",
      amount: "পরিমাণ",
      rupeesSymbol: "₹",
      view: "দেখুন",
      edit: "সম্পাদনা",
      delete: "মুছুন",
      print: "প্রিন্ট করুন",
      downloadBill: "বিল ডাউনলোড করুন (PDF)",
      exportExcel: "এক্সেল এক্সপোর্ট",
      importExcel: "এক্সেল ইমপোর্ট",
      logout: "লগআউট",
      roleMD: "ম্যানেজিং ডিরেক্টর",
      roleClerk: "হিসাবরক্ষক / ক্লার্ক",
      roleParent: "অভিভাবক",
      success: "সফল",
      error: "ত্রুটি",
      accessDeniedTitle: "অনুমতি নেই",
      accessDeniedDesc: "এই পৃষ্ঠাটি দেখার অনুমতি আপনার নেই।",
      backToSafety: "হোমে ফিরে যান",
      demoNotice: "ডেমো মোড – কোনো আসল টাকা কাটা হবে না",
      themeLight: "লাইট",
      themeDark: "ডার্ক",
    },
    nav: {
      dashboard: "ড্যাশবোর্ড",
      students: "শিক্ষার্থীবৃন্দ",
      feeStructure: "ফি কাঠামো",
      collectFee: "ফি সংগ্রহ",
      cashBook: "ক্যাশ বুক",
      dues: "বকেয়া ও জরিমানা",
      parentHome: "আমার সন্তানরা",
      parentPay: "অনলাইনে ফি প্রদান",
      parentPayments: "পেমেন্ট ইতিহাস",
    },
    status: {
      paid: "পরিশোধিত",
      partial: "আংশিক",
      pending: "বকেয়া",
      overdue: "মেয়াদোত্তীর্ণ",
      created: "তৈরি হয়েছে",
      failed: "ব্যর্থ",
    },
    auth: {
      title: "স্কুলপে পোর্টাল",
      subtitle: "ফি সংগ্রহ ও শিক্ষার্থী তথ্য পরিচালনায় সাইন ইন করুন",
      staffTab: "কর্মকর্তা লগইন",
      parentTab: "অভিভাবক পোর্টাল",
      email: "ইমেইল ঠিকানা",
      password: "পাসওয়ার্ড",
      signIn: "সাইন ইন করুন",
      quickDemoLogin: "ডেমো লগইন বাটন",
      orSignInWithEmail: "অথবা ইমেইল দিয়ে লগইন করুন",
      invalidCredentials: "ভুল ইমেইল বা পাসওয়ার্ড",
    },
    dashboard: {
      title: "এমডি এক্সিকিউটিভ ড্যাশবোর্ড",
      subtitle: "রিয়েল-টাইম ফি আদায়, বকেয়া এবং খেলাপি শিক্ষার্থী বিশ্লেষণ",
      kpiCollectedThisMonth: "চলতি মাসে সংগৃহীত",
      kpiTotalOutstanding: "মোট বকেয়া পরিমাণ",
      kpiOverdueAmount: "মেয়াদোত্তীর্ণ বকেয়া",
      kpiFinesCollected: "আদায়কৃত জরিমানা",
      kpiStudentsWithDues: "বকেয়া থাকা শিক্ষার্থী",
      chartTitle: "মাসিক আদায় বনাম লক্ষ্যমাত্রা",
      chartCollected: "সংগৃহীত (₹)",
      chartExpected: "লক্ষ্যমাত্রা (₹)",
      recentPayments: "সাম্প্রতিক পেমেন্ট তালিকা",
      topDefaulters: "শীর্ষ ৫ জন বকেয়া শিক্ষার্থী",
      receiptNo: "রসিদ নম্বর",
      student: "শিক্ষার্থী",
      mode: "পদ্ধতি",
      daysOverdue: "বকেয়া দিন",
    },
    students: {
      title: "শিক্ষার্থী তালিকা",
      subtitle: "শিক্ষার্থী ভর্তি, প্রোফাইল এবং কিস্তির খতিয়ান পরিচালনা করুন",
      addStudent: "নতুন ভর্তি",
      admissionNo: "ভর্তি নম্বর",
      name: "শিক্ষার্থীর নাম",
      class: "শ্রেণী",
      guardian: "অভিভাবকের নাম",
      guardianPhone: "অভিভাবকের মোবাইল",
      address: "ঠিকানা",
      admissionDate: "ভর্তির তারিখ",
      admissionFee: "ভর্তি ফি (₹)",
      totalRemainingFee: "অবশিষ্ট বার্ষিক ফি (₹)",
      installmentsCount: "কিস্তির সংখ্যা",
      searchPlaceholder: "নাম, ভর্তি নম্বর বা ফোন দিয়ে খুঁজুন...",
      noStudents: "কোনো শিক্ষার্থী খুঁজে পাওয়া যায়নি।",
      studentProfile: "শিক্ষার্থী প্রোফাইল",
      feePlan: "বার্ষিক ফি পরিকল্পনা",
      installmentSchedule: "কিস্তির সময়সূচী",
      paymentHistory: "পেমেন্ট ইতিহাস",
      fines: "জরিমানা ও দণ্ড",
      totalFee: "মোট বার্ষিক ফি",
      totalPaid: "মোট পরিশোধিত",
      totalDue: "মোট বকেয়া",
      month: "মাস",
      dueDate: "শেষ তারিখ",
      paidAmount: "পরিশোধ (₹)",
      fineAmount: "জরিমানা (₹)",
    },
    feeStructure: {
      title: "শ্রেণীভিত্তিক ফি কাঠামো",
      subtitle: "শ্রেণীভিত্তিক ডিফল্ট ফি নিয়ম এবং কিস্তির শেষ দিন নির্ধারণ করুন",
      classCol: "শ্রেণী",
      admissionFeeCol: "ডিফল্ট ভর্তি ফি",
      remainingFeeCol: "অবশিষ্ট বার্ষিক ফি",
      installmentsCol: "কিস্তি সংখ্যা",
      dueDayCol: "মাসের শেষ দিন",
      editStructure: "ফি নিয়ম পরিবর্তন",
      updateSuccess: "ফি কাঠামো সফলভাবে আপডেট হয়েছে",
    },
    collectFee: {
      title: "ফি কাউন্টার",
      subtitle: "দ্রুত কাউন্টার পেমেন্ট এন্ট্রি (নগদ ও অনলাইন) এবং তাৎক্ষণিক রসিদ",
      searchStudent: "শিক্ষার্থী খুঁজুন",
      searchHint: "শিক্ষার্থীর নাম, ভর্তি নম্বর বা মোবাইল নম্বর লিখুন",
      selectInstallments: "বকেয়া কিস্তি নির্বাচন করুন",
      selectAllDue: "সকল বকেয়া নির্বাচন",
      amountToCollect: "আদায়ের পরিমাণ (₹)",
      paymentMode: "পেমেন্ট মাধ্যম",
      modeCash: "নগদ (Cash)",
      modeOnline: "অনলাইন (UPI / ব্যাংক)",
      txnRefRequired: "ট্রানজ্যাকশন আইডি / UTR আবশ্যক",
      cashNoteOptional: "রসিদ মন্তব্য (ঐচ্ছিক)",
      remarks: "মন্তব্য",
      collectAndPrint: "ফি সংগ্রহ ও রসিদ প্রিন্ট",
      successToast: "পেমেন্ট সফলভাবে সংরক্ষিত হয়েছে",
    },
    cashBook: {
      title: "ক্যাশ বুক",
      subtitle: "তারিখভিত্তিক নগদ জমার খতিয়ান ও মোট স্থিতির হিসাব",
      dateRangeFilter: "তারিখ ফিল্টার",
      fromDate: "শুরুর তারিখ",
      toDate: "শেষ তারিখ",
      totalCashCollected: "মোট নগদ আদায়",
      receiptsCount: "মোট রসিদ",
      perDaySummary: "দৈনিক নগদ সারাংশ",
      runningTotal: "চলতি মোট জমা",
      collectedBy: "সংগ্রাহক",
      todayOnlyNotice: "ক্লার্ক মোড: শুধুমাত্র আজকের নগদ লেনদেন প্রদর্শিত হচ্ছে।",
    },
    dues: {
      title: "বকেয়া ও জরিমানা",
      subtitle: "বকেয়া কিস্তি ট্র্যাকিং, জরিমানা হিসাব এবং রিমাইন্ডার লগ",
      totalOverdueAmount: "মোট মেয়াদোত্তীর্ণ বকেয়া",
      lateFinesComputed: "মোট বিলম্ব জরিমানা",
      totalDuesListed: "মোট বকেয়ার সংখ্যা",
      daysLate: "দিন বিলম্ব",
      upcoming: "আসন্ন",
      lastReminded: "সর্বশেষ স্মরণ করানো",
      notReminded: "স্মরণ করানো হয়নি",
      sendReminder: "রিমাইন্ডার পাঠান",
      sendReminderAll: "সকল বকেয়াকে রিমাইন্ডার পাঠান",
      sendAndLog: "পাঠান ও লগ করুন",
      previewTitle: "ফি রিমাইন্ডার প্রিভিউ",
      bulkConfirmTitle: "সকলকে রিমাইন্ডার পাঠাবেন?",
      bulkConfirmDesc: "এটি সকল মেয়াদোত্তীর্ণ শিক্ষার্থীর অভিভাবকদের বাংলায় বার্তা পাঠাবে ও লগ তৈরি করবে।",
    },
    reminders: {
      template: "শ্রদ্ধেয় {guardian}, {student}-এর ফি বাবদ {amount} টাকা {date} তারিখের মধ্যে প্রদেয় ছিল। অনুগ্রহ করে দ্রুত পরিশোধ করুন।",
    },
    parent: {
      welcome: "অভিভাবক পোর্টালে স্বাগতম",
      childrenOverview: "সন্তানদের ফি বিবরণী",
      payOnline: "অনলাইনে ফি দিন",
      nextDue: "পরবর্তী প্রদেয়",
      noDues: "সব পরিশোধিত",
      selectChild: "সন্তান নির্বাচন করুন",
      selectInstallmentsToPay: "পরিশোধের কিস্তি নির্বাচন করুন",
      payableTotal: "মোট প্রদেয়",
      payNow: "পেমেন্ট করতে এগিয়ে যান",
      allInstallmentsPaid: "এই শিক্ষার্থীর কোনো বকেয়া নেই।",
      paymentHistoryTitle: "অনলাইন পেমেন্ট রসিদ",
      installmentsCovered: "পরিশোধিত কিস্তি",
      method: "পদ্ধতি",
      paymentSuccessTitle: "পেমেন্ট সফল হয়েছে!",
      paymentSuccessDesc: "আপনার ফি পরিশোধ সফলভাবে রেকর্ড হয়েছে এবং অফিশিয়াল রসিদ প্রদান করা হয়েছে।",
      paymentFailedTitle: "পেমেন্ট ব্যর্থ হয়েছে",
      paymentFailedDesc: "পেমেন্ট সম্পন্ন করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      tryAgain: "পুনরায় চেষ্টা করুন",
    },
    razorpay: {
      modalTitle: "ডেমো রেজোরপে – টেস্ট মোড",
      schoolName: "আরোহণ বিদ্যা মন্দির",
      demoNotice: "ডেমো মোড – কোনো আসল টাকা কাটা হবে না",
      selectPaymentMethod: "পেমেন্ট পদ্ধতি বেছে নিন",
      tabUpi: "UPI",
      tabNetbanking: "নেট ব্যাংকিং",
      tabCard: "ডেবিট / ক্রেডিট কার্ড",
      tabBankTransfer: "ব্যাংক ট্রান্সফার",
      enterUpiId: "UPI আইডি লিখুন (যেমন parent@upi)",
      popularApps: "অথবা UPI অ্যাপ বাছুন",
      selectBank: "আপনার ব্যাংক বেছে নিন",
      popularBanks: "জনপ্রিয় ব্যাংকসমূহ",
      cardNumber: "কার্ড নম্বর",
      expiry: "মেয়াদ (MM/YY)",
      cvv: "CVV",
      cardTestHint: "টেস্টিংয়ের জন্য 4111 2222 3333 4444 ব্যবহার করুন",
      schoolBankDetails: "স্কুল ব্যাংক অ্যাকাউন্ট বিবরণ",
      accountNumber: "অ্যাকাউন্ট নং: 50200012345678",
      ifscCode: "IFSC: HDFC0001234",
      bankName: "HDFC Bank, Salt Lake Branch",
      enterUtr: "UTR / রেফারেন্স নম্বর লিখুন",
      transferDate: "টাকা পাঠানোর তারিখ",
      bankTransferNotice: "প্রোডাকশনে ব্যাংক স্টেটমেন্টের সাথে মিলিয়ে এটি নিশ্চিত করা হয়।",
      simulateSuccess: "সফলতা সিমুলেট করুন",
      simulateFailure: "ব্যর্থতা সিমুলেট করুন",
      processing: "পেমেন্ট প্রক্রিয়াধীন...",
    },
    bill: {
      schoolName: "আরোহণ বিদ্যা মন্দির",
      headerSubtitle: "কলকাতা, পশ্চিমবঙ্গ • অফিসিয়াল ফি রসিদ",
      officialReceipt: "অফিসিয়াল ফি রসিদ",
      studentName: "শিক্ষার্থীর নাম",
      admissionNo: "ভর্তি নম্বর",
      class: "শ্রেণী",
      academicSession: "শিক্ষাবর্ষ",
      guardianName: "অভিভাবকের নাম",
      guardianPhone: "মোবাইল নম্বর",
      particulars: "বিবরণ",
      fee: "ফি (₹)",
      lateFine: "জরিমানা (₹)",
      total: "মোট (₹)",
      grandTotal: "মোট পরিশোধিত অর্থ",
      amountInWords: "কথায়",
      paymentMethod: "পেমেন্ট পদ্ধতি",
      txnId: "রেফারেন্স / UTR",
      statusPaid: "পরিশোধিত",
      authorizedSignatory: "অনুমোদিত স্বাক্ষর",
      footerNote: "* এটি একটি কম্পিউটার জেনারেটেড রসিদ। জমাকৃত ফি অফেরতযোগ্য।",
    },
    importExport: {
      importTitle: "এক্সেল ফাইলের মাধ্যমে শিক্ষার্থী ভর্তি",
      importSubtitle: "শিক্ষার্থী ভর্তির তথ্যের .xlsx ফাইল আপলোড করুন",
      downloadTemplate: "এক্সেল টেমপ্লেট ডাউনলোড",
      uploadFile: ".xlsx ফাইল নির্বাচন করুন",
      dropFileHere: "এখানে ফাইল ড্র্যাগ করুন অথবা ক্লিক করে নির্বাচন করুন",
      validRows: "সঠিক সারি",
      invalidRows: "ত্রুটিপূর্ণ সারি",
      errorSummary: "ত্রুটিসমূহ",
      importValidRows: "সঠিক শিক্ষার্থীদের ভর্তি সম্পন্ন করুন",
      importSuccess: "সফলভাবে শিক্ষার্থীদের তথ্য ডাটাবেসে যুক্ত হয়েছে",
      exportSuccess: "এক্সেল ফাইল সফলভাবে ডাউনলোড হয়েছে",
    },
  },
  hi: {
    common: {
      appName: "स्कूलपे (SchoolPay)",
      tagline: "स्कूल शुल्क एवं लेखा प्रबंधन प्रणाली",
      loading: "लोड हो रहा है...",
      save: "सुरक्षित करें",
      cancel: "रद्द करें",
      search: "खोजें",
      filter: "फ़िल्टर",
      all: "सभी",
      allClasses: "सभी कक्षाएं",
      actions: "कार्रवाई",
      status: "स्थिति",
      date: "दिनांक",
      amount: "राशि",
      rupeesSymbol: "₹",
      view: "देखें",
      edit: "संपादित करें",
      delete: "हटाएं",
      print: "प्रिंट करें",
      downloadBill: "बिल डाउनलोड करें (PDF)",
      exportExcel: "एक्सेल निर्यात",
      importExcel: "एक्सेल आयात",
      logout: "लॉग आउट",
      roleMD: "प्रबंध निदेशक",
      roleClerk: "लेखापाल / क्लर्क",
      roleParent: "अभिभावक",
      success: "सफल",
      error: "त्रुटि",
      accessDeniedTitle: "पहुंच प्रतिबंधित",
      accessDeniedDesc: "आपको इस पृष्ठ को देखने की अनुमति नहीं है।",
      backToSafety: "मुख्य पृष्ठ पर लौटें",
      demoNotice: "डेमो मोड – कोई वास्तविक शुल्क नहीं काटा जाएगा",
      themeLight: "लाइट",
      themeDark: "डार्क",
    },
    nav: {
      dashboard: "डैशबोर्ड",
      students: "विद्यार्थी",
      feeStructure: "शुल्क संरचना",
      collectFee: "शुल्क संग्रह",
      cashBook: "रोकड़ बही (Cash Book)",
      dues: "बकाया एवं जुर्माना",
      parentHome: "मेरे बच्चे",
      parentPay: "ऑनलाइन शुल्क भुगतान",
      parentPayments: "भुगतान इतिहास",
    },
    status: {
      paid: "भुगतान पूर्ण",
      partial: "आंशिक",
      pending: "लंबित",
      overdue: "अतिदेय",
      created: "निर्मित",
      failed: "विफल",
    },
    auth: {
      title: "स्कूलपे पोर्टल",
      subtitle: "शुल्क संग्रह एवं छात्र रिकॉर्ड प्रबंधन हेतु साइन इन करें",
      staffTab: "कर्मचारी लॉगिन",
      parentTab: "अभिभावक पोर्टल",
      email: "ईमेल पता",
      password: "पासवर्ड",
      signIn: "साइन इन करें",
      quickDemoLogin: "डेमो लॉगिन बटन",
      orSignInWithEmail: "या क्रेडेंशियल दर्ज करें",
      invalidCredentials: "अमान्य ईमेल या पासवर्ड",
    },
    dashboard: {
      title: "एमडी कार्यकारी डैशबोर्ड",
      subtitle: "वास्तविक समय में शुल्क संग्रह, बकाया मांग एवं डिफ़ॉल्टर विश्लेषण",
      kpiCollectedThisMonth: "इस माह का कुल संग्रह",
      kpiTotalOutstanding: "कुल बकाया राशि",
      kpiOverdueAmount: "अतिदेय बकाया",
      kpiFinesCollected: "संग्रहित विलंब शुल्क",
      kpiStudentsWithDues: "बकाया वाले छात्र",
      chartTitle: "मासिक संग्रह बनाम लक्ष्य",
      chartCollected: "संग्रहित (₹)",
      chartExpected: "लक्ष्य (₹)",
      recentPayments: "हाल ही के भुगतान प्रविष्टियां",
      topDefaulters: "शीर्ष 5 बकाया छात्र",
      receiptNo: "रसीद सं.",
      student: "विद्यार्थी",
      mode: "माध्यम",
      daysOverdue: "अतिदेय दिन",
    },
    students: {
      title: "विद्यार्थी निर्देशिका",
      subtitle: "छात्र नामांकन, प्रोफ़ाइल एवं किस्त बहीखाता प्रबंधित करें",
      addStudent: "नया प्रवेश",
      admissionNo: "प्रवेश संख्या",
      name: "विद्यार्थी का नाम",
      class: "कक्षा",
      guardian: "अभिभावक का नाम",
      guardianPhone: "अभिभावक का फोन",
      address: "पता",
      admissionDate: "प्रवेश तिथि",
      admissionFee: "प्रवेश शुल्क (₹)",
      totalRemainingFee: "शेष वार्षिक शुल्क (₹)",
      installmentsCount: "किस्त संख्या",
      searchPlaceholder: "नाम, प्रवेश संख्या या फोन से खोजें...",
      noStudents: "कोई विद्यार्थी नहीं मिला।",
      studentProfile: "विद्यार्थी प्रोफ़ाइल",
      feePlan: "वार्षिक शुल्क योजना",
      installmentSchedule: "किस्त अनुसूची",
      paymentHistory: "भुगतान इतिहास",
      fines: "विलंब शुल्क एवं जुर्माना",
      totalFee: "कुल वार्षिक शुल्क",
      totalPaid: "कुल भुगतान",
      totalDue: "कुल बकाया",
      month: "माह",
      dueDate: "नियत तिथि",
      paidAmount: "भुगतान राशि (₹)",
      fineAmount: "जुर्माना (₹)",
    },
    feeStructure: {
      title: "कक्षा शुल्क संरचना",
      subtitle: "प्रत्येक कक्षा के लिए डिफ़ॉल्ट वार्षिक शुल्क एवं नियत दिन निर्धारित करें",
      classCol: "कक्षा",
      admissionFeeCol: "डिफ़ॉल्ट प्रवेश शुल्क",
      remainingFeeCol: "शेष वार्षिक शुल्क",
      installmentsCol: "किस्तें",
      dueDayCol: "माह का नियत दिन",
      editStructure: "शुल्क नियम बदलें",
      updateSuccess: "शुल्क संरचना सफलतापूर्वक अपडेट हुई",
    },
    collectFee: {
      title: "शुल्क संग्रह काउंटर",
      subtitle: "त्वरित काउंटर भुगतान प्रविष्टि (नकद एवं ऑनलाइन) व तत्काल रसीद",
      searchStudent: "छात्र खोजें",
      searchHint: "विद्यार्थी का नाम, प्रवेश संख्या या मोबाइल दर्ज करें",
      selectInstallments: "बकाया किस्तें चुनें",
      selectAllDue: "सभी बकाया चुनें",
      amountToCollect: "संग्रह राशि (₹)",
      paymentMode: "भुगतान माध्यम",
      modeCash: "नकद (Cash)",
      modeOnline: "ऑनलाइन (UPI / बैंक)",
      txnRefRequired: "लेनदेन संदर्भ संख्या (UTR) आवश्यक है",
      cashNoteOptional: "रसीद टिप्पणी (वैकल्पिक)",
      remarks: "टिप्पणी",
      collectAndPrint: "शुल्क संग्रह एवं रसीद प्रिंट",
      successToast: "भुगतान सफलतापूर्वक दर्ज किया गया",
    },
    cashBook: {
      title: "रोकड़ बही (Cash Book)",
      subtitle: "दैनिक नकद प्राप्तियों का दिनांकवार रिकॉर्ड एवं संचयी शेष",
      dateRangeFilter: "दिनांक सीमा फ़िल्टर",
      fromDate: "प्रारंभिक तिथि",
      toDate: "अंतिम तिथि",
      totalCashCollected: "कुल नकद संग्रह",
      receiptsCount: "कुल रसीदें",
      perDaySummary: "दैनिक नकद सारांश",
      runningTotal: "संचयी कुल",
      collectedBy: "संग्रहकर्ता",
      todayOnlyNotice: "क्लर्क मोड: केवल आज की नकद प्रविष्टियाँ प्रदर्शित हो रही हैं।",
    },
    dues: {
      title: "बकाया एवं विलंब शुल्क",
      subtitle: "अतिदेय किस्तों की ट्रैकिंग, जुर्माना गणना एवं अनुस्मारक संदेश",
      totalOverdueAmount: "कुल अतिदेय राशि",
      lateFinesComputed: "गणना किया गया जुर्माना",
      totalDuesListed: "कुल बकाया सूची",
      daysLate: "विलंब दिन",
      upcoming: "आगामी",
      lastReminded: "अंतिम अनुस्मारक",
      notReminded: "अनुस्मारक नहीं भेजा",
      sendReminder: "अनुस्मारक भेजें",
      sendReminderAll: "सभी अतिदेय छात्रों को अनुस्मारक भेजें",
      sendAndLog: "भेजें व सहेजें",
      previewTitle: "अनुस्मारक संदेश पूर्वावलोकन",
      bulkConfirmTitle: "क्या सभी को अनुस्मारक भेजना चाहते हैं?",
      bulkConfirmDesc: "यह सभी अतिदेय अभिभावकों को हिंदी में अनुस्मारक संदेश भेजेगा एवं रिकॉर्ड सहेजेगा।",
    },
    reminders: {
      template: "प्रिय {guardian}, {student} के शुल्क का ₹{amount} भुगतान {date} तक देय था। कृपया यथाशीघ्र भुगतान करें।",
    },
    parent: {
      welcome: "अभिभावक पोर्टल में आपका स्वागत है",
      childrenOverview: "बच्चों का शुल्क सारांश",
      payOnline: "ऑनलाइन शुल्क भुगतान",
      nextDue: "अगली देय तिथि",
      noDues: "सभी शुल्क चुकता",
      selectChild: "बच्चा चुनें",
      selectInstallmentsToPay: "भुगतान हेतु किस्तें चुनें",
      payableTotal: "कुल देय राशि",
      payNow: "भुगतान के लिए आगे बढ़ें",
      allInstallmentsPaid: "इस छात्र के लिए कोई लंबित किस्त नहीं है।",
      paymentHistoryTitle: "ऑनलाइन भुगतान रसीदें",
      installmentsCovered: "किस्त विवरण",
      method: "माध्यम",
      paymentSuccessTitle: "भुगतान सफल रहा!",
      paymentSuccessDesc: "आपका शुल्क भुगतान सफलतापूर्वक दर्ज कर लिया गया है तथा आधिकारिक रसीद जारी कर दी गई है।",
      paymentFailedTitle: "भुगतान विफल रहा",
      paymentFailedDesc: "लेनदेन पूरा नहीं हो सका। कृपया पुनः प्रयास करें।",
      tryAgain: "पुनः प्रयास करें",
    },
    razorpay: {
      modalTitle: "डेमो रेज़रपे – टेस्ट मोड",
      schoolName: "आरोहण विद्या मंदिर",
      demoNotice: "डेमो मोड – कोई वास्तविक शुल्क नहीं काटा जाएगा",
      selectPaymentMethod: "भुगतान माध्यम चुनें",
      tabUpi: "UPI",
      tabNetbanking: "नेट बैंकिंग",
      tabCard: "डेबिट / क्रेडिट कार्ड",
      tabBankTransfer: "बैंक ट्रांसफर",
      enterUpiId: "UPI आईडी दर्ज करें (जैसे parent@upi)",
      popularApps: "या UPI ऐप चुनें",
      selectBank: "अपना बैंक चुनें",
      popularBanks: "प्रमुख बैंक",
      cardNumber: "कार्ड नंबर",
      expiry: "समाप्ति (MM/YY)",
      cvv: "CVV",
      cardTestHint: "परीक्षण हेतु 4111 2222 3333 4444 दर्ज करें",
      schoolBankDetails: "विद्यालय का लाभार्थी बैंक खाता",
      accountNumber: "खाता सं.: 50200012345678",
      ifscCode: "IFSC: HDFC0001234",
      bankName: "HDFC Bank, Salt Lake Branch",
      enterUtr: "UTR / लेनदेन संदर्भ संख्या दर्ज करें",
      transferDate: "स्थानांतरण तिथि",
      bankTransferNotice: "वास्तविक प्रणाली में बैंक विवरण से मिलान कर इसकी पुष्टि की जाती है।",
      simulateSuccess: "सफलता का अनुकरण करें",
      simulateFailure: "विफलता का अनुकरण करें",
      processing: "भुगतान प्रक्रियाधीन है...",
    },
    bill: {
      schoolName: "आरोहण विद्या मंदिर",
      headerSubtitle: "कोलकाता, पश्चिम बंगाल • आधिकारिक शुल्क रसीद",
      officialReceipt: "आधिकारिक शुल्क रसीद",
      studentName: "विद्यार्थी का नाम",
      admissionNo: "प्रवेश संख्या",
      class: "कक्षा",
      academicSession: "शैक्षणिक सत्र",
      guardianName: "अभिभावक का नाम",
      guardianPhone: "मोबाइल नंबर",
      particulars: "विवरण",
      fee: "शुल्क (₹)",
      lateFine: "विलंब शुल्क (₹)",
      total: "कुल (₹)",
      grandTotal: "कुल भुगतान राशि",
      amountInWords: "शब्दों में",
      paymentMethod: "भुगतान माध्यम",
      txnId: "लेनदेन संदर्भ सं. / UTR",
      statusPaid: "भुगतान पूर्ण",
      authorizedSignatory: "अधिकृत हस्ताक्षरकर्ता",
      footerNote: "* यह कंप्यूटर जनित रसीद है। जमा किया गया शुल्क अहस्तांतरणीय व अप्रतिदेय है।",
    },
    importExport: {
      importTitle: "एक्सेल से थोक छात्र नामांकन",
      importSubtitle: "छात्र प्रवेश रिकॉर्ड की .xlsx फ़ाइल अपलोड करें",
      downloadTemplate: "एक्सेल टेम्पलेट डाउनलोड",
      uploadFile: ".xlsx फ़ाइल चुनें",
      dropFileHere: "यहाँ फ़ाइल खींचें या ब्राउज़ करने के लिए क्लिक करें",
      validRows: "मान्य पंक्तियाँ",
      invalidRows: "अमान्य पंक्तियाँ",
      errorSummary: "त्रुटि विवरण",
      importValidRows: "मान्य छात्रों का प्रवेश पूरा करें",
      importSuccess: "सफलतापूर्वक छात्रों का रिकॉर्ड डेटाबेस में दर्ज किया गया",
      exportSuccess: "एक्सेल स्प्रेडशीट सफलतापूर्वक निर्यात की गई",
    },
  },
};
