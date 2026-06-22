# 📊 Punchless — Project Tracker

> **Last updated:** 2026-06-22 (Added `SHAHIN_IMPLEMENTATION_PLAN.md` — phased Shahin ERP integration plan)
>
> This file tracks every file in the project, what it does, and which phase it belongs to.
> **Rule:** This file MUST be updated whenever any file is created, modified, or deleted.

---

## 🏗️ Phase Progress

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Project Setup | ✅ Done | Monorepo, packages, theming, config |
| 2 | Auth & Company | ✅ Done | Supabase DB, auth, signup/login, dashboard layout |
| 3 | Workshops & Employees | ✅ Done | Full CRUD for workshops (map picker) + employees (workshop assignment) |
| 4 | Attendance Engine (Web) | ✅ Done | Live attendance dashboard, manual sessions, close/delete sessions, stats, date-range queries |
| 5 | Job & Travel Tracking | ✅ Done | Job CRUD, map location, assignment, status workflow |
| 6 | Salary Calculation | ✅ Done | Monthly salary report, single hourly rate calculations across all states, breakdown by state, advance deductions |
| 7 | Salary Advances | ✅ Done | Full CRUD, approve/reject with notes, salary deduction integration, status filters |
| 8 | Mobile App | 🚧 In Progress | Real auth, session guards, live attendance summary, salary + advance request/history, GPS auto clock-in + geofence engine, jobs tab (functional), manual travel/job actions |
| 8.5 | Break System + History + Corrections | ✅ Done | Splash/auth flow, live work/break counters, break in/out, correction requests (mobile + web), history pages with filters, workshop location change detection, background refresh, location permission prompt |
| 9 | Settings & Polish | ⏳ Pending | Company settings, profile, notifications |
| 10 | Stripe Billing | ⏳ Pending | Subscription, usage-based billing |

---

## 📁 Complete File Map

### Root (`/`)

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Root workspace config, DB scripts (`db:gen-types`, `db:push`, `db:pull`, `db:reset`) |
| `turbo.json` | 1 | Turborepo pipeline config (build, dev, lint, clean) |
| `pnpm-workspace.yaml` | 1 | Defines workspace packages: `apps/*`, `packages/*` |
| `.env` | 1 | Root env vars (Supabase URL, keys) — NOT committed |
| `.env.example` | 1 | Template for root `.env` |
| `.gitignore` | 1 | Git ignore rules (node_modules, .env, .next, etc.) |
| `AGENT.md` | 1 | AI agent rules — 14 rules for code style, conventions |
| `DOCS_INDEX.md` | 1 | Index of all documentation files |
| `README.md` | 1 | Project overview and setup instructions |
| `PROJECT_TRACKER.md` | 6 | **This file** — tracks all files and progress |
| `grok-md.md` | 9 | Shahin Motors BMS full website review + Punchless dashboard gap analysis (read-only audit) |
| `SHAHIN_IMPLEMENTATION_PLAN.md` | 11 | Shahin → Punchless phased implementation plan with ✅/🟡/☐ checklist, accessibility UX, DB schema, routes |
| `NEW_START.md` | 11 | Quick-start guide — which MD files to use, phase order, workflow steps |

### Documentation (`/docs/`)

| File | Phase | Description |
|------|-------|-------------|
| `01_PROJECT_OVERVIEW.md` | 1 | Business idea, target users, pricing model |
| `02_ARCHITECTURE.md` | 1 | Tech stack, monorepo structure, data flow |
| `03_GETTING_STARTED.md` | 1 | Setup instructions, env vars, dev commands |
| `04_BUILD_PHASES.md` | 1 | All 10 phases with detailed tasks |
| `05_DATABASE_SCHEMA.md` | 1 | Table definitions, relationships, RLS policies |
| `06_ATTENDANCE_ENGINE.md` | 1 | GPS geofence logic, state machine, background tracking |
| `07_WEB_DASHBOARD.md` | 1 | Dashboard pages, role-based access |
| `08_SALARY_CALCULATION.md` | 1 | Hourly/travel rates, overtime, deductions |
| `09_MOBILE_APP.md` | 1 | Expo app screens, GPS permissions |
| `10_STRIPE_BILLING.md` | 1 | Subscription model, webhooks, usage metering |
| `11_THEMING_AND_COLORS.md` | 1 | CSS variable system, color tokens |

