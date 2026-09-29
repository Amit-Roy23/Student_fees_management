# 🏫 SchoolPay – School Fee & Accounts Management System

> **A modern, end-to-end fee collection, installment tracking, automated late fine engine, multi-lingual reminder, and double-entry books of accounts system tailored for Indian Schools (CBSE / ICSE / State Boards).**

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
pnpm install

# 2. Reset database & seed realistic demo data (300 students, 15 classes, 6 months history)
pnpm db:reset

# 3. Start local development server
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Login Credentials (Quick-Fill on Login Page)

The login page features **one-click demo persona quick-fill buttons**:

| Persona | Email | Password | Access Level & Capabilities |
| :--- | :--- | :--- | :--- |
| **1. Admin / MD** | `admin@schoolpay.demo` | `admin123` | Full Access: MD Dashboard, Class Recovery Reports, Audit Logs, Settings, Payment Reversals, Fine Waivers |
| **2. Accountant** | `accountant@schoolpay.demo` | `account123` | Daily Operations: Fast Collect Fee, Cash Book, Bank Book, Day Book, WhatsApp Reminders, Expenses |
| **3. Viewer / Auditor** | `viewer@schoolpay.demo` | `viewer123` | Read-Only: Ledgers, Audit trails, and Financial summaries |

*Public Parent Payment Portal (No Login Required):* **[http://localhost:3000/pay](http://localhost:3000/pay)**

---

## 🎯 5-Minute Client Demo Script (Sales Walkthrough)

Follow this step-by-step guide to deliver a presentation to school management:

### 1. The Opening Pitch (Login Screen)
* **Action:** Open `http://localhost:3000/login`.
* **Talking Point:** *"Most schools struggle with Excel registers, missed phone calls, and manual receipt writing. SchoolPay unifies your entire academic session accounting into one seamless platform."*
* **Action:** Click the green **Accountant (Subhashis Roy)** quick-fill button to sign in.

### 2. Fast Fee Collection & Instant Receipt (The Core Flow)
* **Action:** Click **"Collect Fee"** in the sidebar or top bar (or press `Ctrl+K` and choose *Collect Fee*).
* **Action:** Search for student `AVM-2026-0004` (or click the quick-test chip).
* **Talking Point:** *"Notice how instantly the student ledger loads with their class, section, and pending monthly installments. The system automatically calculates late fines after grace days."*
* **Action:** Select the payment mode (**Cash** or **UPI**), enter the transaction ref/UTR, and click **"Collect & Issue Receipt"**.
* **Talking Point:** *"Instantly, an official, numbered receipt with school header, watermark, breakdown, and words is generated. Staff can print it with one click or click 'Send on WhatsApp' to notify parents immediately."*

### 3. Dues & Automated Multi-Lingual Reminders
* **Action:** Click **"Dues & Defaulters"** in the sidebar.
* **Talking Point:** *"Staff no longer need to spend hours checking Excel sheets to see who has unpaid dues. We have instant filters for Chronic Overdue, Due This Week, and Class breakdowns."*
* **Action:** Select 2-3 students using the checkboxes, click **"Send Reminders"**, switch between **English**, **বাংলা (Bengali)**, and **हिंदी (Hindi)** templates, and click **"Send via WhatsApp"**.
* **Talking Point:** *"Messages are dispatched with personalized student names, due dates, amounts, and online payment links. Every message is permanently recorded in the Reminder Log."*

### 4. Books of Accounts (Cash Book & Bank Book)
* **Action:** Click **"Cash Book"** under Books of Accounts.
* **Talking Point:** *"Every cash payment collected at the counter automatically updates today's Cash Book opening and closing balance in real-time. Cash expense vouchers balance the register automatically."*
* **Action:** Show the **"Close Day"** lock mechanism to secure day-end accounts against tampering.
* **Action:** Click **"Bank Book"** to show real-time tracking of UPI, NEFT, and Gateway settlements.

### 5. Managing Director (MD) Executive Dashboard
* **Action:** Click the user profile in the top-right and switch persona to **Admin / MD (Dr. Anirban Mukherjee)**.
* **Talking Point:** *"The MD gets high-level clarity: Total collections this session, monthly collections vs expected demand targets, class recovery percentages, payment mode distribution, and top defaulters."*
* **Action:** Navigate to **"Reports"** to demonstrate one-click Excel and PDF exports.

### 6. Public Parent Payment Portal (Online Checkout)
* **Action:** Open `http://localhost:3000/pay` in a new tab.
* **Action:** Enter Admission No: `AVM-2026-0004` and Mobile: `9830100004`.
* **Action:** Click **"Pay Now"** to open the **Razorpay-style modal simulator**. Show UPI QR scanning, Card, and NetBanking tabs.
* **Action:** Click **"Simulate Success"** and demonstrate the instant digital receipt issuance.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 15 (App Router, React 19, TypeScript strict mode)
- **Styling & UI:** Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Sonner toasts
- **Database & ORM:** Prisma ORM with SQLite file database (`file:./dev.db` – zero external service setup, 100% Postgres-compatible schema)
- **Authentication:** NextAuth.js v5 (Auth.js) credentials with role-based authorization
- **Charts & Visualization:** Recharts
- **Excel Processing:** SheetJS (xlsx) for bulk student import and report exports
- **Testing:** Vitest for pure fee, installment, and fine calculation engine tests

---

## 🧪 Running Unit Tests

```bash
pnpm test
```

All 10 pure fee calculation unit tests (installment distribution, odd paise remainder handling, grace period, flat and percentage fine computation, oldest-first payment allocation, and receipt numbering) run and pass in `< 25ms`.

---

## 📂 Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Demo login with role quick-fills
│   ├── (dashboard)/           # Protected dashboard layout & shell
│   │   ├── page.tsx           # MD Executive Dashboard
│   │   ├── collect-fee/       # Fast fee collection counter
│   │   ├── students/          # Student directory & profiles ([id]) & Excel import
│   │   ├── fee-structures/    # Class fee structures & master heads
│   │   ├── dues/              # Dues, defaulters & bulk reminder dispatch
│   │   ├── reminders/         # Notification logs & multi-lingual templates
│   │   ├── accounts/          # Cash Book, Bank Book, Day Book, Expenses
│   │   ├── reports/           # Financial audit reports & class recovery summaries
│   │   ├── settings/          # School profile, fine rules, and user management
│   │   └── audit-logs/        # Immutable system audit trail
│   ├── pay/                   # Public parent payment portal
│   ├── api/                   # Auth routes & payment webhook stubs
│   └── globals.css            # Tailwind v4 theme tokens & print styles
├── components/
│   ├── ui/                    # Reusable UI primitives (Button, Card, Dialog, Table, etc.)
│   ├── layout/                # Sidebar, Topbar, SessionSwitcher, CommandPalette (Ctrl+K), Theme & Lang toggles
│   ├── receipt/               # Printable/PDF school fee receipt modal with WhatsApp share
│   └── payment/               # Razorpay mock checkout modal simulator
├── features/                  # Domain-driven server actions & client components
├── lib/
│   ├── fees/                  # Pure fee, fine, allocation & receipt calculation engine
│   ├── notifications/         # NotificationProvider interface & WhatsApp mock
│   ├── payment-gateway/       # PaymentGateway interface & Razorpay mock
│   ├── i18n/                  # English & Bengali localization dictionary
│   ├── formatters.ts          # INR Currency (₹), Indian words, and date formatters
│   └── db.ts                  # Prisma database singleton
└── prisma/
    ├── schema.prisma          # PostgreSQL-ready Prisma schema
    └── seed.ts                # Realistic seed script (300 students, 15 classes, 6 mo history)
```

---

## 📜 License
Private demo software developed for sales demonstration.
