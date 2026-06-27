# 📊 Punchless — Project Tracker

> **Last updated:** 2026-06-27 (GPS UI removed — fingerprint payroll flow only; nav/quick actions cleaned)
>
> This file tracks every file in the project, what it does, and which phase it belongs to.
> **Rule:** This file MUST be updated whenever any file is created, modified, or deleted.

---

## 🏗️ Phase Progress

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Project Setup | ✅ Done | Monorepo, packages, theming, config |
| 2 | Auth & Company | ✅ Done | Supabase DB, auth, signup/login, dashboard layout |
| 3 | Workshops & Employees | ✅ Done | Full CRUD for workshops (map picker) + employees (workshop assignment) |
| 4 | Attendance Engine (Web) | ✅ Done | Live attendance dashboard, manual sessions, close/delete sessions, stats, date-range queries |
| 5 | Job & Travel Tracking | ✅ Done | Job CRUD, map location, assignment, status workflow |
| 6 | Salary Calculation | ✅ Done | Monthly salary report, single hourly rate calculations across all states, breakdown by state, advance deductions |
| 7 | Salary Advances | ✅ Done | Full CRUD, approve/reject with notes, salary deduction integration, status filters |
| 8 | Mobile App | 🟡 Mostly Done | Employee app usable end-to-end — **deferred (later):** job detail screen, GPS auto-arrive at job, real-device GPS QA |
| 8.5 | Break System + History + Corrections | ✅ Done | Splash/auth flow, live work/break counters, break in/out, correction requests (mobile + web), history pages with filters, workshop location change detection, background refresh, location permission prompt |
| 9 | Settings & Polish | 🟡 Partial | Work schedule done; home polish → Phase 11A/15 |
| 10 | Stripe Billing | ⏸️ Skipped | No payment integration planned |
| 11A | Dashboard Shell | ✅ Done | Grouped sidebar, PageHeader, DataTable, wired home |
| 11B | Clients CRM | ✅ Done | clients + ledger_entries + payments + statement |
| 12 | Suppliers + Purchases | ✅ Done | suppliers, supplier_payments, purchase_invoices |
| 13 | Tax Invoices + GST | ✅ Done | invoices, line items, GST slabs, split payment, print, ledger auto-write |
| **13.5** | **Statement UI Redesign** | ✅ Done | Shahin-style client + supplier statements — letterhead, ledger table, print |
| 14 | Banks + Transactions | 🟡 Built — needs QA | bank accounts, income/expense |
| 15 | Financial Dashboard Home | ☐ Pending | Shahin-style financial HQ |
| 16 | HR Extensions | ☐ Pending | posts, staff payments, deposits |
| 17 | Reports Suite | ☐ Pending | 8 reports + print + Excel |

---

## 📁 Complete File Map

### Root (`/`)

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Root workspace config, DB scripts (`db:gen-types`, `db:push`, `db:seed-shahin-employees`, etc.) |
| `turbo.json` | 1 | Turborepo pipeline config (build, dev, lint, clean) |
| `pnpm-workspace.yaml` | 1 | Defines workspace packages: `apps/*`, `packages/*` |
| `.env` | 1 | Root env vars (Supabase URL, keys) — NOT committed |
| `.env.example` | 1 | Template for root `.env` |
| `.gitignore` | 1 | Git ignore rules (node_modules, .env, .next, etc.) |
| `AGENT.md` | 1 | AI agent rules — 14 rules for code style, conventions |
| `DOCS_INDEX.md` | 1 | Index of all documentation files |
| `README.md` | 1 | Project overview and setup instructions |
| `PROJECT_TRACKER.md` | 6 | **This file** — tracks all files and progress |
| `grok-md.md` | 9 | Shahin Motors BMS full website review + Punchless dashboard gap analysis (read-only audit) |
| `SHAHIN_IMPLEMENTATION_PLAN.md` | 11 | Shahin → Punchless phased implementation plan with ✅/🟡/☐ checklist, accessibility UX, DB schema, routes |
| `NEW_START.md` | 11 | Quick-start guide — which MD files to use, phase order, workflow steps |
| `TODAY_TESTING_2026-06-24.md` | 13 | **Today's testing guide** — Phase 13 + ledger fixes, step-by-step manual tests |
| `PHASE_14_TESTING.md` | 14 | **Phase 14 testing plan** — 2 dummy banks, 15 tests; Test 3 clarifies 3-page navigation flow |
| `DASHBOARD_EXECUTION_PLAN.md` | 11 | **Locked execution plan** — dashboard 11A→17 first, mobile later, no Stripe |
| `DASHBOARD_USABILITY_AUDIT.md` | UX | **Web dashboard usability audit** — owner assessment + **Phase 0 fingerprint upload → Shahin salary report** (GPS/mobile paused) |
| `may 2026 attandence.xlsx` | UX/ref | Owner fingerprint export sample (`rptMonthlyWorkDurationSummary`) — parser reference |
| `CR ATTENDENCE(1)(1).xlsx` | UX/ref | Owner manual attendance workbook (JAN–MAY 2026) — optional v2 import |
| `scripts/seed-shahin-employees.mjs` | **Phase 0** | One-time seed — 19 Shahin Motors employees + posts + fingerprint aliases (`pnpm db:seed-shahin-employees`) |
| `docs/12_STATEMENT_UI_PLAN.md` | 13.5 | **🔴 Priority plan** — Shahin-style statement UI (7 phases, print, company profile migration) |

### Documentation (`/docs/`)

| File | Phase | Description |
|------|-------|-------------|
| `01_PROJECT_OVERVIEW.md` | 1 | Business idea, target users, pricing model |
| `02_ARCHITECTURE.md` | 1 | Tech stack, monorepo structure, data flow |
| `03_GETTING_STARTED.md` | 1 | Setup instructions, env vars, dev commands |
| `04_BUILD_PHASES.md` | 1 | All 10 phases with detailed tasks |
| `05_DATABASE_SCHEMA.md` | 1 | Table definitions, relationships, RLS policies |
| `06_ATTENDANCE_ENGINE.md` | 1 | GPS geofence logic, state machine, background tracking |
| `07_WEB_DASHBOARD.md` | 1/4 | Full dashboard route map (44 pages), shell UX, money flows, roles |
| `08_SALARY_CALCULATION.md` | 1 | Hourly/travel rates, overtime, deductions |
| `09_MOBILE_APP.md` | 1 | Expo app screens, GPS permissions |
| `10_STRIPE_BILLING.md` | 1 | Subscription model, webhooks, usage metering |
| `11_THEMING_AND_COLORS.md` | 1 | CSS variable system, color tokens |
| `12_STATEMENT_UI_PLAN.md` | 13.5 | **Priority** — Statement UI redesign plan (client + supplier, Shahin reference) |

### Supabase (`/supabase/`)