### Supabase (`/supabase/`)

| File | Phase | Description |
|------|-------|-------------|
| `config.toml` | 2 | Supabase local config (project ID: `lwjnkyaihiclbfnukrvn`) |
| `seed.sql` | 2 | Seed data for local development |
| `migrations/.gitkeep` | 2 | Placeholder |
| `migrations/20260207112531_initial_schema.sql` | 2 | **Main schema**: companies, users, workshops, jobs, attendance_sessions, salary_advances + RLS + indexes + trigger |
| `migrations/20260207154949_fix_signup_trigger_schema_qualified.sql` | 2 | Fix: schema-qualified `public.companies`/`public.users` in signup trigger |
| `migrations/20260207165535_add_workshop_id_to_users.sql` | 3 | Added `workshop_id` FK to users table for employee→workshop assignment |
| `migrations/20260208061234_fix_advance_insert_policy.sql` | 7 | Fix: owner/admin can insert advances on behalf of employees + add delete policy |
| `migrations/20260208062002_company_settings_and_monthly_salary.sql` | 7 | Added company settings columns (work_start_time, grace_period, daily_work_hours, working_days) + monthly_salary on users |
| `migrations/20260208070315_drop_users_travel_rate.sql` | 7 | Removed redundant `travel_rate` column from users (single `hourly_rate` now used for workshop/travel/on-site) |
| `migrations/20260214060000_break_and_correction_requests.sql` | 8.5 | Added `break` state to attendance_sessions, new `correction_requests` table with RLS policies |
| `functions/.gitkeep` | 2 | Placeholder for Supabase Edge Functions |

---

### Packages

#### `packages/types/` — Shared TypeScript Types

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Package config, name: `@punchless/types` |
| `tsconfig.json` | 1 | TypeScript config |
| `src/index.ts` | 1 | Barrel export of shared types (UserRole, AttendanceState, etc.) |
| `src/database.types.ts` | 2 | **Auto-generated** Supabase DB types (run `pnpm db:gen-types`) |

#### `packages/config/` — Shared Constants

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Package config, name: `@punchless/config` |
| `tsconfig.json` | 1 | TypeScript config |
| `src/index.ts` | 1 | Constants: GPS config (intervals, accuracy), pricing (₹800/employee), attendance states, roles |

#### `packages/ui/` — Shared UI Components (shadcn pattern)

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Package config, name: `@punchless/ui`, deps: Radix, CVA, clsx |
| `tsconfig.json` | 1 | TypeScript config |
| `src/index.ts` | 1 | Barrel export of all UI components |
| `src/lib/utils.ts` | 1 | `cn()` utility (clsx + tailwind-merge) |
| `src/components/button.tsx` | 1 | Button component with variants (default, destructive, outline, secondary, ghost, link) |
| `src/components/dialog.tsx` | 1 | Dialog/modal component (Radix Dialog) |
| `src/components/alert-dialog.tsx` | 1 | Alert dialog for confirmations (Radix AlertDialog) |
| `src/components/modal.tsx` | 1 | Reusable modal wrapper |
| `src/components/confirm-modal.tsx` | 1 | Confirm/cancel modal with actions |
| `src/components/visually-hidden.tsx` | 1 | Accessibility helper for screen readers |

---

### Web App (`apps/web/`)

#### Config

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Next.js 15 app, deps: Supabase SSR, Lucide, Leaflet |
| `tsconfig.json` | 1 | TypeScript config with path aliases (`@/`, `@punchless/*`) |
| `.env.local` | 2 | Web env vars (Supabase URL, anon key, service role key) — NOT committed |
| `.env.example` | 2 | Template for `.env.local` |
| `next.config.ts` | 1 | Next.js config (transpiles `@punchless/*` packages) |
| `postcss.config.mjs` | 1 | PostCSS config for Tailwind |
| `eslint.config.mjs` | 1 | ESLint config |

