# 📚 DOCS INDEX — Find What You Need

> This file is your **table of contents** for all project documentation.
> All doc files are inside the `docs/` folder.

---

## Quick Navigation

| # | File | What's Inside | Read When... |
|---|------|--------------|-------------|
| 📋 | `docs/01_PROJECT_OVERVIEW.md` | What are we building, who uses it, tech stack, pricing | You want a quick summary of the entire project |
| 🏗️ | `docs/02_ARCHITECTURE.md` | How all parts connect, data flow, monorepo structure, RLS | You want to understand how web, mobile, supabase, and shared packages work together |
| 🚀 | `docs/03_GETTING_STARTED.md` | Step-by-step setup guide, installing tools, creating apps | You're starting the project or setting up on a new machine |
| 📅 | `docs/04_BUILD_PHASES.md` | Phase-by-phase roadmap with checklists (Stripe = LAST) | You want to know what to build next and in what order |
| 🗄️ | `docs/05_DATABASE_SCHEMA.md` | All tables, columns, RLS policies, indexes | You're working on database, migrations, or queries |
| ⏱️ | `docs/06_ATTENDANCE_ENGINE.md` | GPS tracking, state machine, edge cases, hybrid approach | You're building the attendance/tracking feature |
| 🖥️ | `docs/07_WEB_DASHBOARD.md` | Dashboard pages, features, route structure, role-based UI | You're building the Next.js admin dashboard |
| 💰 | `docs/08_SALARY_CALCULATION.md` | Salary formula, overtime, advance deduction, edge function | You're building salary calculation logic |
| 📱 | `docs/09_MOBILE_APP.md` | App screens, background GPS, offline support, notifications | You're building the Expo mobile app |
| 💳 | `docs/10_STRIPE_BILLING.md` | Stripe setup, webhooks, billing page (DO LAST!) | You're in Phase 10 and everything else is done |
| 🎨 | `docs/11_THEMING_AND_COLORS.md` | All CSS variables, color usage rules, dark mode, attendance state colors | You need to use a color, status badge, or want to change the theme |
| 📄 | `docs/12_STATEMENT_UI_PLAN.md` | **🔴 Priority** — Shahin-style statement UI redesign (client + supplier), 7 phases, print, migration | You're building or updating client/supplier statement pages |

---

## Other Root Files

| File | Purpose |
|------|---------|
| `AGENT.md` | Rules for how we work on this project (read FIRST) |
| `DOCS_INDEX.md` | This file — your guide to finding docs |
| `Workshop_Attendance_SaaS_Full_Plan.md` | Original full plan document |
| `Workshop_Attendance_SaaS_Idea_Story.md` | Original idea/story document |

---

## 🔑 Key Rules (Quick Reminder)

1. **Always read `AGENT.md` first** — it has all the working rules
2. **Follow `04_BUILD_PHASES.md`** — build in order, one phase at a time
3. **Stripe is Phase 10** — the very last thing
4. **Check relevant doc** before starting any feature
5. **Database first** — write migrations before UI
6. **Zustand** for state management — no Redux, no Context API for global state
7. **Lucide icons ONLY** — `lucide-react` (web) + `lucide-react-native` (mobile). No other icon library.
8. **All UI components in `packages/ui/`** — shadcn/ui pattern (Radix + CVA + cn). Never in `apps/`.
9. **Supabase DB types auto-generated** — `supabase gen types` → `packages/types/src/database.types.ts`
10. **No direct colors** — always use CSS variables from `globals.css`. See `docs/11_THEMING_AND_COLORS.md`

---

## How to Use These Docs

```
"I want to start the project"          → Read 03
"What should I build next?"            → Read 04
"How does attendance work?"            → Read 06
"What tables do I need?"               → Read 05
"How is salary calculated?"            → Read 08
"What pages does the dashboard have?"  → Read 07
"What screens does the mobile app have?" → Read 09
"How does everything connect?"         → Read 02
"What are the project rules?"          → Read AGENT.md
```