| File | Phase | Description |
|------|-------|-------------|
| `config.toml` | 2 | Supabase local config (project ID: `lwjnkyaihiclbfnukrvn`) |
| `seed.sql` | 2/13.5 | **Statement demo seed** — clients, suppliers, banks, staff ledger data; idempotent; login `owner@demo.punchless` / `demo1234` on fresh reset |
| `migrations/.gitkeep` | 2 | Placeholder |
| `migrations/20260207112531_initial_schema.sql` | 2 | **Main schema**: companies, users, workshops, jobs, attendance_sessions, salary_advances + RLS + indexes + trigger |
| `migrations/20260207154949_fix_signup_trigger_schema_qualified.sql` | 2 | Fix: schema-qualified `public.companies`/`public.users` in signup trigger |
| `migrations/20260207165535_add_workshop_id_to_users.sql` | 3 | Added `workshop_id` FK to users table for employee→workshop assignment |
| `migrations/20260208061234_fix_advance_insert_policy.sql` | 7 | Fix: owner/admin can insert advances on behalf of employees + add delete policy |
| `migrations/20260208062002_company_settings_and_monthly_salary.sql` | 7 | Added company settings columns (work_start_time, grace_period, daily_work_hours, working_days) + monthly_salary on users |
| `migrations/20260208070315_drop_users_travel_rate.sql` | 7 | Removed redundant `travel_rate` column from users (single `hourly_rate` now used for workshop/travel/on-site) |
| `migrations/20260214060000_break_and_correction_requests.sql` | 8.5 | Added `break` state to attendance_sessions, new `correction_requests` table with RLS policies |
| `migrations/20260624120000_clients_and_ledger.sql` | 11B | **CRM foundation**: `clients`, `client_payments`, `ledger_entries` + RLS |
| `migrations/20260624140000_suppliers_and_purchases.sql` | 12 | `suppliers`, `supplier_payments`, `purchase_invoices` + ledger `purchase` ref |
| `migrations/20260624160000_tax_invoices.sql` | 13 | `invoices`, `invoice_line_items` + jobs `vehicle_number`/`client_id` |
| `migrations/20260624180000_fix_ledger_delete_policy.sql` | 13 | Admin can delete `ledger_entries` (invoice ledger resync) |
| `migrations/20260625120000_banks_and_transactions.sql` | 14 | `bank_accounts`, `bank_transactions`, `bank_transfers`, `transactions` + ledger ref types |
| `migrations/20260626120000_company_profile_fields.sql` | 13.5 | `companies` letterhead fields: `tagline`, `address`, `phone`, `email`, `logo_url` |
| `migrations/20260627120000_salary_mode_and_daily_payroll.sql` | 6 | `companies.salary_mode` (hourly/fixed) + `get_daily_attendance_payroll()` RPC (grace half-days, IST) |
| `migrations/20260627140000_fingerprint_attendance_import.sql` | **Phase 0** | `companies.ot_rate_multiplier`; `attendance_imports`, `attendance_import_rows`, `employee_fingerprint_aliases` + RLS |
| `migrations/20260625140000_hr_extensions.sql` | 16 | `posts`, `staff_payments`, `salary_deposits`; extend `users` (address, post_id, joining_date, account_no, ifsc_code); ledger ref `salary_deposit`, `staff_payment` |
| `migrations/20260625160000_audit_logs.sql` | 18 | `audit_logs` table — company-scoped action trail; owner SELECT, owner/admin INSERT |
| `migrations/20260625180000_shahin_extras.sql` | Extras | `companies.data_lock_pin_hash` + `sticky_notes` table + RLS |
| `migrations/20260625200000_push_tokens.sql` | 8 | `push_tokens` table — Expo push tokens per user/device + RLS (own tokens only) |
| `functions/.gitkeep` | 2 | Placeholder for Supabase Edge Functions |

---

### Packages

#### `packages/types/` — Shared TypeScript Types

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Package config, name: `@punchless/types` |
| `tsconfig.json` | 1 | TypeScript config |
| `src/index.ts` | 1 | Barrel export of shared types (UserRole, AttendanceState, etc.) |
| `src/database.types.ts` | 2 | **Auto-generated** Supabase DB types (run `pnpm db:gen-types`) |

#### `packages/config/` — Shared Constants

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Package config, name: `@punchless/config` |
| `tsconfig.json` | 1 | TypeScript config |
| `src/index.ts` | 1 | Constants: GPS config (intervals, accuracy), pricing (₹800/employee), attendance states, roles |

#### `packages/ui/` — Shared UI Components (shadcn pattern)

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Package config, name: `@punchless/ui`, deps: Radix, CVA, clsx |
| `tsconfig.json` | 1 | TypeScript config |
| `src/index.ts` | 1 | Barrel export of all UI components |
| `src/lib/utils.ts` | 1 | `cn()` utility (clsx + tailwind-merge) |
| `src/components/button.tsx` | 1 | Button component with variants (default, destructive, outline, secondary, ghost, link) |
| `src/components/dialog.tsx` | 1 | Dialog/modal component (Radix Dialog) |
| `src/components/alert-dialog.tsx` | 1 | Alert dialog for confirmations (Radix AlertDialog) |
| `src/components/modal.tsx` | 1 | Reusable modal wrapper |
| `src/components/confirm-modal.tsx` | 1 | Confirm/cancel modal with actions |
| `src/components/visually-hidden.tsx` | 1 | Accessibility helper for screen readers |
| `src/components/page-header.tsx` | 11A/9 | Page title + optional `titleAddon` + description + actions slot |
| `src/components/breadcrumbs.tsx` | 11A | Accessible breadcrumb navigation |
| `src/components/collapsible-nav-group.tsx` | 11A | Collapsible sidebar section group |
| `src/components/data-table.tsx` | 11A/4 | Data table — search, ReactNode empty state, optional sticky first column |
| `src/components/tooltip.tsx` | 4 | Radix tooltip primitive (TooltipProvider, Trigger, Content) |
| `src/components/payment-mode-select.tsx` | 11B | Cash/Bank/Credit payment mode select |
| `src/components/statement-letterhead.tsx` | 13.5 | Company gradient letterhead for printable statements |
| `src/components/statement-entity-box.tsx` | 13.5 | Dashed "Statement To" entity box with date range |
| `src/components/balance-badge.tsx` | 13.5 | Running balance with Due/Nil B/F/Advance labels |
| `src/components/statement-toolbar.tsx` | 13.5 | Search + Print controls (screen only) |
| `src/components/statement-table.tsx` | 13.5 | Shahin-style ledger table with opening/total/closing rows |
| `src/components/statement-format.ts` | 13.5 | Shared statement date/amount formatting helpers |

---

### Web App (`apps/web/`)

#### Config

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Next.js 15 app, deps: Supabase SSR, Lucide, Leaflet |
| `tsconfig.json` | 1 | TypeScript config with path aliases (`@/`, `@punchless/*`) |
| `.env.local` | 2 | Web env vars (Supabase URL, anon key, service role key) — NOT committed |
| `.env.example` | 2 | Template for `.env.local` |
| `next.config.ts` | 1 | Next.js config (transpiles `@punchless/*` packages) |
| `postcss.config.mjs` | 1 | PostCSS config for Tailwind |
| `eslint.config.mjs` | 1 | ESLint config |