#### App Layout & Theming

| File | Phase | Description |
|------|-------|-------------|
| `src/app/layout.tsx` | 1 | Root layout: Inter font, metadata, global CSS |
| `src/app/globals.css` | 1 | **Master theme file**: CSS variables for light/dark mode, attendance states, status colors, sidebar, charts |
| `src/app/page.tsx` | 1 | Landing page (redirects to `/dashboard`) |

#### Auth Pages (`src/app/(auth)/`)

| File | Phase | Description |
|------|-------|-------------|
| `layout.tsx` | 2 | Auth layout: centered card with dark background |
| `login/page.tsx` | 2 | Login form: email + password → `signInWithPassword` → redirect to dashboard |
| `signup/page.tsx` | 2 | Signup form: company name + name + email + password → admin API creates user + company → auto-login |

#### Dashboard Pages (`src/app/(dashboard)/`)

| File | Phase | Description |
|------|-------|-------------|
| `layout.tsx` | 2 | Dashboard shell: Sidebar + Header + content area, fetches current user |
| `dashboard/page.tsx` | 2 | Home page: stats cards (employees count, active sessions, jobs, pending advances) |
| `dashboard/employees/page.tsx` | 3 | Server component: fetches employees + workshops, renders `EmployeeManager` |
| `dashboard/employees/employee-manager.tsx` | 3 | **Client component**: Full CRUD — add/edit/delete employees, workshop dropdown (auto-assign if 1, dropdown if 2+), toggle active/inactive |
| `dashboard/workshops/page.tsx` | 3 | Server component: fetches workshops, renders `WorkshopManager` |
| `dashboard/workshops/workshop-manager.tsx` | 3 | **Client component**: Full CRUD — add/edit/delete workshops with map picker, toggle active/inactive |
| `dashboard/attendance/page.tsx` | 4 | Server component: fetches today's sessions + active sessions + employees + workshops, renders `AttendanceManager` |
| `dashboard/attendance/attendance-manager.tsx` | 4 | **Client component**: Live/Today tabs, stats row (active/workshop/travel/on-site counts), add manual session form, session table with close/delete actions, live duration for open sessions |
| `dashboard/jobs/page.tsx` | 5 | Server component: fetches jobs + employees, renders `JobManager` |
| `dashboard/jobs/job-manager.tsx` | 5 | **Client component**: Job CRUD (add/edit/delete), assign employees, update status (pending/in-progress/completed), map picker for job location |
| `dashboard/salary/page.tsx` | 6 | Server component: reads `?month=` search param, fetches salary report, renders `SalaryManager` |
| `dashboard/salary/salary-manager.tsx` | 6 | **Client component**: Monthly report table, breakdown by hours/type, gross/advance deductions/net salary, month selector via URL params, search & filter |
| `dashboard/advances/page.tsx` | 7 | Server component: fetches advances + employees, renders `AdvanceManager` |
| `dashboard/advances/advance-manager.tsx` | 7 | **Client component**: Full CRUD — create/approve/reject/delete advances, notes modal, status filters (all/pending/approved/rejected), stat cards, search |
| `dashboard/settings/page.tsx` | 7 | Server component: owner-only access, fetches company settings, renders `SettingsManager` |
| `dashboard/settings/settings-manager.tsx` | 7 | **Client component**: Work schedule settings — punch-in time, grace period, daily work hours, working days/month. Saves & recalculates all employee hourly rates |
| `dashboard/history/page.tsx` | 8.5 | Server component: fetches history sessions + employee summaries, renders `HistoryManager` |
| `dashboard/history/history-manager.tsx` | 8.5 | **Client component**: Employee Summary / All Sessions tabs, period filter (Today/7 Days/Month), real-time live counters for active employees, drill into individual employee, last activity shows current state |
| `dashboard/requests/page.tsx` | 8.5 | Server component: fetches correction requests, renders `RequestsManager` |
| `dashboard/requests/requests-manager.tsx` | 8.5 | **Client component**: Pending/All/Approved/Rejected filter, approve/reject with notes, auto-updates session on approval |
| `dashboard/billing/page.tsx` | 2 | ⏳ Placeholder — Phase 10 |

