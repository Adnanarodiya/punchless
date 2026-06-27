# Punchless Web Dashboard — Usability Audit for Non-Technical Workshop Owners

> **Audit date:** 2026-06-27  
> **Last updated:** 2026-06-27 — **OT multiplier setting (1× / 1.5× / 2×) in Settings**  
> **Scope:** Web dashboard only (`apps/web/`) — **mobile app + GPS deferred for now**  
> **Audience:** Workshop owner who runs the business day-to-day, knows basic computer/mobile use, is **not** technical or accounting-trained  
> **Method:** Code review + analysis of owner’s real files: `may 2026 attandence.xlsx`, `CR ATTENDENCE(1)(1).xlsx`, May salary report (screenshot)  
> **Purpose:** Honest answer to *“Is this easy enough?”* and a prioritized plan — including **upload fingerprint sheet → get salary report**.

---

## 🔴 Owner Decision (2026-06-27) — New Priority Path

**For now, attendance = fingerprint scanner Excel upload. Not GPS. Not mobile.**

| Decision | Choice |
|----------|--------|
| Attendance source | **Fingerprint machine** → export monthly `.xlsx` → **upload on salary day** |
| Primary upload file | `may 2026 attandence.xlsx` format (`rptMonthlyWorkDurationSummary` sheet) |
| Salary output | **Same as your Shahin Motors May sheet** (screenshot) — Name, Designation, Salary, Working Days, OT, Total, Advance, Net Payment |
| Removed employees | Rows with **`NONAME`** in fingerprint export = **skip / inactive slot** (employee removed from machine) |
| GPS / geofence / mobile attendance | **Pause** — hide from Simple mode sidebar; code stays in repo but not required for daily use |
| Manual workbook `CR ATTENDENCE(1)(1).xlsx` | **Phase 2 optional** — support later; v1 uses fingerprint export only |

**Your new monthly workflow (target):**

```
1. Run fingerprint machine all month (as today)
2. Export May summary → may 2026 attandence.xlsx
3. Dashboard → Salary → Upload file
4. Review report (same columns as your Excel salary sheet)
5. Pay staff / export / print
```

**This answers your question:** You will **still see working days per employee** (and OT). Salary is **not** auto-full-month — it is **prorated by days actually worked** on **eligible working days only** (Sundays excluded).

**Salary example (confirmed):** ₹30,000 salary, came **20 days**, company month = **26 working days** (30-day sheet minus 4 Sundays):

```
Pay = 30,000 × (20 ÷ 26) = ₹23,076.92  ≈ ₹23,077
```

---

## Sunday & 30-Day Sheet — How We Calculate (Owner Rule)

### The problem you described

| What fingerprint sheet shows | What it means in real life |
|------------------------------|----------------------------|
| Sheet has **30 day columns** (May 1–30) | You always upload this full list ✅ |
| **Sunday** shows `A` + `0:0` / `0:0` duration | Employee did not punch — **but Sunday is holiday** |
| Machine **SUMMERY** says `A:8` | That **8 includes Sunday absents** — must **not** reduce salary for those |
| Company **working days = 26** | 30 calendar days in sheet − **4 Sundays** = 26 eligible days |
| Employee came **20 days** (`P:20`) | Pay for 20 only — **not** full ₹30,000 |

**Verified from your `may 2026 attandence.xlsx` (SUFIYAN DATA):**

- Daily row: `P,P,A,A,P,P,P,HP,P,A,...` with `0:0` on off days  
- Sundays in May (days **3, 10, 17, 24**) show status **`A`** in the file — **false absent**  
- SUMMERY: `P:20`, `A:8` → the 8 absent = **4 Sunday + 4 weekday** absent  
- For salary we use **`P:20` = 20 days worked**, denominator **26**, not 30  

### Punchless rule (what we will build)

```
Step 1 — Build month calendar from upload (May 2026, days 1–30 or 1–31)

Step 2 — Mark holidays
  Sunday (default) = HOLIDAY — excluded completely
  (Later: add festival holidays in Settings)

Step 3 — For each day column, classify:

  | Day type   | Fingerprint shows | Punchless treats as        | Counts toward salary? |
  |------------|-------------------|----------------------------|------------------------|
  | Sunday     | A, 0:0, empty     | HOLIDAY (week off)         | No — ignore              |
  | Weekday    | P + duration      | PRESENT (1 day)            | Yes — +1 working day   |
  | Weekday    | HP                | HALF DAY (0.5)             | Yes — +0.5               |
  | Weekday    | A, 0:0, 00:00     | ABSENT                     | No pay for that day      |
  | Weekday    | NOP               | No punch / review          | Flag for owner           |
  | NONAME row | entire block      | Removed employee slot    | Skip                     |

Step 4 — Count working days (numerator)
  days_worked = sum of P (+ 0.5 × HP) on NON-Sunday days only
  (Can cross-check with SUMMERY P: — should match if machine counts same way)

Step 5 — Eligible days (denominator)
  eligible_days = days in uploaded sheet that are NOT Sunday
  May example: 30 − 4 Sundays = 26
  OR use Settings → working_days_per_month = 26 (must match)

Step 6 — Base salary
  earned = monthly_salary × (days_worked ÷ eligible_days)
  Example: 30,000 × (20 ÷ 26) = ₹23,077

Step 7 — OT pay (hourly rate × OT multiplier from Settings)
  hourly_rate   = monthly_salary ÷ (eligible_days × daily_work_hours)
                = 30,000 ÷ (26 × 8) = ₹144.23/hr

  ot_multiplier = Settings → OT rate (default **1×** = same as regular pay)
                  Options: **1×** · **1.5×** · **2×** (owner can change anytime)

  ot_hours      = from SUMMERY OT: (e.g. 3:15 → 3.25 hours)
  ot_pay        = ot_hours × hourly_rate × ot_multiplier
                @ 1×:   3.25 × 144.23 × 1   = ₹468.75
                @ 1.5×: 3.25 × 144.23 × 1.5 = ₹703.13
                @ 2×:   3.25 × 144.23 × 2   = ₹937.50

  total         = earned + ot_pay
  net           = total − advance
```

