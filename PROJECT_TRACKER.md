# 📊 Punchless — Project Tracker

> **Last updated:** 2026-02-07 (Phase 6 complete, Phase 7 in progress)
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
| 6 | Salary Calculation | ✅ Done | Monthly salary report, hourly/travel rate calculations, breakdown by state |
| 7 | Salary Advances | ⏳ Pending | Request, approve/reject advances |
| 8 | Mobile App | ⏳ Pending | Login, GPS tracking, auto clock-in/out |
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
| `dashboard/salary/page.tsx` | 6 | Server component: fetches salary report for selected month, renders `SalaryManager` |
| `dashboard/salary/salary-manager.tsx` | 6 | **Client component**: Monthly report table, breakdown by hours/type, total salary stats, search & filter |
| `dashboard/advances/page.tsx` | 2 | ⏳ Placeholder — Phase 7 |
| `dashboard/settings/page.tsx` | 2 | ⏳ Placeholder — Phase 9 |
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
| `formatting.ts` | 4 | `formatDuration()` — minutes→"Xh Ym"; `formatTime()` — ISO→local time; `formatDate()` — ISO→local date; `getLiveDurationMinutes()` — start to now; `STATE_CONFIG` — state labels + color classes; `formatCurrency()` — INR formatting |

#### Server Actions (`src/lib/actions/`)

| File | Phase | Description |
|------|-------|-------------|
| `auth.actions.ts` | 2 | `signUp()` — admin API create user + company + auto-login; `login()` — email/password; `logout()` — sign out + redirect |
| `employee.actions.ts` | 3 | `createEmployee()` — admin API + profile insert + workshop assignment; `updateEmployee()` — name/phone/rates/workshop; `toggleEmployeeStatus()`; `deleteEmployee()` — removes auth + profile |
| `workshop.actions.ts` | 3 | `createWorkshop()`; `updateWorkshop()` — name/address/lat/lng/radius; `toggleWorkshopStatus()`; `deleteWorkshop()` |
| `attendance.actions.ts` | 4 | `createAttendanceSession()` — manual session with auto duration calc; `closeAttendanceSession()` — end open session (set end_time to now); `deleteAttendanceSession()` — remove session |
| `job.actions.ts` | 5 | `createJob()` — create job with location/assignment; `updateJob()` — update details/status; `deleteJob()` |

#### Server Queries (`src/lib/queries/`)

| File | Phase | Description |
|------|-------|-------------|
| `auth.queries.ts` | 2 | `getAuthUser()` — Supabase auth user; `getCurrentUser()` — user + company join; `getCurrentCompany()` |
| `employee.queries.ts` | 3 | `getEmployees()` — all employees with workshop name join |
| `workshop.queries.ts` | 3 | `getWorkshops()` — all workshops ordered by created_at |
| `attendance.queries.ts` | 4 | `getTodayAttendance()` — today's sessions with employee/workshop/job joins; `getActiveSessions()` — open sessions (no end_time); `getAttendanceByDateRange()` — date-filtered; `getAttendanceSummary()` — grouped by employee+workshop+state with total minutes |
| `job.queries.ts` | 5 | `getJobs()` — list all jobs with assigned user details; `getJobById()` — get single job details |
| `salary.queries.ts` | 6 | `getSalaryReport()` — aggregates attendance hours by type (workshop/travel/onsite) × rates per employee for a specific month |

#### Supabase Clients (`src/lib/supabase/`)

| File | Phase | Description |
|------|-------|-------------|
| `client.ts` | 2 | Browser Supabase client (`createBrowserClient`) |
| `server.ts` | 2 | SSR Supabase client (reads cookies for auth session) |
| `admin.ts` | 2 | Service-role client (bypasses RLS, used for admin operations) |

#### Middleware

| File | Phase | Description |
|------|-------|-------------|
| `src/middleware.ts` | 2 | Session refresh + route protection: `/login`, `/signup` public; `/dashboard/*` requires auth |

---

### Mobile App (`apps/mobile/`) — ⚠️ Mostly Placeholder

#### Config

| File | Phase | Description |
|------|-------|-------------|
| `package.json` | 1 | Expo app, deps: expo-router, expo-location, Supabase, Zustand, Lucide RN |
| `tsconfig.json` | 1 | TypeScript config |
| `app.json` | 1 | Expo config: scheme, plugins (expo-router, expo-location) |
| `.env` | 1 | Mobile env vars — NOT committed |
| `.env.example` | 1 | Template for `.env` |

#### Screens (All placeholder UI — not functional yet)

| File | Phase | Status | Description |
|------|-------|--------|-------------|
| `app/_layout.tsx` | 1 | 🎨 UI only | Root layout: Stack navigator, dark theme |
| `app/(auth)/_layout.tsx` | 1 | 🎨 UI only | Auth stack layout |
| `app/(auth)/login.tsx` | 1 | 🎨 UI only | Login screen — **buttons don't work yet** |
| `app/(tabs)/_layout.tsx` | 1 | 🎨 UI only | Tab navigator: Home, Jobs, Salary, Profile |
| `app/(tabs)/home.tsx` | 1 | 🎨 UI only | Home screen — static "OFF DUTY" + "0h 0m" |
| `app/(tabs)/jobs.tsx` | 1 | 🎨 UI only | Jobs list placeholder |
| `app/(tabs)/salary.tsx` | 1 | 🎨 UI only | Salary view placeholder |
| `app/(tabs)/profile.tsx` | 1 | 🎨 UI only | Profile placeholder |

#### Libraries (Ready but not connected to screens)

| File | Phase | Description |
|------|-------|-------------|
| `lib/supabase.ts` | 3 | Supabase client configured for React Native (AsyncStorage, no URL detection) |
| `lib/services/workshop.service.ts` | 3 | `getActiveWorkshops()`, `getDistanceMeters()` (Haversine), `findNearestWorkshop()` — geofence helpers ready for Phase 8 |

---

## 🗄️ Database Tables

| Table | Phase | Description |
|-------|-------|-------------|
| `companies` | 2 | Multi-tenant company records (name, subscription status, Stripe IDs) |
| `users` | 2 | All users (owner/admin/employee), linked to `auth.users`, has `company_id` + `workshop_id` (Phase 3) |
| `workshops` | 2 | Workshop locations (name, address, lat, lng, radius, is_active) |
| `jobs` | 2 | Job records (title, customer info, location, status, assigned employee) |
| `attendance_sessions` | 2 | Time tracking records (employee, state, workshop, job, start/end time, duration) |
| `salary_advances` | 2 | Advance requests (amount, reason, status, approved_by) |

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
Salary Report:   salary-manager.tsx → salary.queries.ts → attendance_sessions sum → display
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
