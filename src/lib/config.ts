export const AVAILABLE_ACADEMIC_SESSIONS = [
  { code: "2026-27", label: "2026-27 (Current)", status: "Active", startYear: 2026 },
  { code: "2025-26", label: "2025-26 (Past Year)", status: "Past", startYear: 2025 },
  { code: "2024-25", label: "2024-25 (Archive)", status: "Archive", startYear: 2024 },
  { code: "2027-28", label: "2027-28 (Upcoming)", status: "Upcoming", startYear: 2027 },
];

export const SCHOOL_CONFIG = {
  schoolName: "Arohon Vidya Mandir",
  tagline: "School Fee & Accounts Management",
  address: "Plot 14, Sector V, Salt Lake City, Kolkata - 700091",
  phone: "+91 33 2357 8900",
  affiliation: "Affiliated to CISCE / State Board • Code: WB-1994",
  academicSession: "2026-27",
  sessionStartYear: 2026,
  finePerDayPaise: 1000, // ₹10 per day
  fineCapPaise: 50000,   // ₹500 maximum cap
  defaultInstallmentsCount: 10,
  defaultDueDayOfMonth: 10,
  availableSessions: AVAILABLE_ACADEMIC_SESSIONS,
};

export const SCHOOL_NAME = SCHOOL_CONFIG.schoolName;
export const SESSION_CODE = SCHOOL_CONFIG.academicSession;
