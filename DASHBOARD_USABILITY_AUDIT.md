# Punchless Web Dashboard — Usability Audit for Non-Technical Workshop Owners

> **Audit date:** 2026-06-27  
> **Scope:** Web dashboard only (`apps/web/`) — **mobile app excluded**  
> **Audience:** Workshop owner who runs the business day-to-day, knows basic computer/mobile use, is **not** technical or accounting-trained  
> **Method:** Code review (routes, sidebar, page managers, flow panels, Learn content) + comparison with Shahin BMS reference (`grok-md.md`)  
> **Purpose:** Honest answer to *“Is this easy enough?”* and a prioritized list of what to change, why, and what happens if we do or don’t.

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

## 7. What NOT to Change (Keep These)

| Keep | Why |
|------|-----|
| GPS attendance + mobile app | Core differentiator vs Shahin |
| Client/supplier payment modals | Already simple |
| Statement print UI (Phase 13.5) | Matches paper habits |
| Data lock PIN | Privacy in shop environment |
| Learn content | Move to “help when stuck”, not primary onboarding |
| Ledger backend | Correct accounting — hide complexity in UI, don’t remove data model |
| Pay button on salary row | Good bridge to payments |

---

## 8. Suggested Implementation Order

```
Week 1 — Quick wins (no DB)
  P0-4  Fix commerce flow step 4
  P0-3  Supplier flow panel
  P1-1  Plain-language labels
  P1-5  Reduce quick actions

Week 2 — Simple mode foundation
  P0-1  Simple / Full mode toggle + filtered sidebar
  P0-5  Dashboard home simplification (start Phase 15)

Week 3 — Money clarity
  P0-2  Pay Staff hub
  P1-2  Quick bill wizard
  P1-3  Collect/Pay from home lists

Week 4 — Habits
  P1-4  Monthly payroll checklist
  P2-4  FY explanation
```

**Do not block on:** Mobile app, Stripe, Phase 17 full reports suite.

---

## 9. Success Criteria — How We Know It’s “Easy Enough”

Ask a **non-technical workshop owner** (not you) to complete these **without help** in under 15 minutes each:

| Task | Pass? |
|------|-------|
| Add a customer with ₹5,000 opening due | |
| Create a bill for ₹2,000 (udhar) | |
| Record ₹1,000 collection | |
| Add supplier, enter purchase ₹3,000, pay ₹1,000 | |
| See monthly salary amount for one employee and record payment | |
| Say what the 3 numbers on home mean | |

**If 5/6 pass → ready for real owners.**  
**If &lt;4 pass → more P0 work needed.**

---

## 10. Final Verdict

| Statement | True? |
|-----------|-------|
| The app has the **features** a workshop needs | ✅ Yes |
| The app is **easy for a non-technical owner today** | ❌ No |
| The app is **easier than raw Shahin for attendance** | ✅ Yes |
| The app is **as easy as Shahin for money** | ❌ Not yet — too fragmented |
| We **should** invest in simplification before more reports | ✅ Strongly yes |
| Your congestion feeling is **valid and expected** | ✅ Yes — ERP scope grew faster than UX simplification |

**Recommended next step for you:** Read this doc, mark which P0/P1 items you agree with, then we implement in order. No mobile work required for this track.

---

## 11. Reference — Key Files Reviewed

| Area | Files |
|------|-------|
| Navigation | `apps/web/src/components/sidebar-config.ts` |
| Dashboard home | `apps/web/src/app/(dashboard)/dashboard/page.tsx`, `dashboard-quick-actions.tsx` |
| Clients | `client-manager.tsx`, `commerce-flow-panel.tsx` |
| Suppliers | `supplier-manager.tsx` (no flow panel) |
| Salary | `salary-manager.tsx`, `payroll-flow-panel.tsx`, `staff-payment-manager.tsx`, `salary-deposit-manager.tsx` |
| Help | `learn-modules.ts` (23 modules), `page-header.tsx`, `info-hint.tsx` |
| Docs | `docs/07_WEB_DASHBOARD.md`, `grok-md.md`, `DASHBOARD_EXECUTION_PLAN.md` |

---

*This document is planning only — no code changes were made in this audit.*