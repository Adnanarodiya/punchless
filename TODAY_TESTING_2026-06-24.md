# Today's Work — Testing Guide (2026-06-24)

> **Scope:** Phase 13 (Tax Invoices + GST) + ledger/statement fixes  
> **Remaining phases (14–17):** Start tomorrow  
> **Stripe (Phase 10):** Skipped

---

## What we completed today

### Phase 13 — Tax Invoices + GST
- Database: `invoices`, `invoice_line_items`, jobs `vehicle_number` / `client_id`
- Route: `/dashboard/invoices` — full CRUD
- GST slabs: 0%, 5%, 12%, 18%, 28%
- Payment modes: Cash, Bank, Credit, Split (cash + bank can exceed invoice to clear older dues)
- Auto invoice number: `INV-2026-0001` style
- Print view: `/dashboard/invoices/[id]/print`
- Invoice → `ledger_entries` (Shahin-style net posting)
- Sidebar + dashboard quick action wired

### Fixes after first testing
- **Shahin net ledger:** Fully paid invoice = credit only (reduces client due). Unpaid = debit only.
- **Split overpayment:** Cash/bank can be more than invoice total (clears older client dues).
- **Client statement:** Hides stale ₹0 invoice rows, merges cash+bank into one line, auto-cleanup on load.
- **RLS:** Admin can delete ledger entries (invoice resync on edit).
- **Print:** Remark field now shows on printed invoice.

### Migrations pushed today
- `20260624160000_tax_invoices.sql`
- `20260624180000_fix_ledger_delete_policy.sql`

---

## Before you test

```bash
# From project root
pnpm dev
```

1. Log in as **owner** or **admin**
2. You need at least **one client** with an opening balance (for ledger tests)
3. Hard refresh browser after code changes: **Ctrl + Shift + R**

---

## Test 1 — Create a client (if needed)

| Step | Action |
|------|--------|
| 1 | Go to **Commerce → Clients** (`/dashboard/clients`) |
| 2 | Add client: name, contact, opening balance e.g. **₹1,00,000** |
| 3 | Save |

**Expected:** Client appears in list with due = opening balance.

---

## Test 2 — Credit invoice (unpaid)

| Step | Action |
|------|--------|
| 1 | Go to **Commerce → Invoices** (`/dashboard/invoices`) |
| 2 | **New Invoice** |
| 3 | Client: pick test client |
| 4 | Description: e.g. `Engine repair` |
| 5 | Taxable amount: **₹10,000**, GST: **18%** |
| 6 | Payment mode: **Credit (full due)** |
| 7 | Save |

**Expected:**
- Invoice in table; total ≈ **₹11,800**
- **Clients** → client due **increased** by ₹11,800
- **Client statement** → one **debit** line for invoice, balance up

---

## Test 3 — Cash invoice (fully paid)

| Step | Action |
|------|--------|
| 1 | New invoice, same client |
| 2 | Taxable: **₹5,000**, GST: **18%** → total **₹5,900** |
| 3 | Payment mode: **Cash (full)** |
| 4 | Save |

**Expected:**
- Client due **decreases** by ₹5,900 (payment received)
- Statement shows **one credit line** (no separate ₹0 invoice debit row)
- No balance “jump up then down” on statement

---

## Test 4 — Split payment (cash + bank)

| Step | Action |
|------|--------|
| 1 | New invoice |
| 2 | Taxable: **₹1,00,000**, GST: **18%** → total **₹1,18,000** |
| 3 | Payment mode: **Split** |
| 4 | Cash: **₹18,000**, Bank: **₹1,00,000** |
| 5 | Save |

**Expected:**
- Preview shows net due change **₹0** for this invoice
- Statement: **one line** — `Tax invoice #… — paid (cash + bank)` | Credit **₹1,18,000**
- **No** ghost row `Tax Invoice #… | Invoice | ₹0`

---

## Test 5 — Split overpayment (clear older dues)

Use a client with **high opening due** (e.g. ₹5,78,940).