### Why not divide by 30?

| Method | 20 days worked, ₹30,000 | Correct? |
|--------|-------------------------|----------|
| ÷ **26** (working days, Sundays out) | **₹23,077** | ✅ Your rule |
| ÷ **30** (all calendar days in sheet) | ₹20,000 | ❌ Punishes for Sundays |
| Full month no absent | ₹30,000 | Only if worked all 26 days |

Your old Shahin Excel sometimes shows **30** in the sheet header, but **Working Days** column uses **actual days came** (20), and the math uses **prorated salary** — Punchless will use **26** as denominator from Settings (already exists: `working_days_per_month`).

### What you will see in the report

| Column | Example (SUFIYAN) |
|--------|-------------------|
| Salary | ₹30,000 |
| Working Days | **20** (came on eligible days) |
| Eligible days | 26 (shown in summary / tooltip) |
| Earned salary | ₹23,077 |
| OT (hours) | From SUMMERY (e.g. `3:15` = 3h 15m) |
| OT (pay) | `ot_hours × hourly_rate × OT multiplier` (Settings: 1× / 1.5× / 2×) |
| Advance | From Punchless |
| Net pay | Earned + OT pay − Advance |

Optional detail row: `4 Sundays excluded · 4 weekday absents` — so owner understands why not 26/26.

---

## 1. Executive Summary — Is It Easy Today?

**Short answer: No — not yet for a typical non-educated workshop owner.**

The dashboard is **powerful and well-built for someone who already understands workshop ERP concepts** (clients, GST invoices, ledger, salary deposits, Rojmel). For an owner who mainly wants:

- *“How much should I collect from this client?”*
- *“How much do I owe this supplier?”*
- *“How much salary do I pay my staff this month?”*

…the app still asks them to think like an accountant and a software power-user at the same time.

**Your own confusion as the developer is a valid signal.** The product has grown from an attendance tool into a **5-layer ERP** (HR → Commerce → Finance → Reports → Admin) with **44 pages** and **~25 sidebar links**. That is a lot of surface area for one person to hold in their head.

| Question | Verdict |
|----------|---------|
| Can a workshop owner use it without training? | **Unlikely** without the Learn section or hand-holding |
| Are client dues easy to see and collect? | **Mostly yes** — Clients page is one of the better screens |
| Are supplier payables easy? | **Partially** — pay action exists, but no guided flow like Clients |
| Is salary easy? | **No** — split across 4 menu items + accounting terms |
| Is the home dashboard easy? | **No** — too many sections competing for attention |
| Is help available in-app? | **Yes** — Learn (23 modules), `?` on pages, some flow panels |
| Is help enough on its own? | **No** — owners won’t read 23 modules before billing a client |

**Bottom line:** Features exist. **Guidance and simplification do not yet match the complexity we added.** We should simplify before adding more modules (Phase 15–17).

---

## 2. Who We Are Designing For

### 2.1 Primary user (target)

| Trait | Reality |
|-------|---------|
| Education | May not read English fluently; comfortable with Gujarati/Hindi business words |
| Tech skill | Uses WhatsApp, maybe Shahin or a paper notebook; not “software people” |
| Daily goals | Bill customers, collect money, pay suppliers, pay staff, know cash in hand |
| Mental model | **People + Money in + Money out** — not “Commerce”, “Ledger”, “Deposits” |
| Patience | Low — will abandon if the first invoice takes 10 minutes |

### 2.2 What they are used to (Shahin-style)

From `grok-md.md`, Shahin works for this audience because:

- **One task per screen** with form at top, list below
- **Plain labels** — “Receive Payment”, “Pay Now”, “Staff Payments”
- **Home page answers 3 questions** — income, expense, who owes me
- **16 quick shortcuts** on home — but each goes to a **single-purpose** page
- **No attendance GPS complexity** — manual attendance only

Punchless copied Shahin’s **breadth** but added **attendance engine + more concepts** (deposits, corrections, hourly vs fixed salary, data lock, FY vs calendar year). That increases power and confusion together.

---

## 3. Current Dashboard — What Exists (Verified in Code)

### 3.1 Navigation (`sidebar-config.ts`)

| Group | Items | Count |
|-------|-------|------:|
| Overview | Dashboard, Learn | 2 |
| People | Employees, Posts, Workshops | 3 |
| Operations | Attendance, History, Requests, Jobs | 4 |
| Commerce | Clients, Suppliers, Invoices, Purchases | 4 |
| Finance | Transactions, Banks | 2 |
| Payroll | Salary, Payments, Deposits, Advances | 4 |
| Reports | All Reports | 1 (+ 8 sub-reports) |
| Account | Settings, Users, Audit Log, Password, Billing | 5 |

**Total:** 8 groups, ~25 visible links (+ report sub-pages).

