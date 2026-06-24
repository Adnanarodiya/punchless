# Dashboard Execution Plan — Phases 11A → 17

> **Locked:** 2026-06-24  
> **Strategy:** Finish the full web dashboard (Shahin ERP layer) before any mobile/app polish.  
> **Out of scope for now:** Phase 10 Stripe payment integration, Phase 18 admin/audit, mobile app work.

---

## Scope Decisions

| Decision | Choice |
|----------|--------|
| Build order | **11A → 11B → 12 → 13 → 14 → 15 → 16 → 17** (strict sequence) |
| Mobile app polish | **After** dashboard 11A–17 is usable |
| Stripe / billing | **Skip payment integration** — keep `/dashboard/billing` as placeholder or simple “coming soon” |
| GPS attendance | **Keep as-is** — do not replace with manual-only |
| Core differentiator | Time engine (Punchless) + money layer (Shahin) |

---

## What Already Exists (do not rebuild)

| Area | Status | Routes / files |
|------|--------|----------------|
| Auth + company | ✅ | `/login`, `/signup` |
| Employees | ✅ | `/dashboard/employees` |
| Workshops + map | ✅ | `/dashboard/workshops` |
| Jobs + map | ✅ | `/dashboard/jobs` |
| Attendance (live + manual) | ✅ | `/dashboard/attendance` |
| History + live counters | ✅ | `/dashboard/history` |
| Correction requests | ✅ | `/dashboard/requests` |
| Auto salary report | ✅ | `/dashboard/salary` |
| Advances | ✅ | `/dashboard/advances` |
| Work schedule settings | ✅ | `/dashboard/settings` |
| Dashboard home | 🟡 | 4 stat cards + **placeholder** recent sections |
| Sidebar | 🟡 | Flat list — needs grouped nav (11A) |
| Finance / CRM tables | ☐ | **0 tables** — starts in 11B |

---

## Phase-by-Phase Plan

### Phase 11A — Dashboard Shell & Navigation (~1 week)

**Goal:** Foundation UI every later module reuses. **No database migrations.**

| # | Deliverable | Location |
|---|-------------|----------|
| 1 | `CollapsibleNavGroup` | `packages/ui/src/components/collapsible-nav-group.tsx` |
| 2 | `PageHeader` (title, description, actions slot) | `packages/ui/src/components/page-header.tsx` |
| 3 | `DataTable` (sort, search, empty state) | `packages/ui/src/components/data-table.tsx` |
| 4 | `Breadcrumbs` | `packages/ui/src/components/breadcrumbs.tsx` |
| 5 | Print CSS utility | `apps/web/src/app/globals.css` or `packages/ui` |
| 6 | Grouped sidebar (7 sections) | `apps/web/src/components/sidebar.tsx` |
| 7 | Skip-to-content link | `apps/web/src/app/(dashboard)/layout.tsx` |
| 8 | Mobile responsive sidebar / drawer | `sidebar.tsx` |
| 9 | Dashboard home — real recent attendance | `dashboard/page.tsx` + query |
| 10 | Dashboard home — real recent jobs | `dashboard/page.tsx` + query |
| 11 | Quick action links grid | `dashboard/page.tsx` |
| 12 | Remove all placeholder text on home | `dashboard/page.tsx` |

**Done when:** Owner opens `/dashboard` and sees live attendance + jobs; nav is grouped; shared table/header used on at least home sections.

---

### Phase 11B — Clients CRM + Ledger Foundation (~1.5 weeks)

**Goal:** First ERP module + `ledger_entries` table (powers all statements/reports later).

**Database (migration first):**
- `clients` — name, alias, phone, address, gst_number, opening_balance, is_deleted
- `client_payments` — client_id, amount, payment_mode, bank_id (nullable), date, remark
- `ledger_entries` — entity_type, entity_id, entry_type, amount, payment_mode, reference_type/id, company_id

**Backend:**
- `client.actions.ts`, `client.queries.ts`, `client.schema.ts`

