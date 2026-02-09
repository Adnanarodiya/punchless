# 📅 04 — Build Phases (Step-by-Step Roadmap)

> ⚠️ **Rule: Stripe Billing is Phase 10 — the VERY LAST thing we build.**

---

## Phase 1: Project Setup ✅
**Goal:** Get the monorepo running with all apps scaffolded.

- [ ] Initialize Turborepo monorepo
- [ ] Create `apps/web` (Next.js)
- [ ] Create `apps/mobile` (Expo)
- [ ] Create `packages/types`, `packages/config`, `packages/ui`
- [ ] Setup Supabase project (local + cloud)
- [ ] Configure environment variables
- [ ] Verify `turbo dev` runs all apps

**Done when:** Both apps run locally, Supabase is connected.

---

## Phase 2: Authentication & Company Setup
**Goal:** Users can sign up, create a company, and invite employees.

- [ ] Supabase Auth setup (email/password)
- [ ] Owner sign-up flow → auto-create company
- [ ] `companies` table + migration
- [ ] `users` table + migration (with `company_id`, `role`)
- [ ] RLS policies for both tables
- [ ] Owner can add employees from dashboard
- [ ] Employee can log in on mobile app
- [ ] Role-based access (owner vs admin vs employee)

**Done when:** Owner signs up → company created → adds employee → employee logs into mobile app.

---

## Phase 3: Workshop & Location Setup
**Goal:** Owner can register workshop locations.

- [ ] `workshops` table (lat, lng, radius, company_id)
- [ ] Dashboard UI: Add/edit workshop location on map
- [ ] RLS policies
- [ ] Mobile app: Can read workshop location for GPS comparison

**Done when:** Owner adds workshop with GPS coordinates and radius.

---

## Phase 4: Attendance Engine (Core Feature)
**Goal:** Automatic GPS-based attendance tracking.

- [ ] `attendance_sessions` table + migration
- [ ] Mobile: Background GPS tracking (expo-location)
- [ ] Mobile: Detect enter/exit workshop geofence
- [ ] State machine: `OFF_DUTY → WORKSHOP → OFF_DUTY`
- [ ] Record session start/end times automatically
- [ ] Dashboard: View live attendance status
- [ ] Dashboard: View attendance history

**Done when:** Employee walks into workshop → auto marked present. Walks out → session ends. Owner sees it on dashboard.

---

## Phase 5: Job & Travel Tracking
**Goal:** Owner assigns jobs, employee travel & work time is tracked.

- [ ] `jobs` table (lat, lng, radius, status, company_id)
- [ ] Dashboard: Create job with location
- [ ] Dashboard: Assign job to employee
- [ ] Mobile: See assigned jobs
- [ ] Mobile: Start travel → state: `TRAVEL`
- [ ] Mobile: Arrive at job → state: `ON_SITE_JOB`
- [ ] Mobile: Complete job → state: `TRAVEL` (return)
- [ ] Full state machine: `WORKSHOP → TRAVEL → ON_SITE_JOB → TRAVEL → WORKSHOP`
- [ ] All transitions recorded with timestamps

**Done when:** Full job lifecycle works — assign, travel, work, return — all tracked.

---

## Phase 6: Salary Calculation
**Goal:** Auto-calculate salary based on tracked time.

- [ ] Supabase Edge Function: Calculate daily/monthly salary
- [ ] Sum workshop time + travel time + job time
- [ ] Apply hourly_rate (single rate for workshop/travel/on-site)
- [ ] Calculate overtime (time beyond daily shift)
- [ ] Dashboard: Salary report per employee
- [ ] Dashboard: Monthly salary summary
- [ ] Mobile: Employee can view own salary breakdown

**Done when:** Accurate salary calculated from attendance data. Both owner and employee can view it.

---

## Phase 7: Salary Advance
**Goal:** Employees can request advance, owners approve/reject.

- [ ] `salary_advances` table + migration
- [ ] Mobile: Employee sends advance request
- [ ] Dashboard: Owner sees pending requests
- [ ] Dashboard: Approve/reject with notes
- [ ] Advance amount deducted from final salary
- [ ] Mobile: Employee sees advance history & status

**Done when:** Full advance request flow works end-to-end.

---

## Phase 8: Dashboard Polish
**Goal:** Make the web dashboard production-ready.

- [ ] Clean UI with proper layout (sidebar, header)
- [ ] Employee management page (add, edit, deactivate)
- [ ] Attendance overview page (daily/weekly/monthly)
- [ ] Job management page
- [ ] Salary reports page
- [ ] Advance management page
- [ ] Settings page (company info, workshop locations)
- [ ] Responsive design

**Done when:** Dashboard is clean, usable, and covers all features.

---

## Phase 9: Mobile App Polish
**Goal:** Make the mobile app production-ready.

- [ ] Clean UI with proper navigation
- [ ] Home screen: Current status + today's summary
- [ ] Jobs screen: Assigned jobs with actions
- [ ] Salary screen: Monthly breakdown
- [ ] Advance screen: Request + history
- [ ] Profile screen
- [ ] Push notifications (job assigned, advance approved)
- [ ] Battery optimization for background GPS

**Done when:** Mobile app is smooth, battery-efficient, and covers all employee features.

---

## Phase 10: Stripe Billing (LAST!) 💳
**Goal:** Implement subscription billing.

- [ ] Stripe account setup
- [ ] Create product: ₹800/employee/month
- [ ] Quantity-based subscription
- [ ] Dashboard: Billing page
- [ ] Webhook: Handle payment success/failure
- [ ] Auto-count active employees → update Stripe quantity
- [ ] Trial period (optional)
- [ ] Invoice history

**Done when:** Workshops are charged correctly based on active employee count.

---

## Summary Timeline

| Phase | What | Depends On |
|-------|------|-----------|
| 1 | Project Setup | Nothing |
| 2 | Auth & Company | Phase 1 |
| 3 | Workshop Locations | Phase 2 |
| 4 | Attendance Engine | Phase 3 |
| 5 | Job & Travel | Phase 4 |
| 6 | Salary Calculation | Phase 5 |
| 7 | Salary Advance | Phase 2 |
| 8 | Dashboard Polish | Phase 2-7 |
| 9 | Mobile Polish | Phase 4-7 |
| 10 | Stripe Billing | Phase 1-9 (ALL) |

---

## Related Docs

- Getting started → `03_GETTING_STARTED.md`
- Database schema → `05_DATABASE_SCHEMA.md`
- Architecture → `02_ARCHITECTURE.md`