### 3.2 Dashboard home (`dashboard/page.tsx`)

The home page stacks **many** sections in one scroll:

1. Setup checklist  
2. 6 financial cards (Income, Expense, Cash, Bank, Client credit, Supplier payable)  
3. **16** quick-action tiles  
4. Today’s payments  
5. Top pending client dues  
6. Revenue chart (7D / 6M)  
7. Sticky notes  
8. 4 operations cards (employees, working, jobs, advances)  
9. Recent attendance + recent jobs tables  

Plus: financial year selector, live clock, data lock controls.

**Problem:** This is an **accountant’s cockpit**, not a **“what do I do today?”** screen.

### 3.3 Money flows — what works vs what confuses

#### Clients (Money IN) — **Better**

| What works | Evidence |
|------------|----------|
| Summary cards: total clients, total due | `client-manager.tsx` |
| Receive payment modal with current due shown | ₹ button per row |
| Step-by-step panel | `CommerceFlowPanel` on Clients page |
| Statement per client | `/dashboard/clients/[id]/statement` |

| What confuses | Why |
|---------------|-----|
| Invoice form is heavy | GST slabs, split cash/bank/credit, line items |
| Flow panel step 4 links to **Rojmel report** | `commerce-flow-panel.tsx` → `/dashboard/reports/rojmel` — wrong for “client statement” |
| “Commerce” in sidebar | Jargon — owner thinks “Customers” or “Clients” |

#### Suppliers (Money OUT to vendors) — **Weaker**

| What works | Evidence |
|------------|----------|
| Summary: supplier count, total payable | `supplier-manager.tsx` |
| Pay Now modal | Same pattern as client payment |

| What’s missing | Impact |
|----------------|--------|
| **No supplier flow panel** | Owner doesn’t see Add → Purchase → Pay → Statement |
| Purchases on separate nav item | Extra click; unclear that purchase **creates** payable |
| No “how much I owe X” on home beyond one total | Must open Suppliers |

#### Salary / Payroll (Money OUT to staff) — **Hardest area**

| Page | Purpose | Owner-friendly? |
|------|---------|-----------------|
| `/dashboard/salary` | Monthly report from attendance | **Medium** — many columns |
| `/dashboard/salary/payments` | Record actual payout | **Medium** — separate from report |
| `/dashboard/salary/deposits` | Accrue salary (no cash movement) | **No** — accounting concept |
| `/dashboard/advances` | Approve staff advance requests | **OK** — but another menu item |

**Payroll flow panel exists** on Salary page (`payroll-flow-panel.tsx`) — good step:

```
Attendance → Fix requests → Salary report → Pay staff
```

But an owner who only wants *“pay ₹X to Ramesh”* must still understand:

- Hourly vs fixed monthly mode (Settings)  
- Adjusted hours, grace half-days, absent days  
- Advance deductions, over-advanced  
- Difference between **Deposit** and **Payment**  
- When to use History vs Requests vs Salary  

**This is the #1 confusion area you mentioned.**

### 3.4 Help systems already built

| System | Location | Strength | Weakness |
|--------|----------|----------|----------|
| Learn | `/dashboard/learn` — 23 modules | Very complete | Too long; feels like documentation, not guidance |
| `?` on PageHeader | `learn-page-help.tsx` | Contextual | Easy to ignore |
| Flow panels | Clients, Salary | Visual steps | Only 2 of 5 money areas |
| InfoHint | Reports, Transactions, Invoices | Glossary | Not on every page |
| Setup checklist | Dashboard home | Good for day 1 | Dismissed once; doesn’t teach monthly habits |
| Global search Ctrl+K | Header | Power-user feature | Non-technical users won’t discover it |

---

## 4. Why It Feels “Congested” — Root Causes

### 4.1 ERP breadth without a “simple path”

We merged:

- **Punchless** (GPS attendance, jobs, corrections, hourly salary)  
- **Shahin** (clients, suppliers, GST, banks, Rojmel, deposits)

into one sidebar. The owner sees **everything at once** with no “Simple / Advanced” split.

### 4.2 Same money action, many doors

| Goal | Ways to get there today |
|------|-------------------------|
| Collect from client | Clients ₹ button, Invoice payment split, Transactions income, Bank deposit |
| Pay supplier | Suppliers Pay, Purchases, Transactions expense |
| Pay staff | Salary Pay link, Payments form, Deposits (?), Advances |

**More doors = more confusion** unless we label one as *the main way*.

### 4.3 English + accounting vocabulary

Terms that block non-technical users:

| Term in app | What owner hears in head |
|-------------|--------------------------|
| Deposits | “I already paid?” |
| Commerce | “What is commerce?” |
| Rojmel | Only Gujarati users know; others: ??? |
| Adjusted hours | “Why not just hours?” |
| Ledger / Statement | OK if one clear place |
| FY vs Yearly report | “Why two different years?” |
| Credit (payment mode) | “Loan? Or udhar?” |
| Posts | “Facebook posts?” → job titles |

### 4.4 Dashboard home shows everything, prioritizes nothing

Shahin home answers: **Income | Expense | Cash | Bank | Who owes me | Quick buttons**.

Punchless home answers that **plus** attendance ops, jobs, advances, chart, notes, checklist, 16 shortcuts. **No single “do this first” path.**

### 4.5 Good patterns exist but are inconsistent

