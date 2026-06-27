# Owner Usability Test — “Easy Enough?”

> **Source:** `DASHBOARD_USABILITY_AUDIT.md` Section 10  
> **Who tests:** A **non-technical workshop owner** (not the developer)  
> **Who facilitates:** You — set up, observe, **do not help** unless they are completely stuck  
> **Mode:** **Simple** dashboard (Settings → Dashboard experience → Simple)

---

## Pass rule

Score **6 blocks** below. **≥5 blocks pass** → ready for real owners. **≤3 blocks pass** → more UX work needed before onboarding.

| Block | What | Pass? |
|-------|------|-------|
| **A** | Customer with ₹5,000 opening due | ☐ |
| **B** | ₹2,000 bill on udhar (credit) | ☐ |
| **C** | ₹1,000 collection from customer | ☐ |
| **D** | Supplier + ₹3,000 purchase + ₹1,000 payment | ☐ |
| **E** | Fingerprint upload + salary report quality | ☐ |
| **F** | Pay one employee + explain 3 home numbers | ☐ |

**Block E** only passes if **all three** are true:
- Upload succeeds and report shows employees
- Working days + OT columns visible per employee
- **NONAME** rows do **not** appear in the report

**Block F** only passes if **both** are true:
- Payment recorded for one employee
- Owner can explain all **3 numbers** on Home without reading the screen word-for-word

---

## Before the session (facilitator only)

```bash
# From project root
pnpm dev
```

1. Open **http://localhost:3000** (or the port shown in terminal).
2. Log in: **owner@demo.punchless** / **demo1234**  
   (After `pnpm db:reset` — see `supabase/seed.sql`)
3. Settings → set **Dashboard experience** to **Simple**.
4. Hard refresh: **Ctrl + Shift + R**.
5. Have ready on disk: **`may 2026 attandence.xlsx`** (project root).
6. Optional: print this sheet or open it on a second screen for scoring only — **do not show steps to the owner**.

**Reset tip (clean run):** Use a fresh company or delete test customer/supplier you create so opening balances are obvious. For salary, use month **2026-05** (file matches May 2026).

---

## What you say to the owner

> “This is Punchless — software for workshop money and staff salary.  
> I’ll give you small jobs a real owner would do. Try to finish each job yourself.  
> I won’t guide you unless you’re totally stuck. Think aloud if you want — that helps us.”

**Do not:** name sidebar items, say “click More tools”, or fix mis-clicks.  
**Do:** note where they hesitated, wrong page opened, or gave up.

---

## Block A — Add customer with ₹5,000 opening due

**Prompt (read aloud):**

> “Add a new customer called **Test Motors** who already owes you **₹5,000** from before you started using this app.”

**Expected path (you check, don’t tell):**
- Sidebar → **Customers** (or **Home** → Collect payment area)
- Add / new customer
- Name: `Test Motors`
- Opening balance: `5000`
- Save

**Pass if:** Customer appears in list with **₹5,000** due (or similar).  
**Fail if:** Could not finish in ~15 min, wrong amount, or needed step-by-step help.

**Friction notes:** _______________________________________________

---

## Block B — Bill ₹2,000 on udhar

**Prompt:**

> “Bill **Test Motors** **₹2,000** for workshop work. They will pay later — **udhar**, not cash now.”

**Expected path:**
- **Home** → **New bill** (or Invoices → Quick bill)
- Customer: **Test Motors**
- Amount: `2000`
- Payment: **Udhar (credit)**
- Save

**Pass if:** Bill saved; customer due increased by ₹2,000 (total due ~₹7,000 if Block A passed).  
**Fail if:** Used GST form unnecessarily and got lost, or recorded as “paid now” by mistake.

**Friction notes:** _______________________________________________

---

## Block C — Collect ₹1,000

**Prompt:**

> “**Test Motors** paid you **₹1,000** cash today. Record that collection.”

**Expected path (any one is fine):**
- **Home** → **Who owes what** → **Collect** on Test Motors  
- Or **Customers** → ₹ / Receive payment on that row

**Pass if:** ₹1,000 payment recorded; due dropped by ₹1,000.  
**Fail if:** Could not find Collect / payment, or amount wrong.

**Friction notes:** _______________________________________________

---

## Block D — Supplier + purchase + payment

**What this tests:** Can the owner track money **you owe** to a parts vendor — add supplier, record a credit purchase, then pay part of it?

**Prompt (read aloud):**

> “Add a supplier called **Test Parts**. Enter a purchase bill of **₹3,000** on credit — udhar, not paid now. Then pay them **₹1,000**.”

### Expected path (facilitator checklist — do not read to owner)