| Step | Action |
|------|--------|
| 1 | New invoice, taxable **₹1,00,000**, GST 18% → total **₹1,18,000** |
| 2 | Payment mode: **Split** |
| 3 | Cash: **₹18,000**, Bank: **₹1,00,000** (full invoice paid) |
| 4 | Or enter **more** cash than invoice to clear old dues (if testing overpayment) |
| 5 | Save |

**Expected:**
- Closing due = opening + all unpaid invoices − all payments
- Statement math: each credit **subtracts** from balance
- Form preview shows **Excess payment** if cash+bank > invoice total

---

## Test 6 — Edit invoice (ledger resync)

| Step | Action |
|------|--------|
| 1 | Open **Invoices** → edit an existing invoice |
| 2 | Change amount or payment mode |
| 3 | **Save** |

**Expected:**
- Client due updates to match new totals
- Statement rows update (old junk rows removed on refresh)
- If save fails with ledger error → log in as **owner** once and retry

---

## Test 7 — Print invoice + remark

| Step | Action |
|------|--------|
| 1 | Create/edit invoice with **Remark** e.g. `Warranty 6 months` |
| 2 | Click **Print** (printer icon) or open `/dashboard/invoices/[id]/print` |
| 3 | Check layout; click **Print** |

**Expected:**
- Line items / description in table
- **Remark** box above payment footer (only if remark filled)
- Payment breakdown: Cash / Bank / Credit
- Sidebar hidden when printing

---

## Test 8 — Soft delete invoice

| Step | Action |
|------|--------|
| 1 | Delete an invoice from list |
| 2 | Refresh client statement |

**Expected:**
- Invoice hidden from list
- Ledger entries for that invoice removed
- Client due recalculated

---

## Test 9 — Quick actions & navigation

| Step | Action |
|------|--------|
| 1 | Dashboard home → **Quick Actions** → **Invoices** |
| 2 | Sidebar **Commerce → Invoices** |

**Expected:** Both open `/dashboard/invoices`.

---

## Test 10 — Client statement (regression)

| Step | Action |
|------|--------|
| 1 | **Clients** → client name → **Statement** (or `/dashboard/clients/[id]/statement`) |
| 2 | Set date range covering invoice dates → **Apply** |
| 3 | Refresh page (cleanup runs on load) |

**Expected:**
- Opening balance row (if in period)
- Invoice payments as credits (merged if cash+bank)
- **No** `Tax Invoice #… | ₹0` ghost row
- Closing balance = Current due (for full history)
- Negative balance shows as `₹X Cr` if overpaid

---

## If something looks wrong

| Issue | Fix |
|-------|-----|
| Old ₹0 invoice row still visible | Hard refresh statement page; or edit invoice → Save |
| Due amount wrong | Edit invoice → Save (resyncs ledger) |
| Admin can’t resync ledger | Owner must save once (RLS was fixed; old data may need one resync) |
| Remark missing on print | Ensure **Remark** field filled (not only Description) |

---

## Not in today’s scope (tomorrow+)

| Phase | What |
|-------|------|
| **14** | Banks, bank transactions, transfers, income/expense |
| **15** | Financial dashboard home (income, expense, cash, bank cards) |
| **16** | Posts, staff payments, salary deposits |
| **17** | Reports suite (daily, monthly, GST, Rojmel, Excel) |
| — | Mobile app polish (after 14–17) |
| — | Phase 18 admin / audit log (deferred) |

**Tomorrow:** Say **"start Phase 14"** for Banks + Transactions.

---

## Files touched today (reference)

| Area | Files |
|------|--------|
| DB | `supabase/migrations/20260624160000_tax_invoices.sql`, `20260624180000_fix_ledger_delete_policy.sql` |
| Backend | `invoice.actions.ts`, `invoice.queries.ts`, `invoice.schema.ts`, `client.queries.ts` |
| UI | `invoices/page.tsx`, `invoice-manager.tsx`, `invoices/[id]/print/page.tsx` |
| Nav | `sidebar-config.ts`, `dashboard-quick-actions.tsx` |
| Docs | `PROJECT_TRACKER.md`, `docs/05_DATABASE_SCHEMA.md`, `SHAHIN_IMPLEMENTATION_PLAN.md`, `NEW_START.md` |

---

*Happy testing — report any failing step with screenshot + invoice number (e.g. INV-2026-0003).*