- Clients have `CommerceFlowPanel` ✅  
- Salary has `PayrollFlowPanel` ✅  
- Suppliers have **nothing** ❌  
- Banks / Transactions have text hints only ⚠️  
- Invoices have `InfoHint` but long form ⚠️  

---

## 5. Feature-by-Feature: Easy or Not?

| Feature | Easy today? (1–5) | Notes |
|---------|:-----------------:|-------|
| Login / Dashboard open | 4 | Familiar layout |
| Add employee | 3 | Many fields (salary, bank, post, workshop) |
| Live attendance view | 4 | Visual; GPS is mobile-side |
| **Clients — see who owes** | **4** | Total due card + per-row due |
| **Clients — collect payment** | **4** | Modal is simple |
| Create GST invoice | 2 | GST + payment split intimidating |
| Client statement | 4 | Print-friendly Shahin style done |
| **Suppliers — see payable** | **3** | Works but no guided flow |
| Pay supplier | 4 | Modal similar to clients |
| Purchase invoice | 2 | GST slabs; linked to supplier mentally |
| **Monthly salary — know amount** | **2** | Many columns, modes |
| **Pay salary** | **3** | Pay button helps; deposits confuse |
| Advances | 3 | Separate page but understandable |
| Banks | 2 | Extra concept if owner uses one cash box |
| Transactions (income/expense) | 2 | Overlaps with client/supplier payments |
| Reports (8 types) | 1–2 | Accountant territory |
| Settings | 2 | Salary mode, work schedule, data lock PIN |
| Learn | 3 | Great content, wrong format for busy owner |

**Scores 4–5:** Use with little help.  
**Scores 1–2:** Will cause support calls or paper notebook fallback.

---

## 6. Recommended Changes — Full List

Each item includes: **why**, **how**, **pros**, **cons**, **if we do**, **if we don’t**, **is it worth it?**

Priority: **P0** = do first · **P1** = next · **P2** = later · **P3** = optional

---

### P0-1 — “Simple Owner Mode” (hide advanced ERP)

**Why:** One owner doesn’t need Rojmel, Deposits, Audit Log, Posts, and 8 reports on day one.

**How:**
- Settings toggle: `Experience: Simple | Full`
- Simple mode sidebar → only:
  - **Home**
  - **Customers** (Clients + Invoices combined entry)
  - **Suppliers** (Suppliers + Purchases entry)
  - **Staff** (Employees + Salary + Pay staff)
  - **Attendance** (live + history)
  - **Settings**
- Advanced items behind “More tools →” or Full mode

| Pros | Cons |
|------|------|
| Immediate reduction in overwhelm | Two UX paths to test |
| Matches mental model | Power users must switch mode |
| Faster onboarding | Slight dev cost for nav filtering |

| If we do | If we don’t |
|----------|-------------|
| Owner sees ~8 items, not 25 | Sidebar stays scary |
| Higher chance they complete first invoice | They use only paper for money |

**Worth it?** ✅ **Yes — highest ROI change.**

---

### P0-2 — Unified “Pay Staff” hub (merge Salary + Payments for simple mode)

**Why:** Owner thinks one thought: *“Salary deni che”* — not report vs payment vs deposit.

**How:**
- New tabbed page or section: **Pay Staff**
  - Tab 1: **This month** — employee list, one number “Pay this amount”, green Pay button (merge current Salary + Payments)
  - Tab 2: **History** — past payouts (optional)
- Hide **Deposits** in Simple mode; auto-deposit in background when salary is calculated (or explain in one line)
- Rename columns: `Due` → `Pay this month`, `Gross` → `Earned`

| Pros | Cons |
|------|------|
| One place for payroll | Deposits accountants may want visible |
| Matches Shahin “Staff Payments” | Need careful merge UX |
| Removes #1 confusion | |

| If we do | If we don’t |
|----------|-------------|
| Monthly payroll in 2 clicks after attendance | Owner asks “which menu is salary?” every month |

**Worth it?** ✅ **Yes — directly answers your salary concern.**

---

### P0-3 — Supplier money flow panel (mirror Clients)

**Why:** Clients page teaches the path; Suppliers page does not.

**How:**
- Add `SupplierFlowPanel` on `/dashboard/suppliers`:
  ```
  1. Add supplier → 2. Purchase bill → 3. Pay supplier → 4. Statement
  ```
- Same visual style as `CommerceFlowPanel`

| Pros | Cons |
|------|------|
| Symmetry with clients | Small dev task |
| Teaches purchase → payable link | |

| If we do | If we don’t |
|----------|-------------|
| Owner learns supplier workflow in-page | They record payment but skip purchase bills |

**Worth it?** ✅ **Yes — low effort, clear win.**

---

### P0-4 — Fix Commerce flow panel step 4 link

**Why:** Step says “Statement” but links to global Rojmel report — **wrong and confusing for everyone**.

**How:** Change `commerce-flow-panel.tsx` step 4 `href` from `/dashboard/reports/rojmel` to client statement pattern or remove href and match hint text (“on client row”).

| Pros | Cons |
|------|------|
| Fixes real bug | Trivial |

**Worth it?** ✅ **Yes — must fix.**

---

### P0-5 — Simpler dashboard home (Phase 15 focus)

**Why:** Home is the first impression; today it’s dense.

**How:**
- **Top row (always):** 3 big numbers with plain labels:
  - **Customers owe you** (client due total)
  - **You owe suppliers** (supplier payable)
  - **Cash + Bank** (combined or side by side)