**UI:**
- `/dashboard/clients` — CRUD, summary cards (count + total due)
- Receive payment modal (Cash / Bank)
- `/dashboard/clients/[id]/statement` — date-range ledger view
- Soft delete + recover

**Done when:** Add client → record payment → statement shows running balance.

---

### Phase 12 — Suppliers + Purchases (~1.5 weeks)

**Database:**
- `suppliers`, `supplier_payments`, `purchase_invoices` (+ GST slab fields)

**UI:**
- `/dashboard/suppliers` — CRUD, opening balance, Pay Now modal
- `/dashboard/purchases` — purchase invoice CRUD
- All payments write to `ledger_entries`

**Done when:** Supplier payable tracked; purchase invoices affect ledger.

---

### Phase 13 — Tax Invoices + GST (~2 weeks)

**Database:**
- `invoices`, `invoice_line_items`
- Optional: extend `jobs` with `vehicle_number`, `client_id`

**UI:**
- `/dashboard/invoices` — full CRUD
- GST breakdown (5% / 12% / 18% / 28%)
- Payment modes: Cash / Credit / Bank / Split
- Auto + manual invoice numbers
- Print invoice view
- Invoice creation auto-writes `ledger_entries`

**Done when:** Create invoice → client due updates → printable tax invoice.

---

### Phase 14 — Banks + Income/Expense (~2 weeks)

**Database:**
- `bank_accounts`, `bank_transactions`, `bank_transfers`, `transactions`

**UI:**
- `/dashboard/banks` — account CRUD
- `/dashboard/banks/transactions` — deposit / withdraw
- `/dashboard/banks/transfer` — bank-to-bank
- `/dashboard/banks/[id]/statement`
- `/dashboard/transactions` — income / expense entries
- All writes go to `ledger_entries`

**Done when:** Cash + bank balances reconcile with ledger.

---

### Phase 15 — Financial Dashboard Home (~1 week)

**Goal:** Replace basic home with Shahin-style financial HQ (attendance widgets stay).

**Database (optional):**
- `sticky_notes`
- Extend `companies`: `fy_start_month`, `data_lock_pin`, `address`, `gst_number`

**UI on `/dashboard`:**
- Financial cards: Income, Expense, Cash, Bank, Credit
- Client due + supplier payable summaries
- Today's payments table
- Top pending dues list
- Revenue chart (7 days / 6 months)
- Quick access grid (all modules)
- Sticky notes widget
- Data lock (owner PIN hides financials)
- FY selector + live clock

**Done when:** Home answers “how is my business doing today?” in money terms.

---

### Phase 16 — HR Extensions (~1.5 weeks)

**Database:**
- `posts`
- Extend `users`: address, post_id, joining_date, account_no, ifsc_code
- `staff_payments`, `salary_deposits`

**UI:**
- `/dashboard/posts` — position CRUD
- Extend employee form (address, post, bank, joining date)
- `/dashboard/salary/payments` — Advance / Salary Paid / Deduction
- `/dashboard/salary/deposits` — accrual tracking
- `/dashboard/employees/[id]/statement`
- Bulk attendance tab on `/dashboard/attendance`
- Excel export on `/dashboard/history`

**Done when:** HR matches Shahin staff + payroll workflow alongside GPS auto-salary.

---

### Phase 17 — Reports Suite (~2 weeks)

**Shared:** `ReportLayout` with period presets (Today / Week / Month / Year / Custom)

| Route | Report |
|-------|--------|
| `/dashboard/reports/daily` | Daily summary |
| `/dashboard/reports/monthly` | Monthly |
| `/dashboard/reports/yearly` | Yearly |
| `/dashboard/reports/gst` | GST |
| `/dashboard/reports/invoices` | Invoice list |
| `/dashboard/reports/income-expense` | Income/expense |
| `/dashboard/reports/expenses` | Expense breakdown |
| `/dashboard/reports/rojmel` | Full ledger (Rojmel) |

**All reports:** Print + Excel export.

**Done when:** Owner can run any Shahin-style report from one menu.

