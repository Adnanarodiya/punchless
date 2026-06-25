# 📄 Statement UI Redesign Plan — Shahin-Style Ledger View

> **Created:** 2026-06-25  
> **Priority:** 🔴 **HIGH — Do before Phase 14 (Banks)**  
> **Status:** ☐ Not started  
> **Goal:** Match the Shahin Motors statement UI (letterhead, entity box, full ledger table, print) for client and supplier statements in Punchless.

---

## Table of Contents

1. [Priority & Placement in Build Order](#1-priority--placement-in-build-order)
2. [Goal & Success Criteria](#2-goal--success-criteria)
3. [Reference Sources](#3-reference-sources)
4. [Current vs Target Comparison](#4-current-vs-target-comparison)
5. [Architecture Decision](#5-architecture-decision)
6. [Implementation Phases](#6-implementation-phases)
7. [Data Model & Query Changes](#7-data-model--query-changes)
8. [UI Component Spec](#8-ui-component-spec)
9. [Visual Mapping (Shahin → Punchless Tokens)](#9-visual-mapping-shahin--punchless-tokens)
10. [Files to Create / Modify](#10-files-to-create--modify)
11. [Build Order & Time Estimate](#11-build-order--time-estimate)
12. [Testing Checklist](#12-testing-checklist)
13. [What Stays Unchanged](#13-what-stays-unchanged)
14. [Deferred (Phase 7 — Optional)](#14-deferred-phase-7--optional)

---

## 1. Priority & Placement in Build Order

### Why this is priority now

Phase 11B (Clients) and Phase 12 (Suppliers) shipped **functional** statements, but the UI is a generic dashboard table — not the printable Shahin-style document workshop owners expect. This is a **high-visibility gap** for daily use (sending statements to clients, printing for records).

### Where it fits

```
Phase 13 ✅ Tax Invoices + GST (done)
    ↓
🔴 STATEMENT UI REDESIGN  ← THIS PLAN (priority insert)
    ↓
Phase 14 ☐ Banks + Transactions
Phase 15 ☐ Financial Dashboard Home
...
```

| Item | Value |
|------|-------|
| **Blocks** | Nothing — can start immediately |
| **Blocked by** | Nothing — ledger + client/supplier data already exist |
| **Estimated effort** | ~4–5 hours (client + supplier + print) |
| **Owner decision** | Finish this before starting Phase 14 |

### Related routes (already live)

| Route | File |
|-------|------|
| `/dashboard/clients/[id]/statement` | `apps/web/src/app/(dashboard)/dashboard/clients/[id]/statement/` |
| `/dashboard/suppliers/[id]/statement` | `apps/web/src/app/(dashboard)/dashboard/suppliers/[id]/statement/` |

---

## 2. Goal & Success Criteria

### Goal

Rebuild client and supplier statement pages to match the Shahin reference:

- Company **letterhead** (gradient banner, name, address, contact, email, logo)
- **"Statement To"** dashed box with entity details + date range
- Full **ledger table** with Shahin columns and row types
- **Opening balance**, **period total**, and **closing balance** rows inside the table
- **Running balance** with `(Due)` / `(Nil B/F)` / `(Advance)` labels and semantic colors
- **Search** filter on table rows
- **Print** outputs a clean document without dashboard chrome (sidebar, filters, breadcrumbs)

### Success criteria (definition of done)

- [ ] Client statement visually matches Shahin layout (see reference image / `SHAHINCLONE`)
- [ ] Supplier statement uses same components with supplier-specific labels
- [ ] Print hides all screen-only UI; only `#printMe` content prints
- [ ] All colors use CSS variables from `globals.css` (no hardcoded `#c0392b`, etc.)
- [ ] New UI components live in `packages/ui/` (shadcn pattern)
- [ ] Company letterhead fields editable in Settings (after migration)
- [ ] `PROJECT_TRACKER.md` updated after each file change
- [ ] Manual testing checklist (Section 12) passed

---

## 3. Reference Sources

### Primary references

| Source | Path | What to copy |
|--------|------|--------------|
| **User screenshot** | Attached in planning session | Full visual target |
| **Live Shahin site** | `https://maturecommerceclasses.com/shahin` | Production statement behavior |
| **SHAHINCLONE — React page** | `D:\Coding\SHAHINCLONE\frontend\src\app\(dashboard)\clients\statement\page.tsx` | Full table structure, search, print |
| **SHAHINCLONE — Letterhead** | `D:\Coding\SHAHINCLONE\frontend\src\components\statements\StatementLetterhead.tsx` | Company banner + entity box |
| **SHAHINCLONE — Balance badge** | `D:\Coding\SHAHINCLONE\frontend\src\components\statements\BalanceBadge.tsx` | Due / Nil / Advance formatting |
| **SHAHINCLONE — Types** | `D:\Coding\SHAHINCLONE\frontend\src\lib\statements.ts` | `BalanceMeta`, row shape, totals |
| **SHAHINCLONE — HTML export** | `D:\Coding\SHAHINCLONE\offline\reports\clientStatement_shahin.html` | Exact print CSS, row colors, column widths |
| **SHAHINCLONE — Screenshot asset** | `D:\Coding\SHAHINCLONE\frontend\public\assets\images\statement.png` | Static reference image |

### Punchless patterns to reuse

| Pattern | Path | Reuse for |
|---------|------|-----------|
| Invoice print route | `apps/web/src/app/(dashboard)/dashboard/invoices/[id]/print/` | Optional dedicated print page + `PrintActions` |
| Statement queries | `apps/web/src/lib/queries/client.queries.ts` | Ledger math (keep logic, enrich rows) |
| Theming rules | `docs/11_THEMING_AND_COLORS.md` | All color decisions |
| UI package rules | `AGENT.md` § UI Components | Component location + exports |

---

## 4. Current vs Target Comparison

### Punchless today (`statement-manager.tsx`)

| Area | Current |
|------|---------|
| Layout | Breadcrumbs + `PageHeader` + 3 summary cards + `DataTable` |
| Header | No letterhead |
| Entity info | None (only page title shows client name) |
| Columns | Date, Particulars, Debit, Credit, Balance |
| Opening balance | Summary card only (not in table) |
| Closing balance | Summary card only (not in table) |
| Period totals | Not shown |
| Balance format | `₹1,00,000` or `₹X Cr` |
| Search | None |
| Print | `window.print()` prints entire dashboard page |
| Invoice / vehicle | Not shown (data exists on invoices, not joined) |
| User column | Not shown |

### Shahin target

| Area | Target |
|------|--------|
| Layout | Two zones: screen controls + printable `#printMe` document |
| Header | Blue gradient company letterhead + optional logo |
| Entity info | Dashed green "Statement To" box (name, contact, GSTIN, address, date range) |
| Columns | #, Invoice No., Vehicle No., Dr (Billed), Cr (Received), Date, Remark, Running Balance, User*, Action* |
| Opening row | Yellow row: "Opening Balance (as of …)" / "Carry Forward" |
| Closing row | Green row: "Closing Balance (as of …)" + Due badge |
| Period totals | Lavender row: "Period Total" with debit/credit sums |
| Balance format | `100,000.00 (Due)` / `(Nil B/F)` / `(Advance)` with color |
| Search | Inline filter on invoice, vehicle, remark, user |
| Print | Only `#printMe` block (filters/nav hidden) |
| Invoice / vehicle | Shown per row when linked to invoice |
| User / Action | Screen only (`print:hidden`); Action deferred to optional phase |

\* User and Action columns are screen-only in v1 print output.

### Backend status

**Ledger calculation is mostly complete.** `getClientStatement()` already provides:

- Opening balance (entries before start date)
- Running balance per line
- Closing balance
- Payment merge logic
- Fully-paid invoice debit hiding

**Gap is UI + enriched row metadata** (invoice number, vehicle, created-by user, period totals, balance status labels).

---

## 5. Architecture Decision

### Two-zone layout (same page)

```
┌─────────────────────────────────────────┐
│  ZONE A — Screen only (print:hidden)    │
│  • Breadcrumbs                          │
│  • Date range filter form               │
│  • Search input                         │
│  • Print button                         │
│  • Optional: "Open printable view" link │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  ZONE B — #printMe (printable document) │
│  • StatementLetterhead (company)        │
│  • StatementEntityBox (client/supplier) │
│  • StatementTable (custom HTML table)   │
│    - Opening row                        │
│    - Data rows                          │
│    - Period total row                   │
│    - Closing row                        │
└─────────────────────────────────────────┘
```

### Print strategy

| Approach | Description | Priority |
|----------|-------------|----------|
| **CSS print (primary)** | `print:hidden` on Zone A; `@media print` rules for full-width table | v1 |
| **Dedicated print route (optional)** | `/dashboard/clients/[id]/statement/print?start=&end=` — minimal chrome, new tab | v1 nice-to-have |
| **printDiv JS (Shahin legacy)** | Replace `document.body.innerHTML` — **do not use**; CSS is cleaner | ❌ Skip |

### Default date range

Use **Indian financial year** default (Shahin behavior):

- **Start:** April 1 of current FY (if today is before April 1, use previous year's April 1)
- **End:** Today

Replace current calendar-month default in `page.tsx`.

### Date display format

Add `formatStatementDate()` → `DD-MMM-YYYY` (e.g. `01-Apr-2025`, `24-Jun-2026`).

---

## 6. Implementation Phases

### Phase 1 — Shared UI components (`packages/ui/`)

**Goal:** Reusable statement primitives used by client + supplier pages.

| # | Component | File | Purpose |
|---|-----------|------|---------|
| 1 | `StatementLetterhead` | `packages/ui/src/components/statement-letterhead.tsx` | Company name, tagline, address, phone, email, logo slot |
| 2 | `StatementEntityBox` | `packages/ui/src/components/statement-entity-box.tsx` | "Statement To" dashed box + entity fields + date range |
| 3 | `BalanceBadge` | `packages/ui/src/components/balance-badge.tsx` | Running balance with status label + semantic color |
| 4 | `StatementToolbar` | `packages/ui/src/components/statement-toolbar.tsx` | Search input + Print button (screen only) |

**Rules:**

- Radix/CVA/cn pattern per `AGENT.md`
- Export all from `packages/ui/src/index.ts`
- Icons from `lucide-react` only (Print → `Printer`, Search → `Search`)
- No hardcoded hex colors

**Done when:** Components render in Storybook-like isolation or a temp test page with mock data.

---

### Phase 2 — Data layer enrichment

**Goal:** Statement queries return everything the Shahin table needs.

#### 2a. New types (`apps/web/src/lib/utils/statement.ts` or shared in queries)

```ts
export type BalanceStatus = "nil" | "due" | "advance";

export type BalanceMeta = {
  amount: number;
  status: BalanceStatus;
  label: string; // "Due" | "Nil B/F" | "Advance"
};

export type StatementLine = {
  id: string;
  index: number;
  entry_date: string;
  remark: string | null;
  reference_type: string | null;
  entry_type: string;
  debit: number;
  credit: number;
  balance: number;
  balance_meta: BalanceMeta;
  invoice_number: string | null;
  vehicle_number: string | null;
  user_name: string | null;
  source: string; // invoice | payment | opening_balance | purchase
};

export type StatementResult = {
  opening: BalanceMeta;
  closing: BalanceMeta;
  totals: { debit: number; credit: number };
  lines: StatementLine[];
};
```

#### 2b. `getBalanceMeta(amount: number): BalanceMeta`

| Condition | Status | Label |
|-----------|--------|-------|
| `amount === 0` (±0.01) | `nil` | `Nil B/F` |
| `amount > 0` | `due` | `Due` |
| `amount < 0` | `advance` | `Advance` |

#### 2c. Query joins (`client.queries.ts`)

When building each line:

| `reference_type` | Join | Fields to add |
|------------------|------|---------------|
| `invoice` | `invoices` via `reference_id` | `invoice_number`, `vehicle_number` |
| `payment` | `client_payments` via `reference_id` | optional receipt ref |
| any | `users` via `created_by` | `full_name` → `user_name` |

Also compute:

- `totals.debit` = sum of period debits
- `totals.credit` = sum of period credits
- `opening` / `closing` as `BalanceMeta`

#### 2d. Mirror for suppliers (`supplier.queries.ts`)

Same structure; join `purchase_invoices` when `reference_type === 'purchase'`:

- `invoice_number` from purchase invoice
- No vehicle column (or omit / show `—`)
- Labels: "Payable" context, "Payment made" instead of "Payment received"

**Done when:** Server page receives full `StatementResult` with all fields populated for test client.

---

### Phase 3 — Company letterhead data (migration + settings)

**Goal:** Letterhead shows real company info, not just `name`.

#### Gap

`companies` table today only has: `id`, `name`, work schedule fields, Stripe fields.

#### Migration: `supabase/migrations/20260625120000_company_profile_fields.sql`

```sql
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS logo_url text;
```

- RLS: owners/admins can update their own company row (verify existing policy covers new columns)
- Run `pnpm db:gen-types` after push

#### Settings UI

Extend:

| File | Change |
|------|--------|
| `settings.queries.ts` | Select new columns |
| `settings.actions.ts` | Update action for new fields |
| `settings-manager.tsx` | Form fields: Tagline, Address, Phone, Email, Logo URL |

**Fallback:** If fields empty, letterhead shows `company.name` only — no crash.

**Done when:** Settings saves and letterhead reads profile on statement page.

---

### Phase 4 — Client statement UI rewrite

**Goal:** Replace `clients/[id]/statement/statement-manager.tsx` with Shahin layout.

#### Zone A (screen only)

- Keep breadcrumbs + date filter (Indian FY defaults from server)
- Add `StatementToolbar` with search
- Search filters: `invoice_number`, `vehicle_number`, `remark`, `user_name`
- Print button → `window.print()`
- Optional: Link to `/statement/print?start=&end=` in new tab

#### Zone B (`#printMe`)

1. `StatementLetterhead` — company profile from settings
2. `StatementEntityBox` — client `name`, `contact`, `gst_number`, `address`, date range
3. Custom `<table>` (NOT `DataTable`) with columns:

| # | Column | Width hint | Print |
|---|--------|------------|-------|
| 1 | # | 4% | ✅ |
| 2 | Invoice No. | 12% | ✅ |
| 3 | Vehicle No. | 12% | ✅ |
| 4 | Dr (Billed) | 10% | ✅ |
| 5 | Cr (Received) | 10% | ✅ |
| 6 | Date | 10% | ✅ |
| 7 | Remark | 15% | ✅ |
| 8 | Running Balance | 12% | ✅ |
| 9 | User | 5% | ❌ `print:hidden` |
| 10 | Action | 5% | ❌ `print:hidden` (defer delete wiring) |

#### Special rows

| Row | Class / token | Content |
|-----|---------------|---------|
| **Opening** | `bg-warning/10` italic | Colspan 3 right-aligned: "Opening Balance (as of {date})" · Dr/Cr `—` · Remark "Carry Forward" · `BalanceBadge` for opening |
| **Data** | normal | Index, invoice, vehicle, red debit, green credit, date, remark, balance badge |
| **Period Total** | `bg-muted` bold | Colspan 3 "Period Total" · debit sum · credit sum |
| **Closing** | `bg-success/10` bold | "Closing Balance (as of {date})" · Due badge center · `BalanceBadge` for closing |

**Done when:** Client statement matches reference screenshot; print output is clean.

---

### Phase 5 — Supplier statement (parallel)

**Goal:** Same components, supplier-specific copy.

| Client label | Supplier label |
|--------------|----------------|
| Statement To (client) | Statement To (supplier) |
| Invoice No. | Purchase No. |
| Vehicle No. | *(hidden or `—`)* |
| Dr (Billed) | Dr (Purchases) or keep Dr |
| Cr (Received) | Cr (Paid) |
| Due | Payable |
| Opening Payable | Opening Payable |
| Closing Payable | Closing Payable |

File: `suppliers/[id]/statement/statement-manager.tsx`

**Done when:** Supplier statement visually consistent with client statement.

---

### Phase 6 — Print polish

**Goal:** Professional A4 print output.

#### CSS additions (`apps/web/src/app/globals.css`)

```css
@media print {
  /* Hide dashboard shell */
  nav, aside, .print\:hidden { display: none !important; }

  /* Full-width statement */
  #printMe { width: 100%; border: none; box-shadow: none; }

  /* Table borders visible */
  .statement-table th, .statement-table td { border: 1px solid hsl(var(--border)); }
}
```

Optional statement-specific tokens:

```css
--statement-opening: /* yellow tint */;
--statement-closing: /* green tint */;
--statement-total: /* lavender tint */;
--statement-header-from: /* letterhead gradient start */;
--statement-header-to: /* letterhead gradient end */;
```

#### Optional print route

`apps/web/src/app/(dashboard)/dashboard/clients/[id]/statement/print/page.tsx`

- Minimal layout (no sidebar — use route group or `(print)` layout)
- Same `#printMe` content
- `PrintActions` component (Back + Print)
- Mirror for suppliers

**Done when:** Printed PDF looks like Shahin export (no sidebar, no filters).

---

### Phase 7 — Optional enhancements (deferred)

| Feature | Shahin | Punchless v1 | Future |
|---------|--------|--------------|--------|
| Delete row from statement | ✅ | ☐ Defer | Wire to `invoice.actions` / `client.actions` delete |
| FY picker shortcuts | Implicit | Default Apr 1 | Add "This FY" / "Last FY" buttons |
| Excel export | ❌ | ☐ Skip | Phase 17 Reports |
| Staff statement | ✅ | ☐ Skip | Phase 16 HR Extensions |
| Bank statement | ✅ | ☐ Skip | Phase 14 Banks |

---

## 7. Data Model & Query Changes

### No new ledger tables required

Existing tables are sufficient for v1:

| Table | Used for |
|-------|----------|
| `ledger_entries` | All statement lines |
| `invoices` | Invoice no. + vehicle on client debits |
| `client_payments` | Payment metadata |
| `purchase_invoices` | Purchase no. on supplier credits |
| `supplier_payments` | Supplier payment metadata |
| `clients` / `suppliers` | Entity box fields |
| `users` | "User" column (`created_by`) |
| `companies` | Letterhead (after migration) |

### Company profile migration (only new schema change)

See Phase 3 migration SQL.

### Query performance note

For v1, batch-fetch invoices/payments/users by `reference_id` set after loading ledger rows — avoid N+1 per row. Typical client has <500 entries per FY.

---

## 8. UI Component Spec

### `StatementLetterhead`

**Props:**

```ts
type StatementLetterheadProps = {
  companyName: string;
  tagline?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
};
```

**Layout:** Centered gradient banner → company name (large, letter-spaced) → optional logo → tagline/address → contact row.

---

### `StatementEntityBox`

**Props:**

```ts
type StatementEntityBoxProps = {
  title: string; // "Statement To"
  lines: { label: string; value: string }[];
  startDate: string;
  endDate: string;
};
```

**Layout:** Right-aligned (or full-width on mobile), dashed border (`border-success border-dashed`), small text, bold labels.

---

### `BalanceBadge`

**Props:**

```ts
type BalanceBadgeProps = {
  balance: BalanceMeta;
};
```

**Rendering:**

| Status | Color class | Example |
|--------|-------------|---------|
| `nil` | `text-muted-foreground` | `0.00 (Nil B/F)` |
| `due` | `text-destructive` | `100,000.00 (Due)` |
| `advance` | `text-success` | `5,000.00 (Advance)` |

---

### `StatementToolbar`

**Props:**

```ts
type StatementToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onPrint: () => void;
  printHref?: string; // optional new-tab print route
};
```

---

## 9. Visual Mapping (Shahin → Punchless Tokens)

| Shahin element | Hex (reference) | Punchless token |
|----------------|-------------------|-----------------|
| Blue gradient header | `#6190e8` → `#a7cde8` | `--statement-header-from/to` or `bg-primary` gradient |
| Red debit amounts | `#c0392b` | `text-destructive` |
| Green credit amounts | `#27ae60` | `text-success` |
| Yellow opening row | `#fffbe6` | `bg-warning/10` |
| Green closing row | `#e8f5e9` | `bg-success/10` |
| Lavender period total | `#e8eaf6` | `bg-muted` |
| Red Due badge | `#e74c3c` | `bg-destructive text-destructive-foreground` |
| Dashed green entity box | `border-color: green` | `border-success border-dashed` |
| Gray nil balance | `#95a5a6` | `text-muted-foreground` |

**Rule:** Never use raw Tailwind colors (`text-red-600`, `bg-blue-500`). See `docs/11_THEMING_AND_COLORS.md`.

---

## 10. Files to Create / Modify

### Create

| File | Phase |
|------|-------|
| `docs/12_STATEMENT_UI_PLAN.md` | — (this file) |
| `packages/ui/src/components/statement-letterhead.tsx` | 1 |
| `packages/ui/src/components/statement-entity-box.tsx` | 1 |
| `packages/ui/src/components/balance-badge.tsx` | 1 |
| `packages/ui/src/components/statement-toolbar.tsx` | 1 |
| `apps/web/src/lib/utils/statement.ts` | 2 |
| `supabase/migrations/20260625120000_company_profile_fields.sql` | 3 |
| `apps/web/src/app/(dashboard)/dashboard/clients/[id]/statement/print/page.tsx` | 6 (optional) |
| `apps/web/src/app/(dashboard)/dashboard/clients/[id]/statement/print/print-actions.tsx` | 6 (optional) |
| `apps/web/src/app/(dashboard)/dashboard/suppliers/[id]/statement/print/page.tsx` | 6 (optional) |

### Modify

| File | Phase | Change |
|------|-------|--------|
| `packages/ui/src/index.ts` | 1 | Export new components |
| `apps/web/src/lib/queries/client.queries.ts` | 2 | Enriched `StatementLine`, totals, `BalanceMeta` |
| `apps/web/src/lib/queries/supplier.queries.ts` | 2 | Same for suppliers |
| `apps/web/src/lib/utils/formatting.ts` | 2 | Add `formatStatementDate()` |
| `apps/web/src/lib/queries/settings.queries.ts` | 3 | Company profile fields |
| `apps/web/src/lib/actions/settings.actions.ts` | 3 | Save profile fields |
| `apps/web/src/app/(dashboard)/dashboard/settings/settings-manager.tsx` | 3 | Profile form UI |
| `apps/web/src/app/(dashboard)/dashboard/clients/[id]/statement/page.tsx` | 4 | FY default dates, pass company profile |
| `apps/web/src/app/(dashboard)/dashboard/clients/[id]/statement/statement-manager.tsx` | 4 | Full UI rewrite |
| `apps/web/src/app/(dashboard)/dashboard/suppliers/[id]/statement/page.tsx` | 5 | FY defaults + enriched data |
| `apps/web/src/app/(dashboard)/dashboard/suppliers/[id]/statement/statement-manager.tsx` | 5 | Full UI rewrite |
| `apps/web/src/app/globals.css` | 6 | Print rules + statement tokens |
| `packages/types/src/database.types.ts` | 3 | Regenerate after migration |
| `PROJECT_TRACKER.md` | all | Track every file change |
| `DOCS_INDEX.md` | — | Add this doc |
| `DASHBOARD_EXECUTION_PLAN.md` | — | Priority insert note |
| `NEW_START.md` | — | Point to this plan as current priority |

---

## 11. Build Order & Time Estimate

Execute in this exact order:

```
Step 1  Phase 3 migration + Settings profile fields     ~30 min
Step 2  Phase 1 shared UI components in packages/ui    ~45 min
Step 3  Phase 2 enrich client.queries + supplier.queries ~45 min
Step 4  Phase 4 rewrite client statement-manager        ~1 hr
Step 5  Phase 5 rewrite supplier statement-manager      ~45 min
Step 6  Phase 6 print CSS + optional print routes       ~30 min
Step 7  Manual testing (Section 12)                     ~15 min
────────────────────────────────────────────────────────────────
Total                                                   ~4–5 hrs
```

> **Note:** Migration (Step 1) is listed first because letterhead needs company fields, but UI components (Step 2) can be built in parallel with mock data if needed.

### Per-step checklist

| Step | Phase | Status |
|------|-------|--------|
| 1 | Phase 3 — Company profile migration + Settings | ☐ |
| 2 | Phase 1 — Shared UI components | ☐ |
| 3 | Phase 2 — Query enrichment | ☐ |
| 4 | Phase 4 — Client statement UI | ☐ |
| 5 | Phase 5 — Supplier statement UI | ☐ |
| 6 | Phase 6 — Print polish | ☐ |
| 7 | Testing | ☐ |

---

## 12. Testing Checklist

### Setup

- [ ] Company profile filled in Settings (name, address, phone, email)
- [ ] Test client with: opening balance, at least 1 invoice (with vehicle), at least 1 payment
- [ ] Test supplier with: opening balance, purchase, payment

### Client statement

- [ ] Default date range = current FY (Apr 1 → today)
- [ ] Letterhead shows company info from Settings
- [ ] "Statement To" box shows client name, contact, GST, address
- [ ] Opening row shows correct carry-forward balance + `(Nil B/F)` or `(Due)`
- [ ] Invoice row shows invoice number + vehicle number
- [ ] Payment row shows credit in green
- [ ] Running balance updates correctly row by row
- [ ] Period Total row sums debits and credits correctly
- [ ] Closing row shows Due badge when balance > 0
- [ ] Search filters rows by invoice / vehicle / remark
- [ ] Print: no sidebar, no filters, no User/Action columns
- [ ] Print: table fits A4 reasonably

### Supplier statement

- [ ] Same layout as client with supplier labels
- [ ] Purchase invoice number appears in Purchase No. column
- [ ] Payable terminology correct

### Regression

- [ ] Existing ledger math unchanged (compare closing balance before/after UI change)
- [ ] Date filter still works via URL params `?start=&end=`

---

## 13. What Stays Unchanged

| Item | Reason |
|------|--------|
| `getClientStatement()` core ledger logic | Already correct — payment merge, paid invoice hiding |
| Route URLs | `/dashboard/clients/[id]/statement` unchanged |
| `ledger_entries` schema | No new tables for v1 |
| `DataTable` on other pages | Only statement pages switch to custom table |
| Delete-from-statement actions | Deferred to Phase 7 |
| Mobile app | Out of scope |
| Stripe / billing | Out of scope |

---

## 14. Deferred (Phase 7 — Optional)

### Delete row from statement (Shahin has this)

Requires:

- Confirm modal (`ConfirmModal` from `@punchless/ui`)
- Server action: delete invoice or payment by `source` + `id`
- Refresh statement after delete
- Hide delete for `opening_balance` rows

### Staff & bank statements

Built in later phases:

| Statement | Phase | Route (planned) |
|-----------|-------|-----------------|
| Staff | 16 | `/dashboard/employees/[id]/statement` |
| Bank | 14 | `/dashboard/banks/[id]/statement` |

Reuse the same `packages/ui` statement components when those phases start.

---

## Quick Reference — Shahin Table Row HTML Structure

For implementers copying from `clientStatement_shahin.html`:

```html
<!-- Opening -->
<tr class="row-ob">
  <td colspan="3">Opening Balance (as of DD-MMM-YYYY)</td>
  <td>—</td><td>—</td><td>—</td>
  <td>Carry Forward</td>
  <td>0.00 (Nil B/F)</td>
</tr>

<!-- Data row -->
<tr>
  <td>1</td>
  <td>INV-001</td>
  <td>GJ-01-AB-1234</td>
  <td>debit</td><td>credit</td>
  <td>20-Jun-2026</td>
  <td>Remark</td>
  <td>balance (Due)</td>
</tr>

<!-- Period total -->
<tr>
  <td colspan="3">Period Total</td>
  <td>debit sum</td><td>credit sum</td>
  <td colspan="3"></td>
</tr>

<!-- Closing -->
<tr class="row-cb">
  <td colspan="3">Closing Balance (as of DD-MMM-YYYY)</td>
  <td colspan="4"><span class="due-badge">Due: ₹X</span></td>
  <td>balance (Due)</td>
</tr>
```

Translate to React + Tailwind v4 + CSS variables per Section 9.

---

*End of plan. Start with Phase 3 migration or Phase 1 components — see Section 11.*