- **Second row:** 4 action buttons only:
  - New bill · Collect payment · Pay supplier · Pay staff
- Collapse “Operations”, chart, sticky notes, 16 shortcuts under **“Show more”**
- Keep pending dues list (very useful)

| Pros | Cons |
|------|------|
| Shahin-like clarity | Less “wow” on first screen |
| Owner knows what matters | Power users click “Show more” |

| If we do | If we don’t |
|----------|-------------|
| Home answers 3 money questions in 3 seconds | Home still feels like cockpit |

**Worth it?** ✅ **Yes — aligns with pending Phase 15.**

---

### P1-1 — Plain-language labels (sidebar + headers)

**Why:** “Commerce”, “Deposits”, “Posts” don’t match workshop vocabulary.

**How:** Rename (English + optional Gujarati subtitle in description):

| Current | Suggested |
|---------|-----------|
| Commerce → Clients | Customers |
| Purchases | Supplier bills |
| Payroll → Salary | Staff salary |
| Payments | Pay staff |
| Deposits | Salary balance (advanced) or hide |
| Posts | Job titles |
| Transactions | Other income & expense |
| Rojmel | Daily cash book |

| Pros | Cons |
|------|------|
| Zero backend change | Need consistency in Learn docs |
| Instant clarity | |

**Worth it?** ✅ **Yes.**

---

### P1-2 — “Bill a customer” wizard (simplified invoice)

**Why:** Full invoice form is correct for GST businesses but heavy for a quick bill.

**How:**
- **Quick bill** (default in Simple mode): Client, amount, paid now or udhar (credit), done
- **GST bill** (expand): current full form with slabs, split payment

| Pros | Cons |
|------|------|
| First invoice in &lt; 60 seconds | Two invoice paths to maintain |
| GST users still covered | |

| If we do | If we don’t |
|----------|-------------|
| Owner bills from phone at counter | They skip app, use paper |

**Worth it?** ✅ **Yes for adoption.**

---

### P1-3 — Collect / Pay shortcuts from dashboard pending lists

**Why:** Owner should not hunt the Clients page to collect.

**How:**
- On “Top pending dues” row → **Collect** button opens payment modal (or deep-link `?open=pay` — partially exists)
- Add “Top supplier payables” with **Pay** button (mirror client dues)

| Pros | Cons |
|------|------|
| Money actions where numbers are shown | Needs small API/modal reuse |

**Worth it?** ✅ **Yes.**

---

### P1-4 — Monthly payroll checklist (not just setup checklist)

**Why:** Setup checklist helps day 1; owner needs **month-end habit**.

**How:**
- Dismissible banner on Salary page 25th–5th:
  ```
  ☐ Check attendance  ☐ Approve requests  ☐ Review salary  ☐ Pay staff
  ```
- Each step links to the right page; checkmarks from data

| Pros | Cons |
|------|------|
| Replaces reading Learn module | Only useful if they open Salary |

**Worth it?** ✅ **Yes.**

---

### P1-5 — Reduce quick actions from 16 to 6–8

**Why:** 16 tiles on home = same overload as 25 sidebar links.

**How:** Show: Customers, New bill, Suppliers, Pay staff, Attendance, Jobs — rest under “More shortcuts”.

| Pros | Cons |
|------|------|
| Less visual noise | Some users miss a tile |

**Worth it?** ✅ **Yes** (pairs with P0-5).

---

### P2-1 — Video / 30-second tooltips on first visit

**Why:** Owners won’t read Learn; they watch short clips.

**How:** First visit to Clients / Salary / Suppliers — 30s screen recording overlay (skip always available).

| Pros | Cons |
|------|------|
| High teaching impact | Content production effort |

**Worth it?** 🟡 **Maybe** — after P0/P1 ship.

---

### P2-2 — Gujarati / Hindi UI labels (settings language)

**Why:** Target users in Gujarat often prefer Gujarati business terms.

| Pros | Cons |
|------|------|
| Huge trust boost | i18n maintenance |

**Worth it?** 🟡 **If market is primarily Gujarati.**

---

### P2-3 — Merge Clients + Invoices entry in navigation

**Why:** Owner thinks “customer bill”, not two modules.

**How:** One “Customers” section with tabs: List | New bill | All bills

| Pros | Cons |
|------|------|
| Fewer nav items | Larger combined page |

**Worth it?** 🟡 **Good for Simple mode.**

---

### P2-4 — Explain FY vs calendar year once, visually

**Why:** Dashboard FY vs Yearly report Jan–Dec confuses even developers (`07_WEB_DASHBOARD.md` documents the mismatch).

**How:** One `InfoHint` on dashboard FY selector + unify or clearly label both everywhere.

| Pros | Cons |
|------|------|
| Stops silent wrong decisions | May need product decision on FY |

**Worth it?** ✅ **Yes for correctness.**

---

### P3-1 — Remove or defer low-value items for v1 owners

Candidates to hide in Simple mode:

| Item | Reason |
|------|--------|
| Audit Log | Owner-only compliance — not daily |
| Billing (Stripe) | Already skipped |
| Posts | Can default posts; add later |
| 6 of 8 reports | Keep Daily + Monthly only |
| Sticky notes | Nice, not core |

**Worth it?** 🟡 **Optional clutter reduction.**

---

### P3-2 — WhatsApp-style “support” button with owner phone

**Why:** Shahin shows support number on login — builds trust.

**Worth it?** 🟡 **Business decision.**

---

## 7. What NOT to Change / What to Pause

