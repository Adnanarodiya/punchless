# NEW_START — Where to Begin (Shahin → Punchless)

> Quick guide: which files to read, what to do first, and how to work through each phase.

---

## Which MD File to Use When

| File | Use it for |
|------|------------|
| **[`SHAHIN_IMPLEMENTATION_PLAN.md`](./SHAHIN_IMPLEMENTATION_PLAN.md)** | **Start here.** Your working plan — what to build, in what order, with ✅/🟡/☐ status, routes, DB tables, and tasks. |
| **[`grok-md.md`](./grok-md.md)** | Reference only — what Shahin has, page-by-page. Use when you need to check how a Shahin screen works. |

**Rule of thumb:** Build from `SHAHIN_IMPLEMENTATION_PLAN.md`. Look at `grok-md.md` when you need Shahin details.

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
| 9 | 18 | Admin, audit log, phone login |
| Last | 10 | Stripe billing |

---

## Your Immediate Action

Say: **"start Phase 11A"**

That kicks off the first PR: accessible sidebar + dashboard home wiring. Do not jump to clients or invoices before 11A is done.

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