---

## Build Order & Dependencies

```
11A (shell, no DB)
 └── 11B (clients + ledger_entries)  ← ledger is required by everything below
      ├── 12 (suppliers + purchases)
      ├── 13 (invoices) ──────────────┐
      └── 14 (banks + transactions) ──┤
                                      ├── 15 (financial home — needs 11B–14 data)
                                      ├── 16 (HR extensions)
                                      └── 17 (reports — needs ledger + all modules)
```

**Critical rule:** `ledger_entries` in 11B is the spine. Do not build reports (17) or financial home (15) before 11B–14 are done.

---

## Standard Workflow (every phase after 11A)

```
1. Read phase section in SHAHIN_IMPLEMENTATION_PLAN.md
2. Check grok-md.md for Shahin screen reference (if needed)
3. Write Supabase migration + RLS policies
4. pnpm db:push (or db:reset locally)
5. pnpm db:gen-types
6. validations → queries → actions → UI page
7. Add sidebar link + update PROJECT_TRACKER.md
8. Mark ✅ in SHAHIN_IMPLEMENTATION_PLAN.md + this file
9. Manual test on web before next phase
```

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 11A | 1 week | Week 1 |
| 11B | 1.5 weeks | Week 2–3 |
| 12 | 1.5 weeks | Week 4–5 |
| 13 | 2 weeks | Week 6–7 |
| 14 | 2 weeks | Week 8–9 |
| 15 | 1 week | Week 10 |
| 16 | 1.5 weeks | Week 11–12 |
| 17 | 2 weeks | Week 13–14 |

**~14 weeks** to a fully usable Shahin-style dashboard. Mobile work starts after Week 14 (or when 15+17 are “good enough” for daily use).

---

## What We Do RIGHT NOW — Phase 11A

**PR-1 tasks (in order):**

1. Create `packages/ui` shared components: `page-header`, `data-table`, `collapsible-nav-group`, `breadcrumbs`
2. Export from `packages/ui/src/index.ts`
3. Rewrite `sidebar.tsx` with 7 grouped sections (Commerce/Finance links disabled or “soon” until built)
4. Wire `dashboard/page.tsx`:
   - Fetch last 10 attendance sessions (today)
   - Fetch last 10 active/recent jobs
   - Quick action grid → existing routes (Employees, Jobs, Attendance, Salary, etc.)
5. Add skip-to-content + mobile drawer
6. Update `PROJECT_TRACKER.md`

**Next:** Say `start Phase 13` to begin Tax Invoices + GST.

---

## Explicitly Deferred

| Item | When |
|------|------|
| Mobile push notifications | After dashboard 11A–17 |
| Mobile offline sync polish | After dashboard |
| Phase 10 Stripe payment integration | Not planned (billing page stays placeholder) |
| Phase 18 audit log, phone login, dashboard users | After 17 or as needed |
| Phase 9 misc polish | Absorbed into 11A + 15 |

---

## Progress Tracker

| Phase | Name | Status | Target |
|-------|------|--------|--------|
| 11A | Dashboard Shell | ✅ Done | Week 1 |
| 11B | Clients CRM | ✅ Done | Week 2–3 |
| 12 | Suppliers + Purchases | ✅ Done | Week 4–5 |
| 13 | Tax Invoices + GST | ☐ | Week 6–7 |
| 14 | Banks + Transactions | ☐ | Week 8–9 |
| 15 | Financial Dashboard Home | ☐ | Week 10 |
| 16 | HR Extensions | ☐ | Week 11–12 |
| 17 | Reports Suite | ☐ | Week 13–14 |

---

## Reference Files

| File | Use |
|------|-----|
| `DASHBOARD_EXECUTION_PLAN.md` | **This file** — locked scope + order |
| `SHAHIN_IMPLEMENTATION_PLAN.md` | Detailed tasks, DB schema, route map |
| `grok-md.md` | Shahin screen reference |
| `PROJECT_TRACKER.md` | File map — update after every change |
| `AGENT.md` | Coding rules |