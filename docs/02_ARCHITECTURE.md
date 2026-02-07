# 🏗️ 02 — Architecture & How Everything Connects

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    TURBOREPO MONOREPO                │
│                                                     │
│  ┌──────────────┐          ┌──────────────────┐     │
│  │  apps/web     │          │  apps/mobile      │    │
│  │  (Next.js)    │          │  (Expo/RN)        │    │
│  │  Dashboard    │          │  Employee App     │    │
│  │  Owner+Admin  │          │  GPS Tracking     │    │
│  └──────┬───────┘          └────────┬──────────┘    │
│         │                           │               │
│         │    ┌──────────────────┐   │               │
│         │    │  packages/       │   │               │
│         ├───►│  ui/  types/     │◄──┤               │
│         │    │  config/         │   │               │
│         │    └──────────────────┘   │               │
│         │                           │               │
│         └───────────┬───────────────┘               │
│                     │                               │
│                     ▼                               │
│         ┌──────────────────────┐                    │
│         │     SUPABASE         │                    │
│         │  ┌────────────────┐  │                    │
│         │  │  PostgreSQL DB  │  │                    │
│         │  │  (RLS enabled)  │  │                    │
│         │  └────────────────┘  │                    │
│         │  ┌────────────────┐  │                    │
│         │  │  Auth (JWT)     │  │                    │
│         │  └────────────────┘  │                    │
│         │  ┌────────────────┐  │                    │
│         │  │ Edge Functions  │  │                    │
│         │  └────────────────┘  │                    │
│         │  ┌────────────────┐  │                    │
│         │  │  Realtime       │  │                    │
│         │  └────────────────┘  │                    │
│         └──────────────────────┘                    │
│                     │                               │
│                     ▼                               │
│         ┌──────────────────────┐                    │
│         │   STRIPE (Phase 10)  │                    │
│         │   Billing & Payments │                    │
│         └──────────────────────┘                    │
└─────────────────────────────────────────────────────┘
```

---

## How The Pieces Connect

### 1. Monorepo (Turborepo)

The entire project lives in **one repository** managed by Turborepo.

```
workshop-saas/
├── apps/
│   ├── web/            → Next.js Dashboard (Owner & Admin)
│   └── mobile/         → Expo App (Employee)
├── packages/
│   ├── ui/             → Shared buttons, cards, inputs (used by both apps)
│   ├── types/          → TypeScript interfaces (User, Company, Job, etc.)
│   └── config/         → Shared env variables, Supabase client config
├── supabase/
│   ├── migrations/     → SQL migration files (table creation, RLS)
│   ├── functions/      → Edge Functions (salary calc, etc.)
│   └── seed.sql        → Test data for development
├── turbo.json          → Turborepo pipeline config
└── package.json        → Root dependencies
```

### 2. Why Monorepo?

- **Shared Types**: `packages/types/` defines `User`, `Company`, `Job`, `AttendanceSession` etc. Both `apps/web` and `apps/mobile` import from here. Change once → updates everywhere.
- **Shared UI**: Common components like buttons, status badges live in `packages/ui/`.
- **Shared Config**: Supabase client initialization, env variable handling in `packages/config/`.
- **One command builds all**: `turbo run build` builds everything.

### 3. Data Flow

```
Employee opens mobile app
        │
        ▼
Supabase Auth → JWT token issued
        │
        ▼
App reads GPS location continuously
        │
        ▼
GPS enters workshop radius?
  YES → Create attendance_session (state: WORKSHOP)
  NO  → State stays OFF_DUTY
        │
        ▼
Owner assigns job from web dashboard
        │
        ▼
Employee starts travel → state: TRAVEL
        │
        ▼
Employee reaches job site → state: ON_SITE_JOB
        │
        ▼
Job completed → state: TRAVEL (back)
        │
        ▼
Reaches workshop → state: WORKSHOP
        │
        ▼
Leaves workshop → state: OFF_DUTY
        │
        ▼
All sessions recorded with timestamps
        │
        ▼
Salary = SUM(all session durations) × rate
Overtime = Total - Daily shift hours
```

### 4. Authentication Flow

```
Sign Up (Owner) → Supabase Auth creates user
                → Trigger creates company row
                → Owner role assigned
                → Owner invites employees

Employee Invite → Owner adds employee from dashboard
               → Employee gets invite/credentials
               → Employee logs into mobile app
               → Supabase Auth + RLS restricts to own company data
```

### 5. Multi-Tenancy via RLS

Every query is automatically filtered by `company_id`:

```sql
-- Example RLS policy
CREATE POLICY "Users can only see own company data"
ON users
FOR SELECT
USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

This means:
- Company A's owner CANNOT see Company B's employees
- Employee from Company A CANNOT see Company B's jobs
- All enforced at database level (not application code)

### 6. Web Dashboard ↔ Supabase

```
Next.js (apps/web)
    │
    ├── lib/supabase/client.ts → Browser Supabase client
    ├── lib/supabase/server.ts → Server-side Supabase client
    │
    ├── lib/actions/           → Server Actions (WRITE operations)
    │   ├── auth.actions.ts       login, signup, logout
    │   ├── employee.actions.ts   add, edit, deactivate
    │   ├── job.actions.ts        create, assign jobs
    │   ├── attendance.actions.ts manual session close
    │   ├── salary.actions.ts     trigger salary calc
    │   ├── advance.actions.ts    approve/reject advances
    │   └── ... one file per feature
    │
    ├── lib/queries/           → Data Fetching (READ operations)
    │   ├── employee.queries.ts   list/get employees
    │   ├── attendance.queries.ts attendance history
    │   ├── salary.queries.ts     salary reports
    │   └── ... one file per feature
    │
    └── Calls Edge Functions for complex logic (salary calc)
```

### 7. Mobile App ↔ Supabase

```
Expo App (apps/mobile)
    │
    ├── lib/supabase.ts        → Supabase client
    │
    ├── lib/services/          → All logic (one file per feature)
    │   ├── auth.service.ts       login, session
    │   ├── attendance.service.ts start/end sessions
    │   ├── location.service.ts   GPS + geofence logic
    │   ├── job.service.ts        fetch/update jobs
    │   ├── salary.service.ts     fetch salary
    │   ├── advance.service.ts    request advances
    │   └── ... one file per feature
    │
    ├── GPS tracking via expo-location
    ├── Supabase Realtime for live job assignments
    └── Offline queue for poor connectivity
```

> **Key Rule:** Every feature has its OWN file. No mixing auth logic with job logic. See `AGENT.md` for details.

---

## Related Docs

- Database schema → `05_DATABASE_SCHEMA.md`
- Attendance engine → `06_ATTENDANCE_ENGINE.md`
- Getting started → `03_GETTING_STARTED.md`