| Step | Where to go | What they should do | What you verify |
|------|-------------|---------------------|-----------------|
| **1** | Sidebar → **Commerce** → **Suppliers** | Click **+ Add supplier**, name `Test Parts`, save | **Test Parts** appears in the supplier table |
| **2** | **Commerce** → **Supplier bills** *or* on Suppliers page click step **2 Supplier bill** in the flow panel | New bill: supplier **Test Parts**, taxable **₹3,000** (GST 0%), type **Supplier bill (increases payable)** | Bill saved; Test Parts **payable** shows **₹3,000** (on Suppliers row or Home **You owe suppliers**) |
| **3** | Back to **Suppliers** | Click **₹ Pay** on **Test Parts** row → amount **₹1,000**, cash (or bank), save | Payable drops to **₹2,000**; payment appears in supplier statement |

**Simple mode sidebar (after update):** Under **Commerce** you should see **Customers**, **Suppliers**, and **Supplier bills** together — no need to open **More tools** for this block.

**Pass if all three:**
- Supplier **Test Parts** exists
- Payable was **₹3,000** after the purchase (credit)
- **₹1,000** payment recorded; remaining payable **~₹2,000**

**Fail if:** Could not find where to enter purchases, purchase not on credit, or payment not recorded.

**Common confusion:** Supplier bills are **not** on the Suppliers form — they are a separate **Supplier bills** page. The flow panel on Suppliers links there. There is no “Udhar” toggle — **Supplier bill** type means credit automatically.

**Friction notes:** _______________________________________________

---

## Block E — Fingerprint salary report

**Prompt:**

> “Upload your **May 2026** fingerprint attendance file and check the salary report looks like your paper sheet. Tell me if any name looks wrong.”

**Hand them:** `may 2026 attandence.xlsx`

**Expected path:**
- **Pay Staff** (sidebar)
- Upload file (May 2026)
- Review table: employee names, **working days**, **OT**, earned salary

**Pass if all true:**
| Check | Pass? |
|-------|-------|
| Upload works; report shows employees | ☐ |
| Working days + OT visible per row | ☐ |
| No **NONAME** rows in the table | ☐ |

**Spot-check (facilitator):** **SUFIYAN DATA** — ~20 working days, OT from sheet (e.g. ~3h+) if seeded employees match.

**Fail if:** Upload error, empty report, NONAME visible, or owner says “this doesn’t match my paper” without mapping names.

**Friction notes:** _______________________________________________

---

## Block F — Pay staff + home numbers

**Part 1 — Prompt:**

> “Pay **one employee** their salary for this month (any amount they suggest from the report is fine).”

**Expected path:**
- On salary report → **Pay this month** on one row  
- Confirm payment form → save

**Part 2 — Prompt (back to Home):**

> “Look at the **three big numbers** on Home. What does each one mean for your business?”

**Correct meanings (plain language OK):**

| # | Label on screen | Accept if owner says… |
|---|-----------------|------------------------|
| 1 | **Customers owe you** | Money customers still need to pay / customer dues / udhar from customers |
| 2 | **You owe suppliers** | What we still owe vendors / supplier payables |
| 3 | **Cash + Bank** | Money in hand and in bank / liquid money / how much cash+bank we have |

**Pass if:** Payment saved **and** owner explains **all 3** sensibly.  
**Fail if:** Could not pay, or confuses customer due with supplier due or “income”.

**Friction notes:** _______________________________________________

---

## Score sheet (end of session)

| Block | Pass ☐ / Fail ☐ | Time (min) | Stuck where? |
|-------|-----------------|------------|--------------|
| A Customer | | | |
| B Udhar bill | | | |
| C Collection | | | |
| D Supplier | | | |
| E Salary | | | |
| F Pay + Home | | | |

**Total blocks passed:** _____ / 6

| Result | Action |
|--------|--------|
| **5–6 pass** | Ready for pilot owners — next: Phase 14 QA or P2 polish |
| **4 pass** | Fix top friction items from notes, re-test one block |
| **≤3 pass** | Stop new features — UX fixes first (navigation, labels, defaults) |

---

## Common friction — watch for these

| Symptom | Likely fix (after test) |
|---------|-------------------------|
| Can’t find **Supplier bills** | Check Commerce group in sidebar; flow panel step 2 on Suppliers links to purchases |
| **New bill** vs **GST invoice** confusion | Default quick bill only; GST behind link (already done — note if still confusing) |
| Upload month wrong | Default month to file month or clearer label |
| Unmatched fingerprint names | Name-map modal — note if owner understood it |
| **More tools** never opened | Consider promoting Purchases / Invoices for power tasks |

---

## After the test

1. Fill score sheet above.
2. Paste friction notes into `PROJECT_TRACKER.md` or a short issue list.
3. Tell the agent: **“owner test results: X/6”** with block failures — we’ll fix before Phase 14/P2.

**Do not push to GitHub** unless you explicitly say so.