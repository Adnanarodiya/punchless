# 🖥️ 07 — Web Dashboard (Next.js)

## Overview

The web dashboard is the **owner/admin control centre** for Punchless — workshop attendance, payroll, commerce (clients/suppliers/invoices), finance, and reports in one app.

**Tech:** Next.js App Router, TypeScript, Tailwind CSS v4, Supabase, Zustand, `@punchless/ui` (shadcn-style components)

**Roles:** `owner` and `admin` only. Employees use the mobile app.

---

## Shell & Global UX

| Feature | Location | Notes |
|---------|----------|-------|
| Sidebar | `components/sidebar.tsx` + `sidebar-config.ts` | Grouped nav, mobile drawer |
| Header | `components/dashboard-header.tsx` | Learn, Cmd+K search, data lock, user menu |
| Page titles | `components/page-header.tsx` | Title + description + `?` Learn link |
| Data lock | `data-lock.store.ts` + header button | Masks financial amounts; auto-locks after 5 min idle |
| Global search | `components/global-search.tsx` | Ctrl+K — clients, suppliers, employees, jobs, invoices |
| Learn | `/dashboard/learn` | 23 modules with testing guides |

---

## Route Map (44 pages)

### Overview
| Route | Purpose |
|-------|---------|
| `/dashboard` | Financial HQ + operations stats, setup checklist, quick actions |
| `/dashboard/learn` | In-app documentation browser |

### People
| Route | Purpose |
|-------|---------|
| `/dashboard/employees` | Employee CRUD, invite, workshop assignment |
| `/dashboard/employees/[id]/statement` | Staff ledger (deposits, payments, advances) |
| `/dashboard/posts` | Job titles / roles (Mechanic, Supervisor, etc.) |
| `/dashboard/workshops` | Workshop locations with map geofence |

### Operations
| Route | Purpose |
|-------|---------|
| `/dashboard/attendance` | Live sessions, today, bulk mark, print sheet |
| `/dashboard/history` | Employee summary + all sessions, CSV export |
| `/dashboard/requests` | Correction requests (approve/reject) |
| `/dashboard/jobs` | Job CRUD, map location, assignment, status |

### Commerce
| Route | Purpose |
|-------|---------|
| `/dashboard/clients` | Client CRM, payments, commerce flow panel |
| `/dashboard/clients/[id]/statement` | Client ledger (print) |
| `/dashboard/suppliers` | Supplier CRM, payables |
| `/dashboard/suppliers/[id]/statement` | Supplier ledger (print) |
| `/dashboard/invoices` | GST tax invoices, split payment |
| `/dashboard/invoices/[id]` | Invoice detail |
| `/dashboard/invoices/[id]/print` | Printable tax invoice |
| `/dashboard/purchases` | Purchase/sales invoices from suppliers |

### Finance
| Route | Purpose |
|-------|---------|
| `/dashboard/transactions` | Income & expense entries (particular-wise) |
| `/dashboard/banks` | Bank accounts |
| `/dashboard/banks/transactions` | Deposits & withdrawals per bank |
| `/dashboard/banks/transfer` | Inter-bank transfers |
| `/dashboard/banks/[id]/statement` | Bank ledger statement |

### Payroll
| Route | Purpose |
|-------|---------|
| `/dashboard/salary` | Monthly salary report, export CSV/Excel, Pay links |
| `/dashboard/salary/payments` | Staff payments (salary paid, advance, deduction) |
| `/dashboard/salary/deposits` | Salary accrual deposits |
| `/dashboard/advances` | Advance requests approve/reject |

### Reports
| Route | Purpose |
|-------|---------|
| `/dashboard/reports` | Reports hub (8 report types) |
| `/dashboard/reports/daily` | Daily summary |
| `/dashboard/reports/monthly` | Monthly P&L |
| `/dashboard/reports/yearly` | Calendar year (not Indian FY) |
| `/dashboard/reports/gst` | GST slab summary |
| `/dashboard/reports/invoices` | Invoice list report |
| `/dashboard/reports/income-expense` | Particular-wise income/expense |
| `/dashboard/reports/expenses` | Expense-only report |
| `/dashboard/reports/rojmel` | Full ledger with running balance |

### Account (owner-heavy)
| Route | Purpose |
|-------|---------|
| `/dashboard/settings` | Company profile, work schedule, salary mode, data lock PIN |
| `/dashboard/settings/users` | Invite/deactivate admin users (owner) |
| `/dashboard/settings/password` | Change password |
| `/dashboard/audit-log` | Audit trail with CSV export (owner) |
| `/dashboard/billing` | Placeholder — Stripe Phase 10 (marked Soon in nav) |

---

## Key Concepts

### Indian Financial Year (FY)
Dashboard home uses **Indian FY (1 Apr – 31 Mar)**. The **Yearly report** uses **calendar year (Jan – Dec)** — labels explain the difference.

### Data Lock
Owners set a PIN in Settings. When locked, currency amounts show as masked across dashboard, clients, banks, salary, etc. Unlocks from the header; **auto-locks after 5 minutes** of inactivity.

### Money Flow Paths

**Clients (receivables):** Add client → Invoice → Receive payment → Statement

**Payroll:** Attendance + History → Fix Requests → Salary report → Payments (and Advances)

**Suppliers (payables):** Add supplier → Purchase invoice → Pay supplier → Statement

---

## Auth & Route Protection

```
middleware.ts → Check Supabase session
  ├── No session → redirect to /login
  ├── role = employee → redirect (use mobile app)
  └── role = owner/admin → allow /dashboard/*
```

---

## Role-Based Access

| Area | Owner | Admin |
|------|-------|-------|
| Dashboard, Learn, People, Operations, Commerce, Finance, Payroll, Reports | ✅ | ✅ |
| Settings, Users, Audit Log | ✅ | ❌ |
| Password | ✅ | ✅ |
| Billing (soon) | ✅ (placeholder) | ❌ |

---

## File Organization (`apps/web/src/`)

```
app/(dashboard)/dashboard/     ← One folder per feature/page
components/                    ← App-specific layout (sidebar, shell, panels)
lib/actions/                   ← Server actions (write) — one file per feature
lib/queries/                   ← Data fetching (read) — one file per feature
lib/stores/                    ← Zustand (data lock, navigation)
lib/content/                   ← Learn module content
packages/ui/                   ← Shared UI primitives (Button, DataTable, Tooltip, etc.)
```

---

## Related Docs

- Architecture → `02_ARCHITECTURE.md`
- Database → `05_DATABASE_SCHEMA.md`
- Attendance engine → `06_ATTENDANCE_ENGINE.md`
- Salary → `08_SALARY_CALCULATION.md`
- Theming → `11_THEMING_AND_COLORS.md`
- Statement UI → `12_STATEMENT_UI_PLAN.md`