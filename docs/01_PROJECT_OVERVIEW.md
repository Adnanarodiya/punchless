# 📋 01 — Project Overview

## What Are We Building?

A **multi-tenant SaaS platform** for workshops and service businesses to:

- Automatically track employee attendance using GPS
- Track travel time and on-site repair time
- Calculate salary and overtime fairly
- Handle salary advance requests
- Charge workshops a monthly fee per active employee

---

## Who Uses It?

### 1. Workshop Owner (Web Dashboard)
- Signs up, creates company
- Adds employees
- Sets workshop location (GPS coordinates + radius)
- Creates repair jobs
- Approves/rejects salary advances
- Views attendance reports & salary summaries
- Manages billing (Stripe — Phase 10)

### 2. Admin (Web Dashboard)
- Manages day-to-day operations
- Assigns jobs to employees
- Views attendance & reports
- Cannot manage billing

### 3. Employee (Mobile App Only)
- Opens app → attendance is automatic (GPS)
- Sees assigned jobs
- Starts travel → arrives at job → completes job
- Requests salary advance
- Views own work history & salary

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Web Dashboard | Next.js (App Router, TypeScript) |
| Mobile App | React Native + Expo |
| Backend/DB | Supabase (PostgreSQL, Auth, RLS, Edge Functions) |
| Payments | Stripe (Phase 10 — LAST) |
| Monorepo | Turborepo |

---

## Multi-Tenancy

- Every table has a `company_id` column
- Supabase RLS ensures Company A can never see Company B's data
- Each company manages their own employees, workshops, jobs independently

---

## Pricing Model

- **₹800 per active employee per month**
- Billed via Stripe quantity-based subscription
- Only active employees count (inactive = free)

---

## Related Docs

- Architecture → `02_ARCHITECTURE.md`
- How to start → `03_GETTING_STARTED.md`
- Build phases → `04_BUILD_PHASES.md`