#### Shared Components (`src/components/`)

| File | Phase | Description |
|------|-------|-------------|
| `sidebar.tsx` | 2 | Sidebar nav with role-based menu items (owner sees all, admin sees most, employee sees limited) |
| `dashboard-header.tsx` | 2 | Top header bar: user name + role badge + logout button |
| `map-picker.tsx` | 3 | **Leaflet map component**: click/drag to set location, radius slider with live circle preview, OSM tiles |

#### Utils (`src/lib/utils/`)

| File | Phase | Description |
|------|-------|-------------|
| `formatting.ts` | 4 | `formatDuration()` — minutes→"Xh Ym"; `formatTime()` — ISO→local time; `formatDate()` — ISO→local date; `getLiveDurationMinutes()` — start to now; `STATE_CONFIG` — state labels + color classes (includes break); `formatCurrency()` — INR formatting |

#### Server Utilities (`src/lib/server/`)

| File | Phase | Description |
|------|-------|-------------|
| `protected-action.ts` | 7 | `protectedAction()` HOF — wraps server actions with auth check, role-based permissions, try/catch error handling |

#### Validation Schemas (`src/lib/validations/`)

| File | Phase | Description |
|------|-------|-------------|
| `employee.schema.ts` | 7 | Zod schemas: `createEmployeeSchema`, `updateEmployeeSchema` |
| `workshop.schema.ts` | 7 | Zod schema: `workshopSchema` (name, lat, lng, radius) |
| `attendance.schema.ts` | 7 | Zod schema: `createAttendanceSchema` |
| `job.schema.ts` | 7 | Zod schema: `jobSchema` |
| `advance.schema.ts` | 7 | Zod schema: `createAdvanceSchema` |
| `settings.schema.ts` | 7 | Zod schema: `companySettingsSchema` |

#### Hooks (`src/hooks/`)

| File | Phase | Description |
|------|-------|-------------|
| `use-action.ts` | 7 | `useAction()` — hook for calling server actions with auto toast notifications + loading state; `toastAction()` — wrapper for inline form actions |

#### Action Result (`src/lib/utils/`)

| File | Phase | Description |
|------|-------|-------------|
| `action-result.ts` | 7 | `ActionResult` type + `formAction()` wrapper for void-returning form compatibility |

#### Server Actions (`src/lib/actions/`)

| File | Phase | Description |
|------|-------|-------------|
| `auth.actions.ts` | 2 | `signUp()` — admin API create user + company + auto-login; `login()` — email/password; `logout()` — sign out + redirect |
| `employee.actions.ts` | 3 | `createEmployee()` — admin API + profile insert + workshop assignment; `updateEmployee()` — name/phone/rates/workshop; `toggleEmployeeStatus()`; `deleteEmployee()` — removes auth + profile |
| `workshop.actions.ts` | 3 | `createWorkshop()`; `updateWorkshop()` — name/address/lat/lng/radius; `toggleWorkshopStatus()`; `deleteWorkshop()` |
| `attendance.actions.ts` | 4 | `createAttendanceSession()` — manual session with auto duration calc; `closeAttendanceSession()` — end open session (set end_time to now); `deleteAttendanceSession()` — remove session |
| `job.actions.ts` | 5 | `createJob()` — create job with location/assignment; `updateJob()` — update details/status; `deleteJob()` |
| `advance.actions.ts` | 7 | `createAdvance()` — create advance request; `approveAdvance()` — approve with notes; `rejectAdvance()` — reject with notes; `deleteAdvance()` |
| `settings.actions.ts` | 7 | `updateCompanySettings()` — update work schedule + recalculate all employee hourly rates from monthly salary |
| `correction.actions.ts` | 8.5 | `approveCorrectionRequest()` — approve + auto-update session times; `rejectCorrectionRequest()` — reject with notes |

#### Server Queries (`src/lib/queries/`)

