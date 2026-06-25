# Phase 14 — Banks + Transactions — Full Testing Plan

> **Scope:** Phase 14 only — bank accounts, deposits/withdrawals, transfers, income/expense  
> **Company:** Shahin Motors (dummy data below)  
> **Test date:** 25 Jun 2026 (use this date on all entries for easy statement checks)

---

## Before you start

```bash
# From project root
pnpm dev
```

1. Log in as **owner** or **admin**
2. Hard refresh after code changes: **Ctrl + Shift + R**
3. Run tests **in order** — later steps depend on earlier balances
4. Use the **exact dummy values** below so expected balances match

---

## Dummy bank accounts (create both first)

### Bank A — Kotak Mahindra (primary)

| Field | Dummy value |
|-------|-------------|
| Bank Name | `Kotak Mahindra` |
| A/C Name | `Shahin Motors Pvt Ltd` |
| A/C Number | `2847561230` |
| IFSC | `KKBK0000811` |
| Opening Balance | `200000` |

**Label in UI:** Kotak Mahindra — Shahin Motors Pvt Ltd

---

### Bank B — HDFC Bank (secondary)

| Field | Dummy value |
|-------|-------------|
| Bank Name | `HDFC Bank` |
| A/C Name | `Shahin Motors Operating` |
| A/C Number | `50100234567890` |
| IFSC | `HDFC0001234` |
| Opening Balance | `75000` |

**Label in UI:** HDFC Bank — Shahin Motors Operating

---

## Master checklist

| # | Test | Route | Pass? |
|---|------|-------|-------|
| 1 | Create Bank A (Kotak) | `/dashboard/banks` | ☐ |
| 2 | Create Bank B (HDFC) | `/dashboard/banks` | ☐ |
| 3 | Verify summary cards | `/dashboard/banks` | ☐ |
| 4 | Deposit on Kotak | `/dashboard/banks/transactions` | ☐ |
| 5 | Withdraw from Kotak | `/dashboard/banks/transactions` | ☐ |
| 6 | Bank transfer Kotak → HDFC | `/dashboard/banks/transfer` | ☐ |
| 7 | Cash expense | `/dashboard/transactions` | ☐ |
| 8 | Bank expense (Kotak) | `/dashboard/transactions` | ☐ |
| 9 | Cash income | `/dashboard/transactions` | ☐ |
| 10 | Bank income (HDFC) | `/dashboard/transactions` | ☐ |
| 11 | Kotak statement | `/dashboard/banks/[id]/statement` | ☐ |
| 12 | HDFC statement | `/dashboard/banks/[id]/statement` | ☐ |
| 13 | Edit bank (no balance change) | `/dashboard/banks` | ☐ |
| 14 | Soft delete + recover | `/dashboard/banks` | ☐ |
| 15 | Delete income/expense entry | `/dashboard/transactions` | ☐ |

---

## Running balance tracker (fill as you go)

| Step | Kotak balance | HDFC balance |
|------|---------------|--------------|
| After Bank A created | ₹2,00,000 | — |
| After Bank B created | ₹2,00,000 | ₹75,000 |
| After deposit (+₹25,000) | ₹2,25,000 | ₹75,000 |
| After withdraw (−₹10,000) | ₹2,15,000 | ₹75,000 |
| After transfer (−₹20,000 / +₹20,000) | ₹1,95,000 | ₹95,000 |
| After bank expense (−₹12,000 Kotak) | ₹1,83,000 | ₹95,000 |
| After bank income (+₹15,000 HDFC) | ₹1,83,000 | ₹1,10,000 |

**Total bank balance (both):** ₹2,93,000

---

## Test 1 — Create Bank A (Kotak)

| Step | Action |
|------|--------|
| 1 | Go to **Finance → Banks** (`/dashboard/banks`) |
| 2 | Click **New Bank** |
| 3 | Enter **Bank A** dummy values from table above |
| 4 | Save |