| Keep | Why |
|------|-----|
| Client/supplier payment modals | Already simple |
| Statement print UI (Phase 13.5) | Matches paper habits |
| Data lock PIN | Privacy in shop environment |
| Ledger backend | Correct accounting |
| Pay button on salary row | Good bridge to payments |
| GPS + mobile code in repo | **Paused for product use** — re-enable later as “Phase 2 attendance” without deleting work |

| Pause (hide in Simple mode) | Why |
|-----------------------------|-----|
| Mobile app requirement | Owner uses fingerprint only for now |
| Live GPS attendance dashboard | Replaced by upload flow |
| Workshops geofence setup | Not needed until GPS returns |
| Jobs travel/on-site states for salary | Optional later |

---

## 8. Fingerprint Upload Plan — **Phase 0 (Build This First)**

### 8.1 Files we analyzed (your real data)

#### A) `may 2026 attandence.xlsx` — **Primary upload (v1)**

| Property | Value |
|----------|-------|
| Sheet name | `rptMonthlyWorkDurationSummary` |
| Source | Fingerprint scanner software export |
| Structure | One **block per employee** (~6 rows each) |

**Per-employee block layout (column H = label column):**

| Row label (col H) | Meaning |
|-------------------|---------|
| Employee name or `NONAME` | `NONAME` = empty slot / removed employee → **skip entirely** |
| `INTIME` | Daily in-times for each day of month |
| `OUTTIME` | Daily out-times |
| `DURATION` | Daily hours worked |
| `OT` | Daily overtime |
| `SUMMERY` | Month totals — **this row drives salary** |

**SUMMERY row codes (parsed from your May file):**

| Code | Example | Meaning for salary |
|------|---------|-------------------|
| `P:n` | `P:20` | Present / full working days |
| `A:n` | `A:8` | Absent days |
| `H:n` | `H:0` | Half days (if used) |
| `L:n` | `L:0` | Late count (info) |
| `WO:n` | `WO:0` | Week-off |
| `W:` + hours | `190:15` | Total worked hours (hh:mm) |
| `OT:` + hours | `3:15` | Total OT hours (hh:mm) |

**Example from your file — SUFIYAN DATA (May):** `P:20`, `A:8`, total hours `190:15`, OT `3:15`.

#### B) `CR ATTENDENCE(1)(1).xlsx` — **Optional later (v2)**

| Property | Value |
|----------|-------|
| Sheets | `JAN 2026`, `FEB 2026`, … `MAY 2026` |
| Columns | NAME, DATE, DAY, INTIME, OUTTIME, STATUS, NET WORKING HOURS, OVERTIME |
| Status values | OK, LATE, ABSENT, SUNDAY, HOLI HOLIDAY, HALF DAY, etc. |
| Use | Backup if fingerprint export unavailable — **not v1** |

#### C) Your May salary report (screenshot) — **Target output**

Columns to reproduce in dashboard + Excel export:

| # | Column | Source |
|---|--------|--------|
| 1 | Sr. No. | Auto |
| 2 | Name | Match fingerprint name → employee in Punchless |
| 3 | Designation | Employee `post` in Punchless |
| 4 | Salary | Employee `monthly_salary` in Punchless |
| 5 | Working Days | From fingerprint SUMMERY (`P` or agreed formula — see 8.3) |
| 6 | OT (hours) | OT hours from SUMMERY (e.g. `3:15`) |
| 7 | Salary (earned) | `monthly_salary × (days_worked ÷ eligible_days)` — **eligible = sheet days minus Sundays (26 for May)** |
| 8 | OT (pay) | `ot_hours × hourly_rate × ot_multiplier` — multiplier from **Settings** (default **1×**) |
| 9 | Total Salary | Earned + OT pay |
| 10 | Advance | From Punchless advances for that month |
| 11 | Net Payment | Total − Advance (can be negative — e.g. NAZRUL `(1,967)`) |

**Verified formula from your sheet:** ARODIYA — ₹18,150 salary × 10 working days ÷ 30 = **₹6,050** ✓

---

### 8.2 Dashboard UX — Upload → Report

**New page flow:** `/dashboard/salary` (simplified)

```
┌─────────────────────────────────────────────────────────────┐
│  Monthly Salary — May 2026                                  │
│  [ Upload fingerprint sheet (.xlsx) ]  [ Download report ]  │
├─────────────────────────────────────────────────────────────┤
│  ⚠ 2 names not matched — [ Map now ]                        │
├─────────────────────────────────────────────────────────────┤
│  Same table as your Shahin screenshot                       │
│  + totals row at bottom                                     │
│  + [ Pay ] per employee                                     │
└─────────────────────────────────────────────────────────────┘
```

**Steps for owner:**

1. Open **Salary** in dashboard  
2. Select month (May 2026)  
3. Click **Upload attendance** → choose `may 2026 attandence.xlsx`  
4. System parses file, skips all `NONAME` blocks  
5. Matches names to employees (fuzzy: `SUFIYAN DATA` ↔ `Sufiyan Data`)  
6. Shows report **identical in meaning** to your screenshot  
7. Export Excel / Print / Pay staff  

**If name not found:** show mapping UI once (“Fingerprint name X = Employee Y”), save alias for next month.

---

### 8.3 Working days & OT — rules to implement (LOCKED)

**Default (match your workshop rule — Sunday holiday, 26 working days, configurable OT multiplier):**

