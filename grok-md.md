# Shahin Motors BMS — Full Website Review & Punchless Dashboard Gap Analysis

> **Review date:** 2026-06-22  
> **Reference site:** [https://maturecommerceclasses.com/shahin](https://maturecommerceclasses.com/shahin)  
> **Review method:** Read-only browser audit (logged in, no data added/deleted)  
> **Pages audited:** 30 main modules + dashboard home  
> **Implementation plan:** See [`SHAHIN_IMPLEMENTATION_PLAN.md`](./SHAHIN_IMPLEMENTATION_PLAN.md) for phased build plan with ✅/☐ status

---

## 1. Executive Summary

**Shahin Motors Business Management System** is a PHP-based, all-in-one ERP for a motors/workshop business. It combines:

- **CRM** — clients & suppliers with ledgers
- **Billing** — GST tax invoices, purchase invoices
- **HR** — staff, posts, attendance, salary payments & deposits
- **Accounting** — banks, cash/bank/credit tracking, income/expense ledger (Rojmel)
- **Reporting** — daily/monthly/yearly financial reports, GST, invoices, expenses

**Punchless** is a **workshop attendance SaaS** with GPS tracking, job/travel states, hourly salary from attendance, and a modern Next.js dashboard. It overlaps with Shahin on **staff, attendance, and salary/advances**, but Shahin is far broader on **finance, invoicing, and accounting**.

| Dimension | Shahin Motors | Punchless (current) |
|-----------|---------------|---------------------|
| Core focus | Full business ERP | Workshop attendance + payroll |
| Auth | Contact number + password | Email + password (Supabase) |
| Attendance | Manual check-in/out | GPS geofence + state machine + mobile |
| Salary | Monthly salary, deposits, deductions, advances | Hourly from attendance sessions |
| Finance | Full ledger, banks, invoices, GST | Not built |
| Mobile | None observed | Expo app (in progress) |
| Multi-tenant | Single business instance | SaaS multi-company |

**Bottom line:** To make Punchless dashboard "like Shahin," you need a **major Phase 11+ expansion** into accounting/CRM/invoicing — while keeping Punchless's GPS attendance advantage.

---

## 2. Site Architecture

### 2.1 Login (`/` → `home.php`)

| Field | Details |
|-------|---------|
| Brand | Shahin Motors — Business Management System |
| Auth fields | Contact Number + Password |
| Support | Phone: 99048 18508 |
| Design | Plus Jakarta Sans, blue gradient, card-based login |

### 2.2 Navigation Structure

The app uses a **persistent top/side navigation** with dropdown groupings:

```
SHAHIN MOTORS (Home)
├── Clients          → manageClient.php, clientStatement.php
├── Supplier         → manageSupplier.php
├── Purchase         → purchase.php
├── Staff
│   ├── Add Post     → managePost.php
│   ├── Add Staff    → manageStaff.php
│   ├── Manual Attendance → staffAttendance.php
│   ├── Attendance Report → ateendanceReport.php
│   ├── Delete Attendance → deleteAttendance.php
│   ├── Staff Payments → manageStaffSalary.php
│   ├── Deposit Salary → salaryDeposit.php
│   └── Staff Statement → staffStatement.php
├── Bank
│   ├── Add Bank     → manageBank.php
│   ├── Transfer     → bankTransfer.php
│   ├── Bank Transactions → bankTransaction.php
│   └── Bank Statement → bankStatement.php
├── Reports
│   ├── GST Report   → GSTReport.php
│   ├── Invoice Report → invoiceReport.php
│   ├── Daily Report → summary.php
│   ├── Monthly Report → monthlyReport.php
│   ├── Yearly Report → yearlyReport.php
│   ├── Income/Expense Report → particulerReport.php
│   ├── Expense Report → expenseReport.php
│   └── Rojmel Report → rojmelReport.php
├── Tax Invoice      → invoice.php
├── Income / Expense → manageExpense.php
└── User Menu
    ├── Add User     → manageUser.php
    ├── User Log Report → userLogReport.php
    ├── Change Password → ChangePassword.php
    └── Logout       → logout.php
```

### 2.3 UI Patterns (repeated across pages)

- **CRUD tables** with pagination (25 / 50 / 100 / All)
- **Inline add forms** at top of list pages (+ New Client, + New Staff, etc.)
- **Print** button on most list/report pages
- **Modal dialogs** for payments (Receive Payment, Pay Now)
- **Date/month filters** on reports
- **Excel export** on attendance report (Old Excel / New Excel)
- **Period presets** on reports: Today, Yesterday, This Week, Last Week, This Month, etc.
- **Cash / Bank / Credit** payment mode everywhere

---

## 3. Module-by-Module Review

### 3.1 Dashboard Home (`home.php`)

**Purpose:** Financial command center for the business owner.

**Key sections observed:**

| Section | Features |
|---------|----------|
| Header | Company name, address, FY 2026–27, live clock |
| Data Lock | Financial stats hidden until password unlock (default pass: `1234` in JS) |
| Financial Overview | Income, Expense, Cash, Bank, Credit, Purchase totals |
| Client/Supplier Summary | Client count + total due; Supplier count + total payable |
| Revenue Chart | Bar chart — Sales vs Collection (7 Days / 6 Months toggle) |
| Quick Access Grid | Shortcuts to Invoice, Clients, Client Stmt, Supplier, Purchase, Staff, Attendance Rpt, Staff Pymt, Deposit Slry, Staff Stmt, Exp/Incm, GST Rpt, Invoice Rpt, Daily Rpt, Exp/Incm Rpt, Rojmel Rpt |
| Today's Payments | Table: Client, Mode (Cash/Bank/Credit), Amount — daily total |
| Top Pending Dues | Ranked list of clients with outstanding balances |
| Sticky Notes | Add/edit/delete notes with title, description, date |

**Sample data seen (read-only):**
- Income: ₹61,800 | Expense: ₹0 | Cash: ₹5,800 | Bank: ₹50,000 | Credit: ₹6,000
- 3 Clients, ₹306,000 due | 0 Suppliers payable

**Punchless equivalent:** `/dashboard` — 4 stat cards (employees, working, jobs, advances) + placeholder sections. **Large gap.**

---

### 3.2 Clients (`manageClient.php`)

**Purpose:** Customer CRM with receivables tracking.

| Feature | Details |
|---------|---------|
| Summary cards | Total clients count, total due amount |
| Add form | Client Name, Alias, Contact, Address, GST, Opening Balance |
| Table columns | #, Client Name, Alias, Contact, Address, GST, Opening Bal., Actions |
| Actions | Edit, Receive Payment (modal), Client Statement link |
| Receive Payment modal | Amount, Payment Mode (Cash/Bank), Bank selector, Date, Remark |
| Recover | Soft-delete recovery for deleted clients |

**Punchless equivalent:** **None.** Jobs have customer info but no dedicated client ledger.

---

### 3.3 Client Statement (`clientStatement.php`)

**Purpose:** Date-range ledger for a single client.

| Filter | Client Name, Start Date, End Date |
| Output | Transaction history with running balance |

**Punchless equivalent:** **None.**

---

### 3.4 Suppliers (`manageSupplier.php`)

**Purpose:** Vendor/supplier CRM with payables tracking.

| Feature | Details |
|---------|---------|
| Summary cards | Supplier count, total due (payable) |
| Add form | Supplier Name, Alias, Contact, Address, GST, Opening Balance |
| Table columns | #, Supplier Name, Alias, Contact, Address, GST, Opening Balance, Action |
| Actions | Edit, Pay Now (modal with Cash/Bank mode) |

**Punchless equivalent:** **None.**

---

### 3.5 Purchase / Supplier Invoices (`purchase.php`)

**Purpose:** Record purchase and sales invoices from suppliers.

| Feature | Details |
|---------|---------|
| Add form | Supplier, Invoice Type (Purchase/Sales), Invoice Number, Date, Amount, GST slabs (5%, 12%, 18%, 28%) |
| Table columns | #, Supplier Name, Invoice, Date, Purchase, Sales, User, Action |
| Actions | Print, Edit, Delete |

**Punchless equivalent:** **None.**

---

### 3.6 Posts / Job Titles (`managePost.php`)

**Purpose:** Define staff roles/positions (OWNER, MECHANIC, etc.).

| Feature | Details |
|---------|---------|
| Add form | Post Name |
| Table | #, Post Name, Action (edit/delete) |

**Punchless equivalent:** Partial — employees have `role` (owner/admin/employee) but no custom post/title system.

---

### 3.7 Staff Management (`manageStaff.php`)

**Purpose:** Employee master data with salary and bank details.

| Field | Details |
|-------|---------|
| Staff Name | Full name |
| Contact | Phone number (also used as employee app login in Shahin) |
| Address | Location |
| Post | Job title from Posts module |
| Salary | Monthly salary amount |
| Joining Date | DD-MM-YYYY |
| Total Duration | Auto-calculated (Y, M, D) |
| Account No. | Bank account for salary |
| IFSC Code | Bank IFSC |
| Actions | Edit, ₹ (quick payment link), Staff Statement link, Recover |

**Observed:** ~20 staff records in table.

**Punchless equivalent:** `/dashboard/employees` — name, phone, workshop, monthly salary, hourly rate (auto-calc), active toggle. **Partial match** — Punchless lacks post, joining date, duration, bank details.

---

### 3.8 Manual Attendance (`staffAttendance.php`)

**Purpose:** Admin marks daily attendance for all staff.

| Feature | Details |
|---------|---------|
| Staff list | #, Staff Name, Contact, Address, Salary |
| Action | "Take Attendance" — bulk check-in for selected date |
| Print | Printable attendance sheet |

**Punchless equivalent:** `/dashboard/attendance` — manual session create + live GPS sessions. **Punchless is more advanced** (states: workshop/travel/on-site/break), but lacks simple daily present/absent bulk marking.

---

### 3.9 Attendance Report (`ateendanceReport.php`)

**Purpose:** Monthly attendance report per staff.

| Filter | Staff Name, Select Month |
| Export | Old Excel, New Excel |
| Output | Monthly attendance grid/summary |

**Punchless equivalent:** `/dashboard/history` + `/dashboard/attendance` — session-based with duration by state. **Different model** (hours/states vs present/absent days).

---

### 3.10 Delete Attendance (`deleteAttendance.php`)

**Purpose:** Search and delete incorrect attendance records.

| Filter | Select Month, Search |
| Table | #, Staff Name, Date, CheckIn, CheckOut, Action (delete) |

**Punchless equivalent:** `/dashboard/attendance` — delete session action. **Exists** (close/delete sessions).

---

### 3.11 Staff Payments (`manageStaffSalary.php`)

**Purpose:** Record all staff financial transactions.

| Transaction Types | Advance, Salary Paid, Salary Deduction |
| Fields | Staff, Type, Amount, Date, Payment Mode (Cash/Bank), Bank, Remark |
| Table columns | #, Name, Reason, Deposited Amount, Paid Amount, Salary Deduction, Payment Mode, Remark, Date, User, Action |

**Punchless equivalent:**
- `/dashboard/advances` — advance approve/reject (**partial**)
- `/dashboard/salary` — calculated monthly report (**different** — auto from attendance, not manual payment entry)

---

### 3.12 Deposit Salary (`salaryDeposit.php`)

**Purpose:** Record salary amounts deposited/accrued for staff (separate from actual payment).

| Fields | Staff Name, Amount, Date, Remark |
| Table | #, Staff Name, Amount, Date, Remark, User, Action |

**Punchless equivalent:** **None** — salary is calculated, not manually deposited.

---

### 3.13 Staff Statement (`staffStatement.php`)

**Purpose:** Date-range financial ledger per staff member.

| Filter | Staff Name, Start Date, End Date |
| Output | All advances, salary paid, deductions with running balance |

**Punchless equivalent:** **None** — no per-employee financial statement page.

---

### 3.14 Bank Management (`manageBank.php`)

**Purpose:** Manage company bank accounts.

| Fields | Bank Name, A/C Name, A/C Number, IFSC, Opening Balance |
| Table | #, Bank, A/C Name, A/C Number, IFSC, Opening, Action |
| Display | Running balance per bank (e.g., KOTAK MAHINDRA ₹15,850,000) |

**Punchless equivalent:** **None.**

---

### 3.15 Bank Transfer (`bankTransfer.php`)

**Purpose:** Transfer funds between company bank accounts.

| Fields | From Bank, To Bank, Amount, Date, Remark |
| Table | #, Bank, Withdraw, Deposit, Remark, User, Action |

**Punchless equivalent:** **None.**

---

### 3.16 Bank Transactions (`bankTransaction.php`)

**Purpose:** Manual deposit/withdraw entries per bank.

| Fields | Bank, Amount, Type (Deposit/Withdraw), Date, Remark |
| Table | #, Bank Name, Amount, Transaction Type, Date, Remark, User, Action |

**Punchless equivalent:** **None.**

---

### 3.17 Bank Statement (`bankStatement.php`)

**Purpose:** Date-range statement for a bank account.

| Filter | Bank Name, Start Date, End Date |

**Punchless equivalent:** **None.**

---

### 3.18 Tax Invoice (`invoice.php`)

**Purpose:** Create GST tax invoices for clients (core revenue document).

| Fields | Client (alias lookup), Vehicle Number, GST %, Invoice Amount, GST breakdown (5/12/18/28%), Invoice Number, Date |
| Payment | Mode: Cash, Credit, Bank, CASH-BANK (split); Cash Amount, Bank Amount, Bank selector |
| Table | #, Client Name, Invoice, Date, Vehicle, Amount, Cash, Bank, Credit, Mode, User, Action |
| Sample | SHAHIN TRANSPORT, GJ08CJ7898, ₹5,800 CASH |

**Punchless equivalent:** **None.**

---

### 3.19 Income / Expense (`manageExpense.php`)

**Purpose:** Record all non-invoice cash flow entries.

| Transaction Types | Expense, Income, Transfer |
| Fields | Particular (name), Amount, Date, Type, Payment Mode (Cash/Bank), Bank, Remark |
| Table | #, Particular, Income, Expense, Transfer, Purchase, Mode, Date, Remark, User, Action |

**Punchless equivalent:** **None.**

---

### 3.20 Reports

| Report | Page | Filters | Output |
|--------|------|---------|--------|
| GST Report | `GSTReport.php` | Select Month | GST summary, Excel export |
| Invoice Report | `invoiceReport.php` | Period presets | All invoices with payment breakdown |
| Daily Report | `summary.php` | Period presets | Cash/Bank totals, income/expense summary, daily breakdown |
| Monthly Report | `monthlyReport.php` | Select Month | Monthly P&L style summary |
| Yearly Report | `yearlyReport.php` | FY Year (2023–2027) | Annual summary |
| Income/Expense Report | `particulerReport.php` | Period presets | Particular-wise income/expense |
| Expense Report | `expenseReport.php` | Period + filters | Expense-only breakdown |
| Rojmel Report | `rojmelReport.php` | Date range filter | Full ledger (Gujarati accounting style) — Income, Expense, Transfer, Purchase columns |

**Punchless equivalent:** `/dashboard/salary` (monthly salary only). **All other reports missing.**

---

### 3.21 User Management (`manageUser.php`)

**Purpose:** Dashboard admin users (separate from staff).

| Fields | User Name, Contact (login ID), Password |
| Table | #, Name, Contact, Password, Action |
| Observed | 1 user: Saad / 7984527398 |

**Punchless equivalent:** Supabase auth + roles (owner/admin/employee). **Different model** — Punchless uses email, Shahin uses phone.

---

### 3.22 User Log Report (`userLogReport.php`)

**Purpose:** Audit trail of user actions in the system.

| Filter | Period presets (Today, Yesterday, This Week, etc.) |
| Table | User activity log with timestamps |

**Punchless equivalent:** **None.**

---

### 3.23 Change Password (`ChangePassword.php`)

| Fields | Old Password, New Password, Confirm Password |

**Punchless equivalent:** **None** in dashboard (Supabase handles via auth).

---

## 4. Punchless Current Dashboard — What We Have

| Route | Module | Status | Shahin Overlap |
|-------|--------|--------|----------------|
| `/dashboard` | Home / Stats | ✅ Basic | ~10% of Shahin dashboard |
| `/dashboard/employees` | Employee CRUD | ✅ Full | ≈ `manageStaff.php` (60%) |
| `/dashboard/workshops` | Workshop CRUD + map | ✅ Full | **No Shahin equivalent** |
| `/dashboard/jobs` | Job CRUD + assignment | ✅ Full | Partial (vehicle/job tracking) |
| `/dashboard/attendance` | Live + manual sessions | ✅ Full | ≈ `staffAttendance.php` + more |
| `/dashboard/history` | Session history + summaries | ✅ Full | ≈ `ateendanceReport.php` (different model) |
| `/dashboard/requests` | Correction requests | ✅ Full | **No Shahin equivalent** |
| `/dashboard/salary` | Monthly salary report | ✅ Full | ≈ calculated version of payments |
| `/dashboard/advances` | Advance CRUD + approve | ✅ Full | ≈ Staff Payments "Advance" type |
| `/dashboard/settings` | Company work schedule | ✅ Full | Partial (no financial settings) |
| `/dashboard/billing` | Stripe billing | ⏳ Placeholder | N/A |
| Mobile app | GPS attendance | 🚧 In progress | **Shahin has no mobile app** |

---

## 5. Gap Analysis — What to Add to Match Shahin

### 5.1 Priority A — High Business Value (ERP Core)

These are the biggest gaps if the goal is a Shahin-like dashboard:

| # | Module | Shahin Page | Suggested Punchless Route | DB Tables Needed |
|---|--------|-------------|---------------------------|------------------|
| 1 | **Clients CRM** | `manageClient.php` | `/dashboard/clients` | `clients`, `client_payments` |
| 2 | **Client Statement** | `clientStatement.php` | `/dashboard/clients/[id]/statement` | ledger view on above |
| 3 | **Suppliers** | `manageSupplier.php` | `/dashboard/suppliers` | `suppliers`, `supplier_payments` |
| 4 | **Tax Invoices** | `invoice.php` | `/dashboard/invoices` | `invoices`, `invoice_items`, GST fields |
| 5 | **Income / Expense** | `manageExpense.php` | `/dashboard/transactions` | `transactions` (income/expense/transfer) |
| 6 | **Bank Accounts** | `manageBank.php` | `/dashboard/banks` | `bank_accounts` |
| 7 | **Bank Transactions** | `bankTransaction.php` | `/dashboard/banks/transactions` | `bank_transactions` |
| 8 | **Bank Transfer** | `bankTransfer.php` | `/dashboard/banks/transfer` | `bank_transfers` |
| 9 | **Financial Dashboard** | `home.php` | Enhance `/dashboard` | aggregates from all finance tables |
| 10 | **Daily Report** | `summary.php` | `/dashboard/reports/daily` | report queries |
| 11 | **Purchase Invoices** | `purchase.php` | `/dashboard/purchases` | `purchase_invoices` |

### 5.2 Priority B — HR / Staff Extensions

| # | Module | Shahin Page | Punchless Route | Notes |
|---|--------|-------------|-----------------|-------|
| 12 | **Posts / Titles** | `managePost.php` | `/dashboard/posts` or field on employees | Simple lookup table |
| 13 | **Staff Statement** | `staffStatement.php` | `/dashboard/employees/[id]/statement` | Combine advances + salary payments |
| 14 | **Salary Deposit** | `salaryDeposit.php` | `/dashboard/salary/deposits` | Manual accrual tracking |
| 15 | **Staff Payments** | `manageStaffSalary.php` | `/dashboard/salary/payments` | Manual payment entry (Cash/Bank) |
| 16 | **Bulk Attendance** | `staffAttendance.php` | Tab on `/dashboard/attendance` | Present/absent for a day |
| 17 | **Attendance Excel Export** | `ateendanceReport.php` | Export button on `/dashboard/history` | xlsx download |

### 5.3 Priority C — Reports & Admin

| # | Module | Shahin Page | Punchless Route |
|---|--------|-------------|-----------------|
| 18 | GST Report | `GSTReport.php` | `/dashboard/reports/gst` |
| 19 | Invoice Report | `invoiceReport.php` | `/dashboard/reports/invoices` |
| 20 | Monthly Report | `monthlyReport.php` | `/dashboard/reports/monthly` |
| 21 | Yearly Report | `yearlyReport.php` | `/dashboard/reports/yearly` |
| 22 | Income/Expense Report | `particulerReport.php` | `/dashboard/reports/income-expense` |
| 23 | Expense Report | `expenseReport.php` | `/dashboard/reports/expenses` |
| 24 | Rojmel Report | `rojmelReport.php` | `/dashboard/reports/rojmel` |
| 25 | Bank Statement | `bankStatement.php` | `/dashboard/banks/[id]/statement` |
| 26 | User Log / Audit | `userLogReport.php` | `/dashboard/audit-log` |
| 27 | Dashboard Users | `manageUser.php` | Extend settings or `/dashboard/users` |
| 28 | Change Password | `ChangePassword.php` | `/dashboard/settings/password` |
| 29 | Sticky Notes | `home.php` | Widget on `/dashboard` |
| 30 | Data Lock | `home.php` | Optional privacy toggle on financial stats |

### 5.4 Keep Punchless Unique (Do NOT copy from Shahin)

These are Punchless differentiators — keep and enhance:

- GPS geofence attendance engine
- Workshop map picker with radius
- Job travel/on-site state machine
- Break in/out with live counters
- Correction request workflow
- Mobile employee app
- Multi-tenant SaaS architecture
- Hourly salary auto-calculation from sessions

---

## 6. Suggested Sidebar Structure (Shahin-like + Punchless)

Proposed future sidebar grouping if all Shahin features are added:

```
Dashboard          ← financial overview + quick access (like Shahin home)
─────────────────
OPERATIONS (Punchless core)
  Employees
  Workshops
  Jobs
  Attendance
  History
  Requests
─────────────────
CRM & BILLING (from Shahin)
  Clients
  Suppliers
  Invoices
  Purchases
─────────────────
FINANCE (from Shahin)
  Transactions (Income/Expense)
  Banks
  Salary Payments
  Salary Deposits
─────────────────
REPORTS
  Daily / Monthly / Yearly
  GST / Invoice / Expense / Rojmel
  Attendance / Salary
─────────────────
SETTINGS
  Company Settings
  Users
  Audit Log
  Billing (Stripe — Phase 10)
```

---

## 7. Database Schema Additions (High-Level)

To support Shahin-like features, new migrations would be needed:

```sql
-- CRM
clients (id, company_id, name, alias, contact, address, gst, opening_balance, ...)
suppliers (id, company_id, name, alias, contact, address, gst, opening_balance, ...)

-- Invoicing
invoices (id, company_id, client_id, invoice_number, vehicle_number, amount, gst_*, payment_mode, ...)
purchase_invoices (id, company_id, supplier_id, invoice_type, ...)

-- Finance
bank_accounts (id, company_id, bank_name, ac_name, ac_number, ifsc, opening_balance, ...)
bank_transactions (id, bank_id, type, amount, date, remark, ...)
bank_transfers (id, from_bank_id, to_bank_id, amount, date, ...)
transactions (id, company_id, particular, type, amount, payment_mode, bank_id, date, ...)

-- HR extensions
posts (id, company_id, name)
staff_payments (id, employee_id, type, amount, payment_mode, bank_id, date, ...)
salary_deposits (id, employee_id, amount, date, remark, ...)

-- Admin
audit_logs (id, user_id, action, entity, entity_id, timestamp, ...)
sticky_notes (id, company_id, title, description, date, ...)
```

All tables must include `company_id` + RLS per Punchless rules.

---

## 8. Implementation Roadmap (Suggested Phases)

| Phase | Name | Modules | Effort |
|-------|------|---------|--------|
| **11** | CRM Foundation | Clients, Suppliers, Posts | Medium |
| **12** | Invoicing | Tax Invoices, Purchases, GST fields | Large |
| **13** | Accounting Core | Banks, Transactions, Income/Expense | Large |
| **14** | Financial Dashboard | Home redesign, charts, quick access, data lock | Medium |
| **15** | Reports Suite | Daily/Monthly/Yearly/GST/Rojmel/Statements | Large |
| **16** | HR Extensions | Staff payments, deposits, statements, bulk attendance | Medium |
| **17** | Admin & Audit | User log, sticky notes, change password | Small |

> **Note:** Stripe Billing remains Phase 10 per project rules. Shahin-like ERP features should be Phases 11+.

---

## 9. Feature Comparison Matrix

| Feature | Shahin | Punchless | Match % |
|---------|--------|-----------|---------|
| Login | Phone + password | Email + password | 40% |
| Dashboard home | Full financial HQ | 4 stat cards | 15% |
| Staff/Employees | ✅ | ✅ | 65% |
| Posts/Job titles | ✅ | ❌ | 0% |
| Attendance (manual) | ✅ | ✅ | 70% |
| Attendance (GPS/auto) | ❌ | ✅ | Punchless only |
| Attendance reports | ✅ Excel | ✅ Sessions | 50% |
| Salary calculation | Manual monthly | Auto hourly | 40% |
| Salary payments | ✅ | ❌ | 0% |
| Salary deposits | ✅ | ❌ | 0% |
| Staff statement | ✅ | ❌ | 0% |
| Advances | ✅ | ✅ | 80% |
| Clients CRM | ✅ | ❌ | 0% |
| Suppliers | ✅ | ❌ | 0% |
| Tax invoices | ✅ | ❌ | 0% |
| Purchases | ✅ | ❌ | 0% |
| Banks | ✅ | ❌ | 0% |
| Income/Expense | ✅ | ❌ | 0% |
| Financial reports | ✅ (8 types) | ❌ (salary only) | 10% |
| Workshops + GPS | ❌ | ✅ | Punchless only |
| Jobs + travel tracking | Partial (vehicle on invoice) | ✅ | Punchless better |
| Correction requests | ❌ | ✅ | Punchless only |
| Break system | ❌ | ✅ | Punchless only |
| Mobile app | ❌ | 🚧 | Punchless only |
| User audit log | ✅ | ❌ | 0% |
| Sticky notes | ✅ | ❌ | 0% |
| Multi-tenant SaaS | ❌ | ✅ | Punchless only |

**Overall dashboard similarity: ~25–30%** (staff/attendance/salary overlap only).

---

## 10. Key Observations & Recommendations

### What Shahin does well (worth copying)
1. **Unified financial dashboard** — one screen shows cash position, dues, and today's collections
2. **Quick access grid** — every module one click away from home
3. **Consistent payment modes** — Cash/Bank/Credit on every transaction
4. **Client/Supplier ledgers** — opening balance + running due tracking
5. **Print everywhere** — workshop owners still rely on paper
6. **Rojmel report** — familiar to Gujarati business owners
7. **Sticky notes** — simple but useful for daily reminders

### What Punchless should NOT abandon
1. GPS attendance — Shahin's manual attendance is a step backward
2. State machine (workshop/travel/on-site/break) — unique value
3. Mobile-first employee experience
4. Auto salary from tracked hours — more accurate than manual entry
5. Multi-tenant architecture for SaaS scaling

### Recommended approach
1. **Don't rebuild Shahin 1:1** — merge ERP finance modules into Punchless while keeping GPS attendance as the core differentiator
2. **Start with Phase 11 (Clients + Invoices)** — highest visible value for workshop owners who also do billing
3. **Enhance dashboard home first** — even before full ERP, add financial summary cards and quick links
4. **Keep attendance/salary as-is** — enhance with Shahin's payment/deposit/statement pages as additions, not replacements

---

## 11. Appendix — All Shahin Pages Audited

| # | Page | Title | Primary Action |
|---|------|-------|----------------|
| 1 | `home.php` | Dashboard | Financial overview |
| 2 | `manageClient.php` | Manage Client | CRUD + receive payment |
| 3 | `clientStatement.php` | Client Statement | Date-range ledger |
| 4 | `manageSupplier.php` | Manage Supplier | CRUD + pay now |
| 5 | `purchase.php` | Supplier Invoices | Purchase/sales invoices |
| 6 | `managePost.php` | Manage Post | Job title CRUD |
| 7 | `manageStaff.php` | Manage Staff | Employee master |
| 8 | `staffAttendance.php` | Staff Attendance | Bulk attendance |
| 9 | `ateendanceReport.php` | Attendance Report | Monthly report + Excel |
| 10 | `deleteAttendance.php` | Delete Attendance | Remove records |
| 11 | `manageStaffSalary.php` | Staff Payments | Advance/salary/deduction |
| 12 | `salaryDeposit.php` | Salary Deposit | Accrue salary |
| 13 | `staffStatement.php` | Staff Statement | Employee ledger |
| 14 | `manageBank.php` | Manage Banks | Bank account CRUD |
| 15 | `bankTransfer.php` | Bank to Bank Transfer | Inter-account transfer |
| 16 | `bankTransaction.php` | Bank Transactions | Deposit/withdraw |
| 17 | `bankStatement.php` | Bank Statement | Date-range statement |
| 18 | `invoice.php` | Invoices | GST tax invoice |
| 19 | `manageExpense.php` | Manage Expense | Income/expense entry |
| 20 | `GSTReport.php` | GST Report | Monthly GST |
| 21 | `invoiceReport.php` | Invoice Report | All invoices |
| 22 | `summary.php` | Summary (Daily Report) | Daily P&L |
| 23 | `monthlyReport.php` | Monthly Report | Monthly summary |
| 24 | `yearlyReport.php` | Yearly Report | Annual summary |
| 25 | `particulerReport.php` | Income/Expense Report | Particular-wise |
| 26 | `expenseReport.php` | Expense Report | Expenses only |
| 27 | `rojmelReport.php` | Rojmel Report | Full ledger |
| 28 | `manageUser.php` | Manage User | Admin users |
| 29 | `userLogReport.php` | User Log Report | Audit trail |
| 30 | `ChangePassword.php` | Change Password | Password change |

---

*This document is a read-only audit. No data was added, modified, or deleted on the reference site.*