**Expected:**
- Toast: `Bank account created!`
- Table row: Kotak Mahindra, A/C `2847561230`, Opening **₹2,00,000**, Current **₹2,00,000**
- Summary: **Active Banks = 1**, **Total Bank Balance = ₹2,00,000**

---

## Test 2 — Create Bank B (HDFC)

| Step | Action |
|------|--------|
| 1 | Still on **Banks** |
| 2 | **New Bank** → enter **Bank B** dummy values |
| 3 | Save |

**Expected:**
- **Active Banks = 2**
- **Total Bank Balance = ₹2,75,000** (2,00,000 + 75,000)
- Kotak **₹2,00,000** · HDFC **₹75,000**

---

## Test 3 — Navigation & links (3 different pages)

> **Prerequisite:** Test 1 + Test 2 done — you must see **2 rows** on the Banks list (Kotak + HDFC).  
> If you only have HDFC, go back and create Kotak first (Test 1).

This test checks buttons and links work. You visit **3 pages** in order:

```
/dashboard/banks          ← main list (START HERE)
/dashboard/banks/transactions
/dashboard/banks/transfer ← your screenshot is this page (step 2 only)
/dashboard/banks/[id]/statement
```

### Part A — From the main Banks list

**Start at:** Sidebar → **Finance → Banks** → URL must be `/dashboard/banks`

You should see a **table with 2 banks** (Kotak + HDFC) and 3 buttons top-right: **Transactions**, **Transfer**, **New Bank**.

| Step | Where you are | Action |
|------|---------------|--------|
| 1 | `/dashboard/banks` | Click **Transactions** (top right) |
| | | URL changes to `/dashboard/banks/transactions` — deposit/withdraw form |
| 2 | transactions page | Click **← Back to Banks** (top right) |
| | | Returns to `/dashboard/banks` |
| 3 | `/dashboard/banks` | Click **Transfer** (top right) |
| | | URL changes to `/dashboard/banks/transfer` — *this is your screenshot* |

### Part B — Back to list for Statement + Search

| Step | Where you are | Action |
|------|---------------|--------|
| 4 | `/dashboard/banks/transfer` | Click **← Back to Banks** |
| | | Returns to `/dashboard/banks` (table with 2 rows) |
| 5 | `/dashboard/banks` | On the **Kotak** row → click the **document/Statement** icon (Actions column) |
| | | Opens `/dashboard/banks/[kotak-id]/statement` |
| 6 | statement page | Use breadcrumb **Banks** or browser back → return to list |
| 7 | `/dashboard/banks` | In the **Search banks…** box above the table, type `HDFC` |
| | | Only the HDFC row stays visible; Kotak is hidden |
| 8 | same | Clear search → both rows show again |

**Expected:**
- Every link opens the correct page (no 404)
- Statement opens for Kotak specifically
- Search filters the **bank list table**, not the transfer dropdowns

**Not part of Test 3:** The transfer form dropdowns (From Bank / To Bank) are a different screen — search box is only on the main Banks list page.

---

## Test 4 — Deposit (Kotak)

**Route:** `/dashboard/banks/transactions`

| Field | Dummy value |
|-------|-------------|
| Bank | Kotak Mahindra — Shahin Motors Pvt Ltd |
| Type | **Deposit** |
| Amount | `25000` |
| Date | `2026-06-25` |
| Remark | `Client payment collection — INV batch` |

**Expected:**
- Toast: `Bank transaction recorded!`
- History table: Kotak · Deposit · **₹25,000** · 25 Jun 2026
- **Banks** page → Kotak current balance **₹2,25,000**

---

## Test 5 — Withdraw (Kotak)

| Field | Dummy value |
|-------|-------------|
| Bank | Kotak Mahindra |
| Type | **Withdraw** |
| Amount | `10000` |
| Date | `2026-06-25` |
| Remark | `Petty cash for workshop` |

**Expected:**
- Kotak balance **₹2,15,000**
- History shows Withdraw **₹10,000**

---

## Test 6 — Bank transfer (Kotak → HDFC)

**Route:** `/dashboard/banks/transfer`

