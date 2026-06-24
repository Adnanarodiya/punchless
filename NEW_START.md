# NEW_START — Where to Begin (Shahin → Punchless)

> Quick guide: which files to read, what to do first, and how to work through each phase.

---

## Locked Strategy (2026-06-24)

**Finish the full web dashboard (Phases 11A–17) before mobile app work.**

- No Stripe / payment integration for now
- Mobile polish comes after dashboard is usable
- Start with Phase 11A today

**Main plan:** [`DASHBOARD_EXECUTION_PLAN.md`](./DASHBOARD_EXECUTION_PLAN.md)

---

## Which MD File to Use When

| File | Use it for |
|------|------------|
| **[`DASHBOARD_EXECUTION_PLAN.md`](./DASHBOARD_EXECUTION_PLAN.md)** | **Start here.** Locked scope, phase order 11A→17, timeline, what to do now. |
| **[`SHAHIN_IMPLEMENTATION_PLAN.md`](./SHAHIN_IMPLEMENTATION_PLAN.md)** | Detailed tasks per phase, DB schema, route map, feature checklist. |
| **[`grok-md.md`](./grok-md.md)** | Reference only — what Shahin has, page-by-page. Use when you need to check how a Shahin screen works. |

**Rule of thumb:** Follow `DASHBOARD_EXECUTION_PLAN.md` for order. Use `SHAHIN_IMPLEMENTATION_PLAN.md` for task details. Use `grok-md.md` for Shahin screen reference.

---

## What to Do Right Now

### Step 1 — Read Section 11 in the plan

Open [`SHAHIN_IMPLEMENTATION_PLAN.md`](./SHAHIN_IMPLEMENTATION_PLAN.md) → **"Recommended Start Order"** → first task is **Phase 11A**.

### Step 2 — Start Phase 11A (Dashboard Shell)

This is the foundation before any Shahin ERP modules:

1. Grouped collapsible sidebar
2. Shared `PageHeader` + `DataTable` in `packages/ui`
3. Wire dashboard home with real attendance + jobs data
4. Quick action buttons on home

No new database tables yet — UI and navigation only.

### Step 3 — Then Phase 11B (first real ERP module)

After 11A is done:

1. Migration: `clients` + `ledger_entries`
2. `/dashboard/clients` page
3. Client payments + statement

---

## Also Keep Handy (Project Rules)

| File | Why |
|------|-----|
| [`AGENT.md`](./AGENT.md) | Coding rules (migrations first, RLS, `packages/ui`, etc.) |
| [`PROJECT_TRACKER.md`](./PROJECT_TRACKER.md) | Update after every file you create/change |
| [`docs/05_DATABASE_SCHEMA.md`](./docs/05_DATABASE_SCHEMA.md) | Current DB — extend when you add tables in 11B |

---

## Simple Workflow for Each Phase

```
1. Read phase tasks in SHAHIN_IMPLEMENTATION_PLAN.md
2. Check Shahin details in grok-md.md (if needed)
3. Write migration first (if phase needs DB)
4. Run pnpm db:gen-types
5. Build actions → queries → UI page
6. Update PROJECT_TRACKER.md
7. Mark tasks ✅ in the plan
```

---

## Phase Order (Quick Reference)

| Order | Phase | What |
|-------|-------|------|
| 1 | **11A** | Accessible sidebar + dashboard home (**start here**) |
| 2 | **11B** | Clients CRM + ledger foundation |
| 3 | 12 | Suppliers + purchases |
| 4 | 13 | Tax invoices + GST |
| 5 | 14 | Banks + income/expense |
| 6 | 15 | Financial dashboard (Shahin-style home) |
| 7 | 16 | HR extensions (posts, payments, deposits) |
| 8 | 17 | Reports suite |
| — | Mobile app polish | **After 11A–17** |
| — | 18 | Admin, audit log (deferred) |
| — | 10 | Stripe billing (**skipped — no payment integration**) |

---

## Your Immediate Action

Phases 11A–13 are **done**. Test today’s work: [`TODAY_TESTING_2026-06-24.md`](./TODAY_TESTING_2026-06-24.md)

Tomorrow: say **"start Phase 14"** for Banks + Transactions.

---

## Doc Map (all related files)

```
NEW_START.md                    ← You are here (quick start)
SHAHIN_IMPLEMENTATION_PLAN.md   ← Main build plan (checklist + phases)
grok-md.md                      ← Shahin site audit (reference)
AGENT.md                        ← Project coding rules
PROJECT_TRACKER.md              ← File tracker (update after changes)
docs/05_DATABASE_SCHEMA.md      ← Current database schema
```