| File | Phase | Description |
|------|-------|-------------|
| `auth.queries.ts` | 2 | `getAuthUser()` — Supabase auth user; `getCurrentUser()` — user + company join; `getCurrentCompany()` |
| `employee.queries.ts` | 3 | `getEmployees()` — all employees with workshop name join |
| `workshop.queries.ts` | 3 | `getWorkshops()` — all workshops ordered by created_at |
| `attendance.queries.ts` | 4 | `getTodayAttendance()` — today's sessions with employee/workshop/job joins; `getActiveSessions()` — open sessions (no end_time); `getAttendanceByDateRange()` — date-filtered; `getAttendanceSummary()` — grouped by employee+workshop+state with total minutes |
| `job.queries.ts` | 5 | `getJobs()` — list all jobs with assigned user details; `getJobById()` — get single job details |
| `advance.queries.ts` | 7 | `getAdvances()` — all advances with employee/approver name joins; `getApprovedAdvancesForMonth()` — total for salary deduction; `getPendingAdvanceCount()` — for dashboard stats |
| `settings.queries.ts` | 7 | `getCompanySettings()` — work_start_time, grace_period, daily_work_hours, working_days_per_month |
| `salary.queries.ts` | 6 | `getSalaryReport()` — aggregates attendance hours by type (workshop/travel/onsite) × rates per employee for a specific month, includes approved advance deductions, calculates gross/net salary |
| `history.queries.ts` | 8.5 | `getHistorySessions()` — all sessions with employee/workshop/job joins; `getEmployeeSummaries()` — grouped by employee with live duration; `getEmployeeHistory()` — single employee sessions |
| `correction.queries.ts` | 8.5 | `getCorrectionRequests()` — all requests with employee details; `getPendingRequestCount()` — for dashboard badge |

#### Supabase Clients (`src/lib/supabase/`)

| File | Phase | Description |
|------|-------|-------------|
| `client.ts` | 2 | Browser Supabase client (`createBrowserClient`) |
| `server.ts` | 2 | SSR Supabase client (reads cookies for auth session) |
| `admin.ts` | 2 | Service-role client (bypasses RLS, used for admin operations) |

#### API Routes (`src/app/api/`)

| File | Phase | Description |
|------|-------|-------------|
| `api/history/route.ts` | 8.5 | GET endpoint for client-side history fetching with date range + optional employee filter |

#### Middleware

| File | Phase | Description |
|------|-------|-------------|
| `src/middleware.ts` | 2 | Session refresh + route protection: `/login`, `/signup` public; `/dashboard/*` requires auth |

---

### Mobile App (`apps/mobile/`) — 🚧 Core Connected (Phase 8 in progress)

#### Config

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 8 | Expo SDK 54 app (iOS Expo Go compatible), deps: expo-router, expo-location, Supabase, Zustand, Lucide RN |
| `tsconfig.json` | 1 | TypeScript config |
| `app.json` | 8 | Expo config: light UI mode, scheme, plugins (expo-router, expo-location), iOS/Android location permissions |
| `.env` | 1 | Mobile env vars — NOT committed |
| `.env.example` | 1 | Template for `.env` |

#### Screens