| Field | Dummy value |
|-------|-------------|
| From Bank | Kotak Mahindra — ₹2,15,000 |
| To Bank | HDFC Bank — Shahin Motors Operating |
| Amount | `20000` |
| Date | `2026-06-25` |
| Remark | `Fund operating account` |

**Expected:**
- Toast: `Bank transfer recorded!`
- Transfer history: Kotak → HDFC · **₹20,000**
- Kotak **₹1,95,000** · HDFC **₹95,000**
- Total bank balance still **₹2,75,000** (money moved, not lost)

**Negative test (optional):**
- Try same bank in From and To → validation should block (needs 2 different banks)

---

## Test 7 — Cash expense

**Route:** `/dashboard/transactions`

| Field | Dummy value |
|-------|-------------|
| Particular | `Workshop electricity bill` |
| Amount | `3500` |
| Type | **Expense** |
| Payment Mode | **Cash** |
| Date | `2026-06-25` |
| Remark | `Bardoli branch — June` |

**Expected:**
- Summary cards: **Total Expense = ₹3,500**
- Table row: Expense · Cash · ₹3,500
- **Kotak/HDFC balances unchanged** (cash only — no bank ledger)

---

## Test 8 — Bank expense (Kotak)

| Field | Dummy value |
|-------|-------------|
| Particular | `Spare parts — brake pads bulk` |
| Amount | `12000` |
| Type | **Expense** |
| Payment Mode | **Bank** |
| Bank | Kotak Mahindra |
| Date | `2026-06-25` |
| Remark | `Supplier payment via NEFT` |

**Expected:**
- **Total Expense = ₹15,500** (3,500 + 12,000)
- Kotak balance **₹1,83,000** (1,95,000 − 12,000)
- HDFC unchanged **₹95,000**

---

## Test 9 — Cash income

| Field | Dummy value |
|-------|-------------|
| Particular | `Scrap metal sale` |
| Amount | `8000` |
| Type | **Income** |
| Payment Mode | **Cash** |
| Date | `2026-06-25` |
| Remark | `Old engine blocks` |

**Expected:**
- **Total Income = ₹8,000**
- **Net Balance = ₹4,500** (8,000 − 3,500)
- Bank balances unchanged

---

## Test 10 — Bank income (HDFC)

| Field | Dummy value |
|-------|-------------|
| Particular | `Insurance claim refund` |
| Amount | `15000` |
| Type | **Income** |
| Payment Mode | **Bank** |
| Bank | HDFC Bank |
| Date | `2026-06-25` |
| Remark | `Vehicle insurance — claim #INS-4421` |

**Expected:**
- **Total Income = ₹23,000**
- **Total Expense = ₹15,500**
- **Net Balance = ₹7,500**
- HDFC balance **₹1,10,000** (95,000 + 15,000)
- Kotak still **₹1,83,000**

---

## Test 11 — Kotak bank statement

**Route:** Banks → Kotak row → **Statement** icon  
**Date range:** `2026-06-01` to `2026-06-25`

**Expected lines (in order):**

| Particulars | Deposit | Withdraw | Balance |
|-------------|---------|----------|---------|
| Opening balance | ₹2,00,000 | — | ₹2,00,000 |
| Client payment collection… | — | — | (deposit row) |
| Bank deposit | ₹25,000 | — | ₹2,25,000 |
| Petty cash for workshop | — | ₹10,000 | ₹2,15,000 |
| Fund operating account — sent | — | ₹20,000 | ₹1,95,000 |
| Spare parts — brake pads… | — | ₹12,000 | ₹1,83,000 |

**Summary cards:**
- Opening Balance **₹0** (nothing before 1 Jun)
- Closing Balance **₹1,83,000**
- Current Balance **₹1,83,000** (must match closing)

**Print:** Click Print → layout readable, no sidebar clutter.

---

## Test 12 — HDFC bank statement

**Date range:** `2026-06-01` to `2026-06-25`

**Expected lines:**