```
eligible_days = count of days in upload that are NOT Sunday
                (May 30-day sheet → 26; Settings working_days_per_month should match)

days_worked   = count P (+ 0.5 × HP) on weekdays only
                — re-count from daily status row, OR trust SUMMERY P: if it excludes Sundays
                — NEVER subtract SUMMERY A: if it includes Sunday false-absents

daily_rate    = monthly_salary ÷ eligible_days
hourly_rate   = monthly_salary ÷ (eligible_days × daily_work_hours)
                — base rate for regular time; OT uses this × multiplier

earned_salary = monthly_salary × (days_worked ÷ eligible_days)
                Example: 30,000 × (20 ÷ 26) = ₹23,077

ot_hours      = parse SUMMERY OT: (e.g. "3:15" → 3 hours 15 min = 3.25)
ot_multiplier = Settings → ot_rate_multiplier (default 1)
ot_pay        = ot_hours × hourly_rate × ot_multiplier

total         = earned_salary + ot_pay
net_payment   = total - advance_deduction
```

| Rule | Setting / behaviour |
|------|---------------------|
| Week off | **Sunday** — auto from calendar; not counted as absent |
| Eligible days (denominator) | **26** for May (`working_days_per_month` in Settings) |
| Daily work hours | From Settings (e.g. **8** hrs) — used to derive hourly rate |
| **OT multiplier** | **Settings** — `1×` (default, same as regular) · `1.5×` · `2×` |
| OT hours source | SUMMERY `OT:` row (and/or sum of daily OT row) |
| Upload format | Always **30-day** (or 31-day) fingerprint list — no change needed |
| Sunday in sheet (`A`, `0:0`) | **Ignore** for absent penalty |
| Weekday `0:0` / `A` | Absent — no pay that day |
| `P` on weekday | Present — +1 working day |
| `HP` on weekday | Half day — +0.5 |
| NONAME blocks | Skip entirely |
| SUMMERY `A:8` | **Do not use** for salary — includes Sundays; show for info only |

**Full example (₹30,000 salary, 20 days, OT 3:15):**

| Line | Calculation | @ 1× | @ 1.5× | @ 2× |
|------|-------------|------|--------|------|
| Base earned | 30,000 × 20÷26 | ₹23,077 | ₹23,077 | ₹23,077 |
| Hourly rate | 30,000 ÷ (26×8) | ₹144.23/hr | ₹144.23/hr | ₹144.23/hr |
| OT pay | 3.25 hr × rate × mult. | ₹469 | ₹703 | ₹938 |
| **Total** | base + OT | **₹23,546** | **₹23,780** | **₹24,015** |

Advance deducted after total → **Net pay**.

### 8.3.2 Settings UI — OT multiplier (new field)

**Location:** `/dashboard/settings` → Work schedule section (next to working days & daily hours)

| Setting | Type | Default | Options |
|---------|------|---------|---------|
| OT rate multiplier | Dropdown | **1×** (same as regular pay) | `1×` · `1.5×` · `2×` |

**DB:** `companies.ot_rate_multiplier` — `numeric`, default `1.0` (migration in Phase 0)

**Help text on screen:** *“OT pay = extra hours from fingerprint sheet × hourly rate × this multiplier. 1× = same pay as normal hours.”*

**Salary report** shows multiplier used that month (e.g. badge `OT @ 1.5×`) so owner knows why OT column changed.

**Parser must use day numbers (1–30) + month/year** to know which columns are Sunday — not column position alone.

**You will always see Working Days column** (= days came, e.g. 20). No hidden auto-full pay.

### 8.3.1 Day-code reference (from your May file)

| Code in daily row | On weekday | On Sunday |
|-------------------|------------|-----------|
| `P` | Present (+1) | Treat as holiday — ignore |
| `HP` | Half day (+0.5) | Ignore |
| `A` | Absent | **Holiday — ignore** |
| `0:0` duration | Absent | **Holiday — ignore** |
| `NOP` | Flag / no punch | Ignore |
| `NONAME` | Skip employee block | — |

---

### 8.4 Technical implementation (dev checklist)

| # | Task | Location | DB? |
|---|------|----------|-----|
| 0 | `companies.ot_rate_multiplier` — default `1.0`; allowed: 1, 1.5, 2 | migration | ✅ |
| 1 | `attendance_imports` table — store upload metadata (month, file name, uploaded_at, company_id) | migration | ✅ |
| 2 | `attendance_import_rows` — parsed per-employee summary (name, P, A, hours, OT, raw JSON) | migration | ✅ |
| 3 | `employee_fingerprint_aliases` — map “SUFIYAN DATA” → user_id | migration | ✅ |
| 4 | XLSX parser — 30-day columns + Sunday holiday filter + day codes P/A/HP | `lib/utils/fingerprint-attendance-parser.ts` | — |
| 5 | Upload API / server action | `lib/actions/attendance-import.actions.ts` | — |
| 6 | Salary report generator (Shahin columns) | `lib/utils/fingerprint-salary-report.ts` | — |
| 7 | Upload UI + report table + print/export | `salary-manager.tsx` or new `salary-upload-manager.tsx` | — |
| 8 | Name mapping modal | component | — |
| 9 | Hide GPS items in Simple mode sidebar | `sidebar-config.ts` | — |
| 10 | Comment/feature-flag mobile prompts in Learn | `learn-modules.ts` | — |

**Parser logic (pseudocode):**