#### App Layout & Theming

| File | Phase | Description |
|------|-------|-------------|
| `src/app/layout.tsx` | 1 | Root layout: Inter font, metadata, global CSS |
| `src/app/globals.css` | 1 | **Master theme file**: CSS variables for light/dark mode, attendance states, status colors, sidebar, charts |
| `src/app/page.tsx` | 1 | Landing page (redirects to `/dashboard`) |

#### Auth Pages (`src/app/(auth)/`)

| File | Phase | Description |
|------|-------|-------------|
| `layout.tsx` | 2 | Auth layout: centered card with dark background |
| `login/page.tsx` | 2/19 | Login form — onSubmit shows Button loader for min 2s, then client redirect to dashboard |
| `signup/page.tsx` | 2 | Signup form: company name + name + email + password → admin API creates user + company → auto-login |

#### Dashboard Pages (`src/app/(dashboard)/`)

| File | Phase | Description |
|------|-------|-------------|
| `layout.tsx` | 2 | Dashboard shell: Sidebar + Header + content area, fetches current user |
| `dashboard/page.tsx` | 15/3 | Financial HQ + operations; `SetupChecklist`; FY selector (`?fy=`), chart range (`?chart=7d\|6m`) |
| `dashboard-fy-selector.tsx` | 19 | FY `<select>` — only years with transaction data (newest first); default current FY |
| `dashboard-revenue-chart.tsx` | 15/19 | 7-day / 6-month income vs expense toggle |
| `invoices/[id]/page.tsx` | 19 | Dedicated invoice detail view (summary, line items, print/edit links) |
| `jobs/[id]/page.tsx` | 19 | Dedicated job detail page (customer, assignment, location, edit link) |
| `dashboard/dashboard-financial-cards.tsx` | 15 | Income, expense, cash, bank, client credit, supplier payable cards |
| `dashboard/dashboard-todays-payments.tsx` | 15 | Today's payments table (client component — DataTable) |
| `dashboard/dashboard-pending-dues.tsx` | 15 | Top 5 client dues + supplier payables |
| `dashboard/dashboard-revenue-chart.tsx` | 15 | 7-day income vs expense bar chart (CSS) |
| `dashboard/dashboard-live-clock.tsx` | 15 | Live date/time in page header |
| `dashboard/dashboard-quick-actions.tsx` | 15 | Quick actions after financial cards — colorful icon tiles (commerce, finance, ops, payroll) |
| `dashboard/dashboard-recent-tables.tsx` | 11A | Client component: recent attendance + jobs DataTables (stacked full-width) |
| `dashboard/clients/page.tsx` | 11B/3 | Server component: clients + summary; `CommerceFlowPanel`; `?client=&open=pay\|invoice` deep links |
| `dashboard/clients/client-manager.tsx` | 11B/3 | CRUD, receive payment (₹5k+ confirm), invoice row action, `?client=&open=` deep links, soft delete/recover |
| `dashboard/clients/[id]/statement/page.tsx` | 11B | Server component: client statement with date range |
| `dashboard/clients/[id]/statement/statement-manager.tsx` | 13.5 | Shahin-style statement — letterhead, entity box, ledger table, search, print |
| `dashboard/clients/[id]/statement/print/page.tsx` | 13.5 | Dedicated printable client statement (minimal chrome) |
| `dashboard/clients/[id]/statement/print/print-actions.tsx` | 13.5 | Back + Print buttons for client statement print route |
| `dashboard/suppliers/page.tsx` | 12/3 | Server component: suppliers + summary; `?supplier=&open=pay` deep links |
| `dashboard/suppliers/supplier-manager.tsx` | 12/3 | CRUD, Pay Now modal (₹5k+ confirm), statement link, `?supplier=` deep link, soft delete/recover |
| `dashboard/suppliers/[id]/statement/page.tsx` | 12 | Server component: supplier statement with date range |
| `dashboard/suppliers/[id]/statement/statement-manager.tsx` | 13.5 | Shahin-style supplier statement — same components, payable labels |
| `dashboard/suppliers/[id]/statement/print/page.tsx` | 13.5 | Dedicated printable supplier statement |
| `dashboard/suppliers/[id]/statement/print/print-actions.tsx` | 13.5 | Back + Print buttons for supplier statement print route |
| `dashboard/purchases/page.tsx` | 12 | Server component: purchases + active suppliers |
| `dashboard/purchases/purchase-manager.tsx` | 12 | Purchase/sales invoices with GST slabs + live total preview |
| `dashboard/invoices/page.tsx` | 13 | Server component: invoices + clients + jobs + suggested number |
| `dashboard/invoices/invoice-manager.tsx` | 13/3 | Tax invoice CRUD, GST preview, split payment; `?client=&openForm=1` opens new-invoice form with client selected |
| `dashboard/invoices/[id]/print/page.tsx` | 13 | Printable tax invoice with payment summary + pending balance due |
| `dashboard/invoices/[id]/print/print-actions.tsx` | 13 | Print/back buttons (hidden in print) |
| `dashboard/banks/page.tsx` | 14 | Server component: bank accounts + summary |
| `dashboard/banks/bank-manager.tsx` | 14 | Bank CRUD, soft delete/recover, links to transactions/transfer/statement |
| `dashboard/banks/transactions/page.tsx` | 14 | Bank deposit/withdraw page |
| `dashboard/banks/transactions/bank-transactions-manager.tsx` | 14 | Record deposits/withdrawals + history table |
| `dashboard/banks/transfer/page.tsx` | 14 | Bank-to-bank transfer page |
| `dashboard/banks/transfer/bank-transfer-manager.tsx` | 14 | Transfer form + history table |
| `dashboard/banks/[id]/statement/page.tsx` | 14 | Bank statement with date range |
| `dashboard/banks/[id]/statement/statement-manager.tsx` | 14 | Deposit/withdraw ledger table + print |
| `dashboard/transactions/page.tsx` | 14 | Income/expense transactions page |
| `dashboard/transactions/transaction-manager.tsx` | 14 | Income/expense CRUD; cash/bank breakdown on cards; Rojmel explainer (not bank balance) |
| `dashboard/employees/page.tsx` | 3/16 | Server component: fetches employees, workshops, posts; renders `EmployeeManager` |
| `dashboard/employees/employee-manager.tsx` | 3/16 | **Client component**: card grid (3–4 cols), PageHeader + Modal form, search, stats; quick payment + statement links |
| `dashboard/employees/[id]/statement/page.tsx` | 16 | Employee staff statement (date range) |
| `dashboard/employees/[id]/statement/statement-manager.tsx` | 16 | Statement table — deposits, payments, advances, running balance |
| `dashboard/posts/page.tsx` | 16 | Posts (job titles) list page |
| `dashboard/posts/post-manager.tsx` | 16 | Post CRUD with soft delete/recover |
| `dashboard/salary/payments/page.tsx` | 16 | Staff payments list page |
| `dashboard/salary/payments/page.tsx` | 16 | Staff payments page — reads `?employee=&month=&openForm=` URL params, prefetches salary payable |
| `dashboard/salary/payments/staff-payment-manager.tsx` | 16/3 | Staff payment form + table; salary_paid and ₹5k+ confirm modal; `?employee=&openForm=1` deep link |
| `dashboard/salary/deposits/page.tsx` | 16 | Salary deposits list page |
| `dashboard/salary/deposits/salary-deposit-manager.tsx` | 16 | Accrual deposits; amount prefills from employee `monthly_salary` |
| `dashboard/workshops/page.tsx` | 3 | Server component: fetches workshops, renders `WorkshopManager` |
| `dashboard/workshops/workshop-manager.tsx` | 3 | **Client component**: card grid, PageHeader + Modal (map picker, Maps URL import, current location button), search, stats |
| `dashboard/attendance/page.tsx` | 4 | Server component: fetches today's sessions + active sessions + employees + workshops, renders `AttendanceManager` |
| `dashboard/attendance/attendance-manager.tsx` | 4/16 | Live/Today/Bulk tabs; bulk present marking for a date (closed workshop sessions) |
| `dashboard/jobs/page.tsx` | 5 | Server component: fetches jobs + employees, renders `JobManager` |
| `dashboard/jobs/job-manager.tsx` | 5 | **Client component**: Job CRUD (add/edit/delete), assign employees, update status (pending/in-progress/completed), map picker for job location |
| `dashboard/salary/page.tsx` | 6/**Phase 0** | Salary page — fingerprint upload only; GPS `SalaryManager` commented out |
| `dashboard/salary/salary-manager.tsx` | 6/9 | GPS-based salary report + Export CSV/Excel (full month via API); summary/table amounts respect data lock |
| `fingerprint-salary-section.tsx` | **Phase 0** | Upload fingerprint `.xlsx`, Shahin-style salary table, export, Pay/Map actions |
| `fingerprint-name-map-modal.tsx` | **Phase 0** | Map unmatched fingerprint name → Punchless employee (saves alias) |
| `lib/utils/salary-export.ts` | 9 | Build salary report rows for CSV/Excel export |
| `app/api/salary/export/route.ts` | 9 | GET full-month salary report JSON for export |
| `masked-amount.tsx` | 9 | Client component — masks currency when data lock active |
| `data-lock-header-button.tsx` | 9 | Lock/unlock icon in dashboard header (all pages) |
| `dashboard/advances/page.tsx` | 7 | Server component: fetches advances + employees, renders `AdvanceManager` |
| `dashboard/advances/advance-manager.tsx` | 7/**Phase 0** | **Client component**: Owner records advances directly (no pending/approve workflow) — create/delete, search, deduct-month form |
| `dashboard/settings/page.tsx` | 7 | Server component: owner-only access, fetches company settings, renders `SettingsManager` |
| `dashboard/settings/settings-manager.tsx` | 7/18/**Phase 0** | Work schedule + Hourly/Fixed mode + **OT rate multiplier** (1× / 1.5× / 2×) |
| `dashboard/settings/users/page.tsx` | 18 | Owner-only: list dashboard users (owner/admin), invite admin |
| `dashboard/settings/users/users-manager.tsx` | 18 | Invite admin form + deactivate admin (service-role create + ban) |
| `dashboard/settings/password/page.tsx` | 18 | Change password page (owner/admin) |
| `dashboard/settings/password/password-manager.tsx` | 18 | Current + new password form via `changePassword` action |
| `dashboard/audit-log/page.tsx` | 18 | Owner-only audit log with date-range filter |
| `dashboard/audit-log/audit-log-manager.tsx` | 18 | Colored action/entity pills, legend, summaries, CSV export |
| `audit-pill.tsx` | 18 | Reusable rounded pill badge for audit log tones |
| `dashboard-sticky-notes.tsx` | Extras | Dashboard sticky notes CRUD widget |
| `dashboard-data-lock-controls.tsx` | Extras | Lock/unlock financials + PIN modal |
| `global-search.tsx` | Extras/3 | Cmd+K palette — 2 results per client/supplier (manage + statement); unique `item.id` keys |
| `setup-checklist.tsx` | 3 | Dismissible onboarding checklist on dashboard home (sessionStorage) |
| `commerce-flow-panel.tsx` | 3 | 4-step client money flow panel on Clients page |
| `delete-confirm-button.tsx` | UX | Reusable delete trigger + ConfirmModal ("Are you sure?") |
| `page-navigation-loader.tsx` | UX | Full-screen loader overlay on internal navigation |
| `navigation.store.ts` | UX | Zustand — navigation loading state |
| `(dashboard)/loading.tsx` | UX | Suspense fallback while dashboard pages load |
| `dashboard/history/page.tsx` | 8.5 | Server component: fetches history sessions + employee summaries, renders `HistoryManager` |
| `dashboard/history/history-manager.tsx` | 8.5/16 | Employee Summary / All Sessions tabs, period filter, CSV export |
| `dashboard/requests/page.tsx` | 8.5 | Server component: fetches correction requests, renders `RequestsManager` |
| `dashboard/requests/requests-manager.tsx` | 8.5 | **Client component**: Pending/All/Approved/Rejected filter, approve/reject with notes, auto-updates session on approval |
| `dashboard/billing/page.tsx` | 2 | ⏳ Placeholder — Phase 10 |
| `dashboard/learn/page.tsx` | 9 | Learn Punchless — server page wrapping `LearnManager` (role-filtered) |
| `dashboard/learn/learn-manager.tsx` | 9 | **Client component**: module sidebar, category/search filters, detail panels (overview, sections, workflows, testing guide, tips, related modules) |
| `lib/content/learn-types.ts` | 9 | TypeScript types for learn modules, sections, workflows, test steps |
| `lib/content/learn-modules.ts` | 9 | Content data — 23 dashboard modules with page sections, workflows, manual test steps + expected outputs |
| `lib/content/learn-icons.tsx` | 9 | Maps `LearnIconName` → Lucide icons for learn UI |
| `lib/content/learn-route-map.ts` | 9 | Maps dashboard URL paths → learn module IDs for contextual help links |
| `info-hint.tsx` | 9/2 | Inline help box for jargon and page explanations |
| `payroll-flow-panel.tsx` | 2/**Phase 0** | 3-step fingerprint payroll on Salary page (GPS mobile steps removed) |
| `lib/constants/payment-confirm.ts` | 3 | `CLIENT_PAYMENT_CONFIRM_THRESHOLD` (₹5000) for client/supplier/staff payment confirms |
| `lib/constants/data-lock.ts` | 4 | `DATA_LOCK_IDLE_MS` (5 min) — auto-lock financials after idle |
| `lib/constants/table-styles.ts` | 4 | Sticky first-column Tailwind classes for wide scroll tables |
| `hooks/use-data-lock-idle.ts` | 4 | Auto-lock hook — listens for activity, locks + toast after idle |
| `table-empty-state.tsx` | 4 | Friendly empty table/card state with icon, description, optional action |
| `icon-tooltip.tsx` | 4 | Wraps icon-only buttons with Radix tooltip labels |
| `dashboard-page-header.tsx` | 2 | Standard title + description + ? help for plain dashboard pages |
| `learn-page-help.tsx` | 9 | `CircleHelp` ? icon — auto-detects route, links to `/dashboard/learn?module=…` |
| `page-header.tsx` | 9 | App `PageHeader` wrapper — injects `LearnPageHelp` as `titleAddon` next to every page title |
| `dashboard-page-header.tsx` | 2 | Title + description + `LearnPageHelp` for Attendance, Salary, History, etc. |

#### Shared Components (`src/components/`)

| File | Phase | Description |
|------|-------|-------------|
| `sidebar.tsx` | 11A | Grouped collapsible sidebar with mobile drawer |
| `sidebar-config.ts` | 11A/17/18/9/2/**Phase 0** | Nav — Operations + Workshops commented out (GPS paused); Payroll + Commerce active |
| `report-layout.tsx` | 17/19 | Shared report shell — period presets, custom range, print, CSV + Excel export |
| `attendance-print-sheet.tsx` | 19 | Print-friendly attendance table (Attendance → Sheet tab) |
| `financial-year.ts` | 19 | Indian FY helpers — label, range, date→FY mapping, data-driven select options |
| `export-xlsx.ts` | 19 | `downloadXlsx()` via SheetJS; CSV fallback on failure |
| `report-table.tsx` | 17 | Server-friendly printable table for report pages |
| `report-period.ts` | 17 | `resolveReportPeriod()` — today/week/month/year/custom + month/year modes |
| `export-csv.ts` | 17 | Client CSV download helper |
| `report.queries.ts` | 17 | Daily, monthly, yearly, GST, invoice, income-expense, expense, rojmel queries |
| `dashboard/reports/page.tsx` | 17 | Reports hub — links to all 8 reports |
| `dashboard/reports/daily/page.tsx` | 17 | Daily summary report |
| `dashboard/reports/monthly/page.tsx` | 17 | Monthly P&L report |
| `dashboard/reports/yearly/page.tsx` | 17 | Yearly 12-month report |
| `dashboard/reports/gst/page.tsx` | 17 | GST slab summary |
| `dashboard/reports/invoices/page.tsx` | 17 | Invoice list report |
| `dashboard/reports/income-expense/page.tsx` | 17 | Particular-wise income/expense |
| `dashboard/reports/expenses/page.tsx` | 17 | Expense-only report |
| `dashboard/reports/rojmel/page.tsx` | 17 | Full ledger (Rojmel) with running balance |
| `dashboard-shell.tsx` | 11A/4 | Shell: skip-to-content, mobile nav, TooltipProvider, data-lock idle auto-lock |
| `dashboard-header.tsx` | 11A/9 | Top header: Learn button, search, mobile menu, user name + role + logout |
| `map-picker.tsx` | 3 | **Leaflet map component**: click/drag to set location, radius slider with live circle preview, OSM tiles |
| `statement-screen.tsx` | 13.5/9 | Shared client component — date filter, search, toolbar, contextual learn help, `#printMe` zone |
| `statement-print-document.tsx` | 13.5 | Server-friendly printable statement document (letterhead + table) |

#### Utils (`src/lib/utils/`)

| File | Phase | Description |
|------|-------|-------------|
| `formatting.ts` | 4/13.5 | Date/time/currency formatters + `formatMonthYear()` + `formatStatementDate()` (DD-MMM-YYYY) |
| `statement.ts` | 13.5 | `StatementResult`, `BalanceMeta`, `getBalanceMeta()`, `formatStatementAmount()` |
| `audit-log.ts` | 18 | `logAudit()`, `extractEntityIdFromInput()` — writes to `audit_logs` on successful protected actions |
| `audit-display.ts` | 18/19 | Action/entity pill labels, tones; includes `approve_correction` / `reject_correction` |
| `pin-hash.ts` | Extras | Scrypt hash/verify for data lock PIN (server-only) |
| `mask-financial.ts` | Extras | `maskAmount()` — `••••••` when dashboard locked |
| `fingerprint-attendance-parser.ts` | **Phase 0** | Parse `rptMonthlyWorkDurationSummary` xlsx — NONAME skip, Sunday filter, SUMMERY OT |
| `fingerprint-salary-report.ts` | **Phase 0** | Shahin salary line calc (÷ eligible days, OT × multiplier) + export rows |

#### Server Utilities (`src/lib/server/`)

| File | Phase | Description |
|------|-------|-------------|
| `protected-action.ts` | 7/18 | `protectedAction()` HOF — auth, roles, try/catch; optional `audit` config auto-logs successful writes |
| `push-notifications.ts` | 8 | `sendPushToUser()` — sends Expo push to all registered tokens via admin client (fails silently) |

#### Validation Schemas (`src/lib/validations/`)

| File | Phase | Description |
|------|-------|-------------|
| `common.ts` | 16 | `entityId()` — loose UUID validator (accepts demo seed IDs; Zod v4 `.uuid()` is stricter) |
| `employee.schema.ts` | 3/16 | Zod schemas: employee CRUD + address, post, joining date, bank fields |
| `post.schema.ts` | 16 | Zod schemas: `createPostSchema`, `updatePostSchema` |
| `staff-payment.schema.ts` | 16 | Zod schemas: `createStaffPaymentSchema`, `createSalaryDepositSchema` |
| `workshop.schema.ts` | 7 | Zod schema: `workshopSchema` (name, lat, lng, radius) |
| `attendance.schema.ts` | 7 | Zod schema: `createAttendanceSchema` |
| `job.schema.ts` | 7 | Zod schema: `jobSchema` |
| `advance.schema.ts` | 7 | Zod schema: `createAdvanceSchema` |
| `settings.schema.ts` | 7 | Zod schema: `companySettingsSchema` |
| `client.schema.ts` | 11B | Zod schemas: `createClientSchema`, `updateClientSchema`, `receiveClientPaymentSchema` |
| `supplier.schema.ts` | 12 | Zod schemas: `createSupplierSchema`, `updateSupplierSchema`, `paySupplierSchema` |
| `purchase.schema.ts` | 12 | Zod schemas + GST calc helpers for purchase invoices |
| `invoice.schema.ts` | 13 | Zod schemas + payment breakdown resolver for tax invoices |
| `bank.schema.ts` | 14 | Zod schemas: bank CRUD, deposit/withdraw, bank transfer |
| `transaction.schema.ts` | 14 | Zod schema: income/expense with cash or bank payment |
| `admin.schema.ts` | 18 | Zod schemas: `inviteAdminSchema`, `changePasswordSchema` |
| `sticky-note.schema.ts` | Extras | `stickyNoteSchema`, `dataLockPinSchema`, `verifyDataLockPinSchema` |

#### Stores (`apps/web/src/lib/stores/`)

| File | Phase | Description |
|------|-------|-------------|
| `data-lock.store.ts` | Extras/9 | Zustand — `hasPin` + financial unlock state (sessionStorage persist) |

#### UI/UX Polish (`packages/ui/` + dashboard)

| Change | Description |
|--------|-------------|
| `dialog.tsx` / `alert-dialog.tsx` | Lower border radius (`rounded-lg`), removed duplicate overlay in Modal |
| `button.tsx` | `loading` prop — spinner + auto-disable |
| `confirm-modal.tsx` | `loading` prop on destructive/default confirms |
| `collapsible-nav-group.tsx` | Controlled open state for accordion sidebar |
| `sidebar.tsx` | Independent scroll (`h-screen`), one nav group open at a time, single-link groups flat |
| `dashboard-shell.tsx` | Main content scroll only; `NavigationProgress` on route change |
| All `*-manager.tsx` deletes | `DeleteConfirmButton` instead of instant delete |
| Modal forms | Cancel buttons removed — close via X only |
| Save/submit buttons | `loading` spinner via `useAction` state |

#### Hooks (`src/hooks/`)

| File | Phase | Description |
|------|-------|-------------|
| `use-action.ts` | 7 | `useAction()` — server actions with toast + loading; ref guard blocks duplicate submits; `toastAction()` — inline form wrapper |

#### Action Result (`src/lib/utils/`)

| File | Phase | Description |
|------|-------|-------------|
| `action-result.ts` | 7 | `ActionResult` type + `formAction()` wrapper for void-returning form compatibility |

#### Server Actions (`src/lib/actions/`)

| File | Phase | Description |
|------|-------|-------------|
| `auth.actions.ts` | 2 | `signUp()` — admin API create user + company + auto-login; `login()` — email/password returns success/error (client redirects); `logout()` — sign out + redirect |
| `employee.actions.ts` | 3/16 | Employee CRUD + auto-sync current month salary deposit on create/update |
| `salary-deposit-sync.ts` | 16 | `syncMonthlySalaryDeposit()` — upsert deposit + ledger from `monthly_salary` |
| `post.actions.ts` | 16 | `createPost`, `updatePost`, `softDeletePost`, `recoverPost` |
| `staff-payment.actions.ts` | 16 | `fetchEmployeeSalaryPayable`, `createStaffPayment`, `createSalaryDeposit`, delete; writes staff + expense/bank ledgers |
| `workshop.actions.ts` | 3 | `createWorkshop()`; `updateWorkshop()` — name/address/lat/lng/radius; `toggleWorkshopStatus()`; `deleteWorkshop()` |
| `attendance.actions.ts` | 4/16 | Manual sessions + `bulkMarkAttendance()` for daily present marking |
| `attendance-import.actions.ts` | **Phase 0** | `uploadFingerprintAttendance()`, `mapFingerprintEmployeeAlias()` |
| `job.actions.ts` | 5/8 | `createJob()` / `updateJob()` — push "New job assigned" to assignee; `deleteJob()` |
| `advance.actions.ts` | 7/8 | `createAdvance()`; `approveAdvance()` / `rejectAdvance()` — push advance status to employee; `deleteAdvance()` |
| `settings.actions.ts` | 7/13.5/**Phase 0** | Work schedule (+ OT multiplier), company profile, data lock PIN actions |
| `sticky-note.actions.ts` | Extras | `createStickyNote`, `updateStickyNote`, `deleteStickyNote` |
| `correction.actions.ts` | 8.5/19 | `approveCorrectionRequest()` / `rejectCorrectionRequest()` — `protectedAction` + audit log entries |
| `client.actions.ts` | 11B | `createClient()`, `updateClient()`, `softDeleteClient()`, `recoverClient()`, `receiveClientPayment()` |
| `supplier.actions.ts` | 12 | `createSupplier()`, `updateSupplier()`, `softDeleteSupplier()`, `recoverSupplier()`, `paySupplier()` |
| `purchase.actions.ts` | 12 | `createPurchaseInvoice()`, `updatePurchaseInvoice()`, `softDeletePurchaseInvoice()` |
| `invoice.actions.ts` | 13 | `createInvoice()`, `updateInvoice()`, `softDeleteInvoice()` + ledger sync |
| `bank.actions.ts` | 14 | Bank CRUD, `recordBankTransaction()`, `recordBankTransfer()` + ledger writes |
| `transaction.actions.ts` | 14/18 | `createTransaction()`, `deleteTransaction()` + ledger writes; audit on writes |
| `admin.actions.ts` | 18 | `inviteAdminUser()`, `deactivateAdminUser()`, `changePassword()` |

#### Server Queries (`src/lib/queries/`)

| File | Phase | Description |
|------|-------|-------------|
| `auth.queries.ts` | 2 | `getAuthUser()` — Supabase auth user; `getCurrentUser()` — user + company join; `getCurrentCompany()` |
| `employee.queries.ts` | 3/16 | `getEmployees()`, `getEmployeeById()` — workshop + post joins |
| `post.queries.ts` | 16 | `getPosts()`, `getPostsSummary()`, `getPostById()` |
| `staff-payment.queries.ts` | 16 | `getStaffPayments()`, `getSalaryDeposits()`, `getEmployeeStatement()`, `getEmployeeSalaryBalance()` |
| `workshop.queries.ts` | 3 | `getWorkshops()` — all workshops ordered by created_at |
| `attendance.queries.ts` | 4 | `getTodayAttendance()` — today's sessions with employee/workshop/job joins; `getActiveSessions()` — open sessions (no end_time); `getAttendanceByDateRange()` — date-filtered; `getAttendanceSummary()` — grouped by employee+workshop+state with total minutes |
| `job.queries.ts` | 5 | `getJobs()` — list all jobs with assigned user details; `getJobById()` — get single job details |
| `advance.queries.ts` | 7 | `getAdvances()` — all advances with employee/approver name joins; `getApprovedAdvancesForMonth()` — total for salary deduction; `getPendingAdvanceCount()` — for dashboard stats |
| `settings.queries.ts` | 7/13.5 | Company settings + `getCompanyProfile()` for statement letterhead |
| `salary.queries.ts` | 6 | Unified payroll: `getSalaryReport()` + `getEmployeeSalaryPayable()` — hourly or fixed mode, grace half-days, joining-date pro-rata, advance deductions |
| `attendance-import.queries.ts` | **Phase 0** | `getFingerprintSalaryReport()`, `getUnmatchedFingerprintRows()`, `getActiveEmployeesForMapping()` |
| `salary-calculation.ts` | 6 | Shared gross salary engine: day credits, adjusted hours, fixed cap at `monthly_salary` |
| `history.queries.ts` | 8.5 | `getHistorySessions()` — all sessions with employee/workshop/job joins; `getEmployeeSummaries()` — grouped by employee with live duration; `getEmployeeHistory()` — single employee sessions |
| `correction.queries.ts` | 8.5 | `getCorrectionRequests()` — all requests with employee details; `getPendingRequestCount()` — for dashboard badge |
| `dashboard.queries.ts` | 15/19 | Stats, `getFinancialYearsWithData()`, FY-scoped financial summary, revenue charts |
| `client.queries.ts` | 11B/13.5 | `getClientStatement()` → enriched `StatementResult` with invoice/vehicle/user metadata |
| `supplier.queries.ts` | 12/13.5 | Supplier CRUD + enriched `getSupplierStatement()` with purchase no. + user |
| `purchase.queries.ts` | 12 | `getPurchaseInvoices()` with supplier join |
| `invoice.queries.ts` | 13 | `getInvoices()`, `getInvoiceById()`, `getNextInvoiceNumber()` |
| `bank.queries.ts` | 14 | `getBanks()`, `getBankById()`, `getBankStatement()`, `getBankTransactions()`, `getBankTransfers()` |
| `transaction.queries.ts` | 14 | `getTransactions()`, `getTransactionsSummary()` |
| `audit.queries.ts` | 18 | `getAuditLogs()` — owner-only, date range + user join |
| `admin-user.queries.ts` | 18 | `getDashboardUsers()` — owner/admin accounts for company |
| `sticky-note.queries.ts` | Extras | `getStickyNotes()` |
| `search.queries.ts` | Extras/3 | `globalSearch()` — dual client/supplier hits (manage + statement), employees, jobs, invoices, purchases |
| `setup-checklist.queries.ts` | 3 | `getSetupChecklistStatus()` — profile, workshop, posts, employees completion for dashboard checklist |

#### Supabase Clients (`src/lib/supabase/`)

| File | Phase | Description |
|------|-------|-------------|
| `client.ts` | 2 | Browser Supabase client (`createBrowserClient`) |
| `server.ts` | 2 | SSR Supabase client (reads cookies for auth session) |
| `admin.ts` | 2 | Service-role client (bypasses RLS, used for admin operations) |

#### API Routes (`src/app/api/`)

| File | Phase | Description |
|------|-------|-------------|
| `api/history/route.ts` | 8.5 | GET endpoint for client-side history fetching with date range + optional employee filter |
| `api/search/route.ts` | Extras | GET `?q=` — authenticated global search JSON |

#### Middleware

| File | Phase | Description |
|------|-------|-------------|
| `src/middleware.ts` | 2 | Session refresh + route protection: `/login`, `/signup` public; `/dashboard/*` requires auth |

---

### Mobile App (`apps/mobile/`) — 🟡 Mostly Done (Phase 8 — deferred items above)

#### Config

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 8 | Expo SDK 54 app, deps: expo-router, expo-location, expo-notifications, expo-device, Supabase, Zustand, Lucide RN |
| `tsconfig.json` | 1 | TypeScript config |
| `app.json` | 8 | Expo config: light UI mode, scheme, plugins (expo-router, expo-location, expo-notifications), iOS/Android location permissions, EAS projectId |
| `.env` | 1 | Mobile env vars — NOT committed |
| `.env.example` | 1 | Template for `.env` |

#### Screens

| File | Phase | Status | Description |
|------|-------|--------|-------------|
| `app/index.tsx` | 8.5 | ✅ Functional | Root index — redirects to login or home based on auth state (fixes "unmatched route" error) |
| `app/_layout.tsx` | 8/8.5 | ✅ Functional | Root layout: splash, auth guard, location permission modal, GPS tracking init, push token registration, notification tap → tab navigation |
| `app/(auth)/_layout.tsx` | 1 | ✅ Functional | Auth stack layout |
| `app/(auth)/login.tsx` | 8 | ✅ Functional | Real Supabase email/password login, error message, loading state |
| `app/(tabs)/_layout.tsx` | 8.5 | ✅ Functional | Tab navigator: Home, Attendance, History, Salary, Requests, Profile — Lucide icons |
| `app/(tabs)/home.tsx` | 8.5 | ✅ Functional | **Live HH:MM:SS work counter** (ticks every second), break counter, status badge, ☕ Break In / 🔔 Break Out buttons, today's summary (workshop/travel/on-site/break), job actions, end shift |
| `app/(tabs)/attendance.tsx` | 8 | ✅ Functional | Monthly calendar view with attendance data |
| `app/(tabs)/history.tsx` | 8.5 | ✅ Functional | Employee's own clock in/out history, period filter (Today/7 Days/Month), day-wise grouping with expandable sessions |
| `app/(tabs)/requests.tsx` | 8.5 | ✅ Functional | Correction request system — submit break/session corrections, select session to correct, enter corrected times + reason, view past requests with status |
| `app/(tabs)/jobs.tsx` | 8 | ✅ Functional | Active/All tabs, job cards with status badge, Navigate + Call + START/ARRIVED/FINISH buttons, live HH:MM:SS timers for travel & on-site, time summary, auto-refresh every 15s, job status auto-updates (in_progress/completed) |
| `app/(tabs)/salary.tsx` | 8 | ✅ Functional | Monthly salary breakdown + advance request form + advance history |
| `app/(tabs)/profile.tsx` | 8 | ✅ Functional | Logged-in employee profile + logout |
| `app/job/[id].tsx` | 8 | ⏳ Later | Job detail screen — not built yet |

#### Libraries, Services & Stores

| File | Phase | Description |
|------|-------|-------------|
| `lib/supabase.ts` | 3 | Supabase client configured for React Native (AsyncStorage, no URL detection) |
| `lib/services/auth.service.ts` | 8 | `signInWithEmail()`, `signOutUser()`, `getSessionUserProfile()` |
| `lib/services/attendance.service.ts` | 8.5 | `getTodayAttendanceSummary()` — current state + workshop/travel/on-site/break minutes + currentSessionStart for live counter |
| `lib/services/salary.service.ts` | 8 | `getMySalaryReport()` — gross, advances, net for selected month |
| `lib/services/advance.service.ts` | 8 | `requestAdvance()` + `getMyAdvances()` |
| `lib/services/workshop.service.ts` | 3 | `getActiveWorkshops()`, `getDistanceMeters()` (Haversine), `findNearestWorkshop()` — geofence helpers |
| `lib/services/job.service.ts` | 8 | `getMyJobs()`, `getActiveJobs()`, `getJobTimeSummary()` — travel/on-site/total time per job with active session detection, `updateJobStatus()` — mark in_progress/completed |
| `lib/services/location.service.ts` | 8 | GPS helpers + `applyTrackingProfile()` — 60s/50m off-duty, 30s/20m active |
| `lib/services/session.service.ts` | 8 | Open/close attendance sessions with offline queue + AsyncStorage cache |
| `lib/services/sync.service.ts` | 8 | Sync offline queue and refresh today's attendance summary |
| `lib/services/notification.service.ts` | 8 | `registerForPushNotifications()` — permission + Expo token upsert; `unregisterPushNotifications()` on logout; `getRouteForNotificationScreen()` for tap navigation |
| `lib/services/geofence.service.ts` | 8.5 | **Core attendance engine**: `processLocation()` — auto workshop enter/exit with grace period + workshop location change detection; `startTravel()`, `arriveAtJob()`, `completeJob()`, `finishJob()`, `endShift()`, `startBreak()`, `endBreak()` — manual hybrid transitions; `forceRefreshWorkshops()` — cache invalidation; 2-min workshop cache TTL |
| `lib/services/history.service.ts` | 8.5 | `getAttendanceHistory()` — fetch sessions for date range; `groupSessionsByDate()` — group into day summaries |
| `lib/services/correction.service.ts` | 8.5 | `getMyCorrectionRequests()`, `submitBreakCorrection()`, `submitSessionCorrection()` — correction request CRUD |
| `lib/services/calendar.service.ts` | 8 | Monthly attendance calendar data |
| `lib/tasks/background-location.ts` | 8.5 | TaskManager background task — processes GPS updates + refreshes attendance summary in background (lightweight, battery efficient) |
| `lib/stores/auth.store.ts` | 8 | Zustand auth/session store — login registers push token, logout unregisters before sign-out |
| `lib/stores/attendance.store.ts` | 8.5 | Zustand attendance summary store — includes breakMinutes + currentSessionStart for live counter |
| `lib/stores/location.store.ts` | 8 | Zustand GPS tracking store — permission state, tracking on/off, last location |
| `lib/stores/offline.store.ts` | 8 | Offline action queue with ordered sync (local session ID → server ID mapping) |
| `lib/stores/network.store.ts` | 8 | NetInfo connectivity state |
| `lib/types/attendance-engine.ts` | 8 | Shared `EngineState` union type |
| `components/OfflineBanner.tsx` | 8 | Home screen offline / pending-sync indicator |
| `lib/utils/formatting.ts` | 8 | Mobile helpers: `formatMinutes()`, `formatCurrency()`, `getCurrentMonthString()` |

---

## 🗄️ Database Tables

| Table | Phase | Description |
|-------|-------|-------------|
| `companies` | 2 | Multi-tenant company records (name, subscription status, Stripe IDs) |
| `users` | 2 | All users (owner/admin/employee), linked to `auth.users`, has `company_id` + `workshop_id` (Phase 3) |
| `workshops` | 2 | Workshop locations (name, address, lat, lng, radius, is_active) |
| `jobs` | 2 | Job records (title, customer info, location, status, assigned employee) |
| `attendance_sessions` | 2 | Time tracking records (employee, state: workshop/travel/on_site_job/off_duty/**break**, workshop, job, start/end time, duration) |
| `salary_advances` | 2 | Advance requests (amount, reason, status, approved_by) |
| `correction_requests` | 8.5 | Employee correction requests (session_id, original/requested times, reason, status: pending/approved/rejected, admin review) |
| `clients` | 11B | CRM clients (name, alias, contact, address, GST, opening_balance, soft delete) |
| `client_payments` | 11B | Payments received from clients (amount, payment_mode, payment_date) |
| `ledger_entries` | 11B | Shared finance ledger (entity_type, entry_type, debit/credit, reference_type/id) |
| `suppliers` | 12 | Vendor CRM (mirror of clients, payable via ledger credits) |
| `supplier_payments` | 12 | Payments to suppliers (Cash/Bank) |
| `purchase_invoices` | 12 | Supplier purchase/sales invoices with GST breakdown |
| `invoices` | 13 | Client tax invoices with GST + payment split |
| `invoice_line_items` | 13 | Line items per tax invoice |
| `audit_logs` | 18 | Action trail (user, action, entity_type/id, summary); owner read, owner/admin insert |
| `sticky_notes` | Extras | Dashboard reminders (title, description, note_date); owner/admin CRUD |
| `push_tokens` | 8 | Expo push tokens per user/device (user_id, company_id, expo_push_token, platform) |

---

## 🔑 Key Integration Points

```
Signup Flow:     signup page → auth.actions.ts → admin.ts (service role) → auth.users + companies + users
Login Flow:      login page → auth.actions.ts → server.ts (SSR) → min 2s loader → client redirect to dashboard
Route Protection: middleware.ts → checks session → redirects to /login if unauthenticated
Employee Create: employee-manager.tsx → employee.actions.ts → admin.ts → auth.users + users
Workshop Create: workshop-manager.tsx → workshop.actions.ts → server.ts → workshops table
Map Picker:      workshop-manager.tsx → map-picker.tsx (Leaflet) → lat/lng → workshop.actions.ts
Workshop Assign: employee-manager.tsx → dropdown (if >1) or auto-assign (if 1) → employee.actions.ts
Job Create:      job-manager.tsx → map-picker.tsx → job.actions.ts → jobs table
Salary Report:   salary-manager.tsx → salary.queries.ts → attendance_sessions sum + advance deductions → display; Pay → staff payments with suggested amount
Advance Flow:    advance-manager.tsx → advance.actions.ts (auto-approved on create) → salary_advances table → deducted on fingerprint salary report
Mobile Login:    app/(auth)/login.tsx → auth.store.ts → auth.service.ts → supabase.auth.signInWithPassword
Mobile Home:     app/(tabs)/home.tsx → attendance.service.ts → attendance_sessions (today summary + live state) + geofence.service.ts (manual travel/job/end-shift actions) + location.store.ts (GPS status)
Mobile Jobs:     app/(tabs)/jobs.tsx → job.service.ts → jobs table (assigned jobs with status/actions)
Mobile GPS:      _layout.tsx → background-location.ts (TaskManager) → geofence.service.ts → processLocation() → auto workshop enter/exit + session open/close
Mobile Salary:   app/(tabs)/salary.tsx → salary.service.ts + advance.service.ts → salary/advance data + request submit
Mobile Break:    app/(tabs)/home.tsx → geofence.service.ts → startBreak()/endBreak() → close workshop session + open break session → live counter pauses/resumes
Mobile History:  app/(tabs)/history.tsx → history.service.ts → attendance_sessions (grouped by date with summaries)
Mobile Requests: app/(tabs)/requests.tsx → correction.service.ts → correction_requests table → admin reviews on web
Web History:     dashboard/history → history.queries.ts → employee summaries with live duration + all sessions
Web Requests:    dashboard/requests → correction.queries.ts + correction.actions.ts → approve (auto-updates session) / reject
Push Notify:     job.actions.ts / advance.actions.ts → push-notifications.ts → Expo Push API → mobile device; token stored via notification.service.ts → push_tokens
```

---

## 📦 External Dependencies (Key ones)

| Package | Where | Purpose |
|---------|-------|---------|
| `@supabase/supabase-js` | web, mobile | Database + Auth client |
| `@supabase/ssr` | web | Server-side rendering support |
| `react-leaflet` + `leaflet` | web | Map picker for workshop locations |
| `lucide-react` | web | Icons (ONLY icon library allowed) |
| `lucide-react-native` | mobile | Icons for mobile |
| `zustand` | web, mobile | State management |
| `expo-location` | mobile | GPS access |
| `expo-task-manager` | mobile | Background GPS tracking |
| `expo-notifications` | mobile | Push notification permissions, token, tap handling |
| `expo-device` | mobile | Physical device check for push registration |
| `@radix-ui/*` | packages/ui | Accessible UI primitives |
| `class-variance-authority` | packages/ui | Component variant system |
