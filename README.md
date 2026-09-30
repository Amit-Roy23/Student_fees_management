# 🏫 SchoolPay – School Fee & Accounts Management System

A lean, high-performance School Fee & Accounts Management platform for Indian schools featuring an MD Executive Suite, Accountant/Clerk operational counter, and a dedicated Parent Portal with Demo Razorpay Online Fee Payments and PDF Bills.

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Install dependencies
pnpm install

# 2. Reset database & seed demo data (MD, Clerk, 4 Parents, 40 Students)
pnpm db:reset

# 3. Start local development server
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Login Personas (1-Click Quick Fill on Login Page)

### Staff Portal
| Role | Email | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Managing Director (MD)** | `md@schoolpay.demo` | `md123` | **Full Access**: Financial KPIs, Chart, Defaulters, Student Edit/Delete, Fee Structure, Cash Book (all dates), Excel Import/Export |
| **Accountant / Clerk** | `clerk@schoolpay.demo` | `clerk123` | **Restricted Operations**: Collect Fee, View & Admit Students, Dues & Reminders, Cash Book (Today only). Lands directly on Collect Fee. |

### Parent Portal
| Persona | Email | Password | Linked Children |
| :--- | :--- | :--- | :--- |
| **Parent 1 (Suresh Sharma)** | `parent1@schoolpay.demo` | `parent123` | **2 Siblings**: Rohan Sharma (Class 8) & Priya Sharma (Class 5) |
| **Parent 2 (Rajesh Roy)** | `parent2@schoolpay.demo` | `parent123` | Aarav Roy (Class 1) |
| **Parent 3 (Amit Das)** | `parent3@schoolpay.demo` | `parent123` | Ananya Das (Class 2) |
| **Parent 4 (Bikram Banerjee)** | `parent4@schoolpay.demo` | `parent123` | Sourav Banerjee (Class 9) *(Includes 1 seeded failed order)* |

---

## 🛡️ Role Permission Matrix (`src/lib/permissions.ts`)

| Capability | MD | Clerk | Parent |
| :--- | :---: | :---: | :---: |
| **Dashboard** (KPIs, revenue chart, defaulters) | ✅ Yes | ❌ No *(Lands on Collect Fee)* | ❌ No |
| **View students list & profile** | ✅ Yes | ✅ Yes | 🔒 Own children only |
| **Add / admit student** | ✅ Yes | ✅ Yes | ❌ No |
| **Edit student, edit fee plan, delete student** | ✅ Yes | ❌ No | ❌ No |
| **Fee Structure page** (view & edit) | ✅ Yes | ❌ No *(Hidden)* | ❌ No |
| **Collect Fee** (counter cash / online entry) | ✅ Yes | ✅ Yes | ❌ No |
| **Dues & fines view, send reminders** | ✅ Yes | ✅ Yes | ❌ No |
| **Cash Book** | ✅ Any date range | 🔒 Today only (no date filter) | ❌ No |
| **Excel Import** (`/students/import`) | ✅ Yes | ❌ No | ❌ No |
| **Excel Export** (Students, Dues, Cash Book, Ledger) | ✅ Yes | ❌ No | ❌ No |
| **Parent portal & online payment** | ❌ No | ❌ No | ✅ Yes |
| **Download bill (PDF)** | ✅ Any | ✅ Any | 🔒 Own children only |

---

## 🎬 3-Minute Sales Demo Script: Parent Flow & Real-Time Reflection

### Step 1: Parent Login & Sibling Switcher
1. Go to `/login` and click the **"Parent Portal"** tab.
2. Click **"Parent 1: Suresh Sharma (2 Siblings)"** for instant login.
3. Land on `/parent` home. Notice both children (**Rohan Sharma** & **Priya Sharma**) displayed side-by-side with individual class details, paid amounts, outstanding dues, and overdue badges with fine calculations.

### Step 2: Online Fee Payment via Demo Razorpay
1. Click **"Pay Fees Online"** or navigate to `/parent/pay`.
2. Select child **Rohan Sharma**.
3. Check **May 2026** installment (or multiple installments). Notice the real-time calculated total on the screen.
4. Click **"Proceed to Pay"** to launch the Razorpay Checkout Modal (`Demo Razorpay – Test Mode`).
5. Choose **UPI** (enter UPI ID) or pick **Card / Net Banking / Bank Transfer**.
6. Click **"Simulate Success"** to execute mock payment with server-side HMAC signature verification.
7. Land on the Success Screen with instant bill breakdown and click **"Download Bill (PDF)"** to download the `@react-pdf/renderer` generated receipt (`/api/receipts/[paymentId]/pdf`).

### Step 3: Multi-Installment Net Banking Payment
1. Switch to child **Priya Sharma** on `/parent/pay`.
2. Select **2 installments** (e.g. May and June 2026).
3. Click **"Proceed to Pay"**, choose **Net Banking (HDFC Bank)**, and simulate success.
4. Go to `/parent/payments` to review the complete payment history with receipt numbers and "Download Bill" on every row.

### Step 4: Real-Time Staff Reflection (MD Dashboard)
1. Logout and sign in as **MD** (`md@schoolpay.demo`).
2. Land on MD Dashboard (`/`). Notice:
   - **Total Collected This Month** increased by the exact online amounts.
   - **Total Outstanding Dues** decreased.
   - The payments appear instantly in the **Recent Payments** table with method tags (`UPI`, `NETBANKING`).
3. Check `/cash-book`: Notice parent online payments do **NOT** appear in the Cash Book (preserving counter cash fidelity).
4. Check `/dues`: Dues for Rohan and Priya have cleared.

---

## 🌟 Highlights of the 5 Changes

1. **Change 1 — Parent Portal & Online Payments**:
   - 3 dedicated mobile-first parent pages: `/parent`, `/parent/pay`, `/parent/payments`.
   - Pluggable payment gateway architecture (`src/lib/payment-gateway`) with `MockRazorpayGateway`.
   - Server-side amount computation (never trusts client amount), HMAC-SHA256 signature verification, and idempotent allocation.
   - Authorized PDF bill generation at `/api/receipts/[paymentId]/pdf` with `@react-pdf/renderer`.
   - Stub webhook at `/api/webhooks/razorpay` for `payment.captured`.
2. **Change 2 — Dark and Light Theme**:
   - `next-themes` integration with clean theme switcher in top bars and login page.
   - Full dark mode support across tables, modals, cards, and Recharts without hardcoded color breaks.
   - PDF bill remains white and print-friendly.
3. **Change 3 — Multi-Lingual (English, Bengali বাংলা, Hindi हिन्दी)**:
   - Typed dictionary with 100% key coverage across navigation, forms, toasts, modals, and reminder templates.
   - Unit test (`src/lib/i18n/i18n.test.ts`) guarantees zero missing translation keys.
   - Reminder messages render in the currently active language.
4. **Change 4 — Excel Import & Export**:
   - SheetJS (`xlsx`) bulk import at `/students/import` with downloadable template, per-row validation, and automatic installment schedule generation.
   - "Export to Excel" on Students, Dues, Cash Book, and Student Ledger.
5. **Change 5 — Roles & Permissions**:
   - Centralized permission matrix (`src/lib/permissions.ts`) with unit tests.
   - MD has full operational and analytical access.
   - Clerk has streamlined counter access (Collect Fee, Students view+add, Dues, Today's Cash Book).

---

## 🧪 Verification & Tests

```bash
# Run unit tests (Permissions, i18n Dictionary Coverage, Fees & Fines)
pnpm test

# Run TypeScript check
npx tsc --noEmit

# Run ESLint
pnpm lint

# Build production bundle
pnpm build
```