| File | Phase | Status | Description |
|------|-------|--------|-------------|
| `app/index.tsx` | 8.5 | ✅ Functional | Root index — redirects to login or home based on auth state (fixes "unmatched route" error) |
| `app/_layout.tsx` | 8.5 | ✅ Functional | Root layout: 2-second branded splash screen, auth session guard, location permission modal prompt, GPS tracking init |
| `app/(auth)/_layout.tsx` | 1 | ✅ Functional | Auth stack layout |
| `app/(auth)/login.tsx` | 8 | ✅ Functional | Real Supabase email/password login, error message, loading state |
| `app/(tabs)/_layout.tsx` | 8.5 | ✅ Functional | Tab navigator: Home, Attendance, History, Salary, Requests, Profile — Lucide icons |
| `app/(tabs)/home.tsx` | 8.5 | ✅ Functional | **Live HH:MM:SS work counter** (ticks every second), break counter, status badge, ☕ Break In / 🔔 Break Out buttons, today's summary (workshop/travel/on-site/break), job actions, end shift |
| `app/(tabs)/attendance.tsx` | 8 | ✅ Functional | Monthly calendar view with attendance data |
| `app/(tabs)/history.tsx` | 8.5 | ✅ Functional | Employee's own clock in/out history, period filter (Today/7 Days/Month), day-wise grouping with expandable sessions |
| `app/(tabs)/requests.tsx` | 8.5 | ✅ Functional | Correction request system — submit break/session corrections, select session to correct, enter corrected times + reason, view past requests with status |
| `app/(tabs)/jobs.tsx` | 8 | ✅ Functional | Active/All tabs, job cards with status badge, Navigate + Call + START/ARRIVED/FINISH buttons, live HH:MM:SS timers for travel & on-site, time summary, auto-refresh every 15s, job status auto-updates (in_progress/completed) |
| `app/(tabs)/salary.tsx` | 8 | ✅ Functional | Monthly salary breakdown + advance request form + advance history |
| `app/(tabs)/profile.tsx` | 8 | ✅ Functional | Logged-in employee profile + logout |

#### Libraries, Services & Stores

| File | Phase | Description |
|------|-------|-------------|
| `lib/supabase.ts` | 3 | Supabase client configured for React Native (AsyncStorage, no URL detection) |
| `lib/services/auth.service.ts` | 8 | `signInWithEmail()`, `signOutUser()`, `getSessionUserProfile()` |
| `lib/services/attendance.service.ts` | 8.5 | `getTodayAttendanceSummary()` — current state + workshop/travel/on-site/break minutes + currentSessionStart for live counter |
| `lib/services/salary.service.ts` | 8 | `getMySalaryReport()` — gross, advances, net for selected month |
| `lib/services/advance.service.ts` | 8 | `requestAdvance()` + `getMyAdvances()` |
| `lib/services/workshop.service.ts` | 3 | `getActiveWorkshops()`, `getDistanceMeters()` (Haversine), `findNearestWorkshop()` — geofence helpers |
| `lib/services/job.service.ts` | 8 | `getMyJobs()`, `getActiveJobs()`, `getJobTimeSummary()` — travel/on-site/total time per job with active session detection, `updateJobStatus()` — mark in_progress/completed |
| `lib/services/location.service.ts` | 8 | GPS permission helpers, `startBackgroundTracking()`, `stopBackgroundTracking()`, `getCurrentLocation()` — expo-location wrapper |
| `lib/services/geofence.service.ts` | 8.5 | **Core attendance engine**: `processLocation()` — auto workshop enter/exit with grace period + workshop location change detection; `startTravel()`, `arriveAtJob()`, `completeJob()`, `finishJob()`, `endShift()`, `startBreak()`, `endBreak()` — manual hybrid transitions; `forceRefreshWorkshops()` — cache invalidation; 2-min workshop cache TTL |
| `lib/services/history.service.ts` | 8.5 | `getAttendanceHistory()` — fetch sessions for date range; `groupSessionsByDate()` — group into day summaries |
| `lib/services/correction.service.ts` | 8.5 | `getMyCorrectionRequests()`, `submitBreakCorrection()`, `submitSessionCorrection()` — correction request CRUD |
| `lib/services/calendar.service.ts` | 8 | Monthly attendance calendar data |
| `lib/tasks/background-location.ts` | 8.5 | TaskManager background task — processes GPS updates + refreshes attendance summary in background (lightweight, battery efficient) |
| `lib/stores/auth.store.ts` | 8 | Zustand auth/session store with initialize, login, logout, refresh |
| `lib/stores/attendance.store.ts` | 8.5 | Zustand attendance summary store — includes breakMinutes + currentSessionStart for live counter |
| `lib/stores/location.store.ts` | 8 | Zustand GPS tracking store — permission state, tracking on/off, last location |
| `lib/utils/formatting.ts` | 8 | Mobile helpers: `formatMinutes()`, `formatCurrency()`, `getCurrentMonthString()` |

---

## 🗄️ Database Tables

