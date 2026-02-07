# 🚀 Workshop Attendance SaaS -- Full Build Plan (Monorepo)

## 1. Vision

Build a **multi-tenant SaaS** where workshops can: - Track employee
attendance automatically (GPS-based) - Track travel + on-site repair
time - Calculate salary & overtime - Manage advance salary requests -
Pay per active employee per month - Use one mobile app (iOS + Android)
and one web dashboard

------------------------------------------------------------------------

## 2. Tech Stack (Final Decision)

### Frontend

-   Web Dashboard: Next.js (App Router, TypeScript)
-   Mobile App: React Native + Expo (iOS & Android)

### Backend

-   Supabase (Auth, PostgreSQL, RLS, Edge Functions)

### Payments

-   Stripe (per-user subscription billing)

### Repo Structure

-   Monorepo (Turborepo)

------------------------------------------------------------------------

## 3. Monorepo Structure

``` txt
workshop-saas/
├── apps/
│   ├── web/          # Next.js Admin Dashboard
│   └── mobile/       # Expo App (Employee)
│
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared env & config
│   └── types/        # Shared TypeScript types
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
│
├── package.json
├── turbo.json
└── README.md
```

------------------------------------------------------------------------

## 4. SaaS User Roles

-   Owner -- billing, salary approval
-   Admin -- jobs, attendance
-   Employee -- mobile app only

------------------------------------------------------------------------

## 5. Core Database Tables (Supabase)

### companies

``` sql
id
name
subscription_status
created_at
```

### users

``` sql
id
company_id
role
hourly_rate
travel_rate
is_active
```

### workshops

``` sql
id
company_id
lat
lng
radius
```

### jobs

``` sql
id
company_id
workshop_id
lat
lng
radius
status
```

### attendance_sessions

``` sql
id
company_id
employee_id
state
job_id
start_time
end_time
```

### salary_advances

``` sql
id
employee_id
amount
status
requested_at
```

------------------------------------------------------------------------

## 6. Attendance State Machine

OFF_DUTY → WORKSHOP → TRAVEL → ON_SITE_JOB → TRAVEL → WORKSHOP/OFF_DUTY

------------------------------------------------------------------------

## 7. Salary Calculation

Paid Time = Workshop + Travel + Job Time\
Overtime = Paid Time - Daily Shift

------------------------------------------------------------------------

## 8. Subscription Logic

-   ₹800 per active employee per month
-   Stripe quantity-based subscriptions

------------------------------------------------------------------------

## 9. Dashboard Features

-   Employee management
-   Attendance & salary reports
-   Job creation
-   Advance salary approval

------------------------------------------------------------------------

## 10. Mobile App Features

-   Auto attendance
-   Job & travel tracking
-   Salary advance request

------------------------------------------------------------------------

## 11. Build Phases

1.  Monorepo & Supabase setup
2.  Attendance engine
3.  SaaS billing
4.  Polish & scale

------------------------------------------------------------------------

## 12. Final Outcome

A production-ready SaaS for workshops to manage attendance, jobs, and
salaries.