```
for each employee block in sheet:
  if block.label == "NONAME": continue
  name = block.label
  summary = parse SUMMERY row → { present, absent, hours, ot_hours }
  rows.push({ name, ...summary })

for each row:
  employee = matchByAliasOrName(row.name)
  if !employee: unmatched.push(row)
  else: build salary line using monthly_salary + row.present + advances
```

---

### 8.5 Pros, cons, if we do / don’t

| Pros | Cons |
|------|------|
| **Exact workflow you already use** — no behaviour change | Two sources of truth if GPS re-enabled later |
| One upload → full salary report in seconds | Name matching needs aliases first month |
| Owner sees working days + OT clearly | Parser tied to fingerprint export format |
| No mobile app needed | Format change from scanner vendor = parser update |
| Faster than building GPS for this owner today | |

| If we do | If we don’t |
|----------|-------------|
| Owner can use Punchless for salary **this month** | Keep manual Excel salary sheet forever |
| Commerce (clients/suppliers) + salary in one app | Dashboard stays confusing with GPS paths unused |

**Worth it?** ✅ **Yes — this is the #1 priority for Shahin Motors-style daily use.**

---

### 8.6 What about GPS and mobile later?

| Item | Now | Later |
|------|-----|-------|
| Fingerprint upload | ✅ Primary | Still supported |
| GPS mobile attendance | Hidden / paused | Re-enable as optional “auto attendance” |
| Manual CR workbook import | ☐ | v2 if needed |
| Both fingerprint + GPS same month | ☐ | Pick one source per month in settings |

Code is **not deleted** — only **de-prioritized in UX** per your request.

---

## 9. Suggested Implementation Order (revised)

```
Week 1 — Fingerprint salary (Phase 0) ← START HERE
  Upload parser for may 2026 attandence.xlsx format
  NONAME skip logic
  Shahin-style salary report table + Excel export
  Name mapping aliases
  DB: attendance_imports + aliases

Week 2 — Simple dashboard UX
  P0-1  Simple mode (hide GPS, Jobs, Workshops from nav)
  P0-2  Pay Staff hub (upload + pay on one page)
  P0-5  Simpler home (3 money numbers)

Week 3 — Commerce ease (unchanged from audit)
  P0-3  Supplier flow panel
  P0-4  Fix commerce flow step 4
  P1-2  Quick bill wizard
  P1-3  Collect/Pay from home

Week 4 — Polish
  P1-1  Plain-language labels
  P1-4  Monthly payroll checklist
  P2    Optional: CR ATTENDENCE workbook import
```

**Do not block on:** Mobile app, GPS, Stripe, Phase 17 full reports.

---

## 10. Success Criteria — How We Know It’s “Easy Enough”

Ask a **non-technical workshop owner** (not you) to complete these **without help** in under 15 minutes each:

| Task | Pass? |
|------|-------|
| Add a customer with ₹5,000 opening due | |
| Create a bill for ₹2,000 (udhar) | |
| Record ₹1,000 collection | |
| Add supplier, enter purchase ₹3,000, pay ₹1,000 | |
| Upload `may 2026 attandence.xlsx` and get salary report matching paper sheet | |
| See working days + OT per employee in report | |
| NONAME rows not shown in report | |
| Record payment for one employee | |
| Say what the 3 numbers on home mean | |

**If 5/6 pass → ready for real owners.**  
**If &lt;4 pass → more Phase 0 work needed.**

---

## 11. Final Verdict

| Statement | True? |
|-----------|-------|
| The app has the **features** a workshop needs | ✅ Yes |
| The app is **easy for a non-technical owner today** | ❌ No |
| Fingerprint upload → salary report is **feasible** | ✅ Yes — format parsed from your real file |
| GPS/mobile required for this owner **now** | ❌ No — paused per owner decision |
| The app is **as easy as Shahin for money** | ❌ Not yet — too fragmented |
| We **should** build Phase 0 upload **before** GPS polish | ✅ Strongly yes |
| Your congestion feeling is **valid and expected** | ✅ Yes — ERP scope grew faster than UX simplification |

**Recommended next step:** All salary rules **locked** — Sunday holiday, ÷26, days worked = P on weekdays, **OT = hourly rate × multiplier (Settings: 1× / 1.5× / 2×, default 1×)**. Ready to implement Phase 0.

---

## 12. Reference — Key Files Reviewed

| Area | Files |
|------|-------|
| Navigation | `apps/web/src/components/sidebar-config.ts` |
| Dashboard home | `apps/web/src/app/(dashboard)/dashboard/page.tsx`, `dashboard-quick-actions.tsx` |
| Clients | `client-manager.tsx`, `commerce-flow-panel.tsx` |
| Suppliers | `supplier-manager.tsx` (no flow panel) |
| Salary | `salary-manager.tsx`, `payroll-flow-panel.tsx`, `staff-payment-manager.tsx`, `salary-deposit-manager.tsx` |
| Help | `learn-modules.ts` (23 modules), `page-header.tsx`, `info-hint.tsx` |
| Docs | `docs/07_WEB_DASHBOARD.md`, `grok-md.md`, `DASHBOARD_EXECUTION_PLAN.md` |
| **Owner attendance files** | `may 2026 attandence.xlsx`, `CR ATTENDENCE(1)(1).xlsx` |
| **Target salary output** | Owner May 2026 salary screenshot (SHAHIN MOTORS-BARDOLI) |

---

*Planning document. Phase 0 (fingerprint upload) approved by owner 2026-06-27 — implementation not started yet.*