| Table | Phase | Description |
|-------|-------|-------------|
| `companies` | 2 | Multi-tenant company records (name, subscription status, Stripe IDs) |
| `users` | 2 | All users (owner/admin/employee), linked to `auth.users`, has `company_id` + `workshop_id` (Phase 3) |
| `workshops` | 2 | Workshop locations (name, address, lat, lng, radius, is_active) |
| `jobs` | 2 | Job records (title, customer info, location, status, assigned employee) |
| `attendance_sessions` | 2 | Time tracking records (employee, state: workshop/travel/on_site_job/off_duty/**break**, workshop, job, start/end time, duration) |
| `salary_advances` | 2 | Advance requests (amount, reason, status, approved_by) |
| `correction_requests` | 8.5 | Employee correction requests (session_id, original/requested times, reason, status: pending/approved/rejected, admin review) |

---

## 🔑 Key Integration Points

```
Signup Flow:     signup page → auth.actions.ts → admin.ts (service role) → auth.users + companies + users
Login Flow:      login page → auth.actions.ts → server.ts (SSR) → redirect to dashboard
Route Protection: middleware.ts → checks session → redirects to /login if unauthenticated
Employee Create: employee-manager.tsx → employee.actions.ts → admin.ts → auth.users + users
Workshop Create: workshop-manager.tsx → workshop.actions.ts → server.ts → workshops table
Map Picker:      workshop-manager.tsx → map-picker.tsx (Leaflet) → lat/lng → workshop.actions.ts
Workshop Assign: employee-manager.tsx → dropdown (if >1) or auto-assign (if 1) → employee.actions.ts
Job Create:      job-manager.tsx → map-picker.tsx → job.actions.ts → jobs table
Salary Report:   salary-manager.tsx → salary.queries.ts → attendance_sessions sum + advance deductions → display
Advance Flow:    advance-manager.tsx → advance.actions.ts → salary_advances table → approve/reject → deducted in salary.queries.ts
Mobile Login:    app/(auth)/login.tsx → auth.store.ts → auth.service.ts → supabase.auth.signInWithPassword
Mobile Home:     app/(tabs)/home.tsx → attendance.service.ts → attendance_sessions (today summary + live state) + geofence.service.ts (manual travel/job/end-shift actions) + location.store.ts (GPS status)
Mobile Jobs:     app/(tabs)/jobs.tsx → job.service.ts → jobs table (assigned jobs with status/actions)
Mobile GPS:      _layout.tsx → background-location.ts (TaskManager) → geofence.service.ts → processLocation() → auto workshop enter/exit + session open/close
Mobile Salary:   app/(tabs)/salary.tsx → salary.service.ts + advance.service.ts → salary/advance data + request submit
Mobile Break:    app/(tabs)/home.tsx → geofence.service.ts → startBreak()/endBreak() → close workshop session + open break session → live counter pauses/resumes
Mobile History:  app/(tabs)/history.tsx → history.service.ts → attendance_sessions (grouped by date with summaries)
Mobile Requests: app/(tabs)/requests.tsx → correction.service.ts → correction_requests table → admin reviews on web
Web History:     dashboard/history → history.queries.ts → employee summaries with live duration + all sessions
Web Requests:    dashboard/requests → correction.queries.ts + correction.actions.ts → approve (auto-updates session) / reject
```

---

## 📦 External Dependencies (Key ones)

| Package | Where | Purpose |
|---------|-------|---------|
| `@supabase/supabase-js` | web, mobile | Database + Auth client |
| `@supabase/ssr` | web | Server-side rendering support |
| `react-leaflet` + `leaflet` | web | Map picker for workshop locations |
| `lucide-react` | web | Icons (ONLY icon library allowed) |
| `lucide-react-native` | mobile | Icons for mobile |
| `zustand` | web, mobile | State management |
| `expo-location` | mobile | GPS access |
| `expo-task-manager` | mobile | Background GPS tracking |
| `@radix-ui/*` | packages/ui | Accessible UI primitives |
| `class-variance-authority` | packages/ui | Component variant system |