| Particulars | Deposit | Withdraw | Balance |
|-------------|---------|----------|---------|
| Opening balance | ₹75,000 | — | ₹75,000 |
| Fund operating account — received | ₹20,000 | — | ₹95,000 |
| Insurance claim refund… | ₹15,000 | — | ₹1,10,000 |

**Summary:**
- Closing = Current = **₹1,10,000**

---

## Test 13 — Edit bank (metadata only)

| Step | Action |
|------|--------|
| 1 | **Banks** → Edit Kotak |
| 2 | Change A/C Name to `Shahin Motors — Main Account` |
| 3 | Save |

**Expected:**
- Name updates in table
- **Balance unchanged** (₹1,83,000)
- Opening balance field not editable on edit (hidden)

---

## Test 14 — Soft delete + recover

| Step | Action |
|------|--------|
| 1 | **Deleted** tab → empty |
| 2 | Soft-delete **HDFC** (trash icon) |
| 3 | **Deleted** tab → HDFC appears |
| 4 | **Active Banks = 1**, Total balance **₹1,83,000** (Kotak only) |
| 5 | Recover HDFC |

**Expected:**
- After recover: **Active Banks = 2**, HDFC balance back to **₹1,10,000**
- Total **₹2,93,000**

---

## Test 15 — Delete transaction entry

| Step | Action |
|------|--------|
| 1 | **Transactions** → delete `Scrap metal sale` (₹8,000 cash income) |
| 2 | Confirm toast |

**Expected:**
- Income drops to **₹15,000** (23,000 − 8,000)
- Net (Income − Expense) **−₹500** (15,000 − 15,500) — not bank balance
- Bank balances **unchanged**

> If you delete **all** income rows, only expenses remain → Net shows **−₹15,500** (₹0 − ₹15,500). That is correct. Kotak **₹1,83,000** is on the **Banks** page.

---

## Dummy data quick reference (copy-paste)

### All income/expense entries

| # | Particular | Type | Mode | Bank | Amount | Remark |
|---|------------|------|------|------|--------|--------|
| 1 | Workshop electricity bill | Expense | Cash | — | 3500 | Bardoli branch — June |
| 2 | Spare parts — brake pads bulk | Expense | Bank | Kotak | 12000 | Supplier payment via NEFT |
| 3 | Scrap metal sale | Income | Cash | — | 8000 | Old engine blocks |
| 4 | Insurance claim refund | Income | Bank | HDFC | 15000 | Claim #INS-4421 |

### All bank transactions

| # | Bank | Type | Amount | Remark |
|---|------|------|--------|--------|
| 1 | Kotak | Deposit | 25000 | Client payment collection — INV batch |
| 2 | Kotak | Withdraw | 10000 | Petty cash for workshop |

### Transfer

| From | To | Amount | Remark |
|------|-----|--------|--------|
| Kotak | HDFC | 20000 | Fund operating account |

---

## Final expected state (all tests passed)

| Metric | Value |
|--------|-------|
| Kotak current balance | **₹1,83,000** |
| HDFC current balance | **₹1,10,000** |
| Total bank balance | **₹2,93,000** |
| Transactions — income | **₹15,000** (if Test 15 done) or **₹23,000** |
| Transactions — expense | **₹15,500** |
| Transactions — net | **−₹500** or **₹7,500** |

---

## Common issues & fixes

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Banks menu still shows "Soon" | Old sidebar cache | Hard refresh Ctrl+Shift+R |
| Balance wrong after edit | Ledger out of sync | Re-check statement date range includes 25 Jun 2026 |
| Bank expense didn't reduce balance | Wrong bank selected | Re-do Test 8 on Kotak |
| Transfer button disabled | Only 1 bank exists | Create both banks first |
| TypeScript errors locally | Stale DB types | Run `pnpm db:gen-types` and copy to `apps/web/src/lib/supabase/database.types.ts` |

---

## After Phase 14 testing

When all boxes are checked, next up is **Phase 15 — Financial Dashboard Home** (aggregate cash/bank/income/expense on `/dashboard`).

Say **"start Phase 15"** when ready.