# 🖥️ 07 — Web Dashboard (Next.js)

## Overview

The web dashboard is used by **Owners** and **Admins** to manage everything.

**Tech:** Next.js (App Router), TypeScript, Tailwind CSS, Supabase JS Client

---

## Page Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + Header
│   │   ├── page.tsx                ← Dashboard Home / Overview
│   │   │
│   │   ├── employees/
│   │   │   ├── page.tsx            ← Employee list
│   │   │   ├── [id]/page.tsx       ← Employee detail
│   │   │   └── new/page.tsx        ← Add employee
│   │   │
│   │   ├── attendance/
│   │   │   ├── page.tsx            ← Live attendance view
│   │   │   └── history/page.tsx    ← Attendance history
│   │   │
│   │   ├── workshops/
│   │   │   ├── page.tsx            ← Workshop list
│   │   │   └── new/page.tsx        ← Add workshop (with map)
│   │   │
│   │   ├── jobs/
│   │   │   ├── page.tsx            ← Job list
│   │   │   ├── [id]/page.tsx       ← Job detail
│   │   │   └── new/page.tsx        ← Create job
│   │   │
│   │   ├── salary/
│   │   │   ├── page.tsx            ← Salary overview
│   │   │   └── [employeeId]/page.tsx ← Employee salary detail
│   │   │
│   │   ├── advances/
│   │   │   └── page.tsx            ← Advance requests (approve/reject)
│   │   │
│   │   ├── billing/                ← Phase 10 ONLY
│   │   │   └── page.tsx
│   │   │
│   │   └── settings/
│   │       └── page.tsx            ← Company settings
│   │
│   ├── layout.tsx
│   └── globals.css
```

---

## Key Pages & Features

### Dashboard Home
- Total employees (active/inactive)
- Today's attendance summary (present, absent, on-job)
- Pending advance requests count
- Quick actions (add employee, create job)

### Employee Management
- List with search & filter (active/inactive, role)
- Add new employee (name, email, phone, role, rates)
- Edit employee details
- Deactivate employee (don't delete — affects billing & history)

### Attendance
- **Live View:** Real-time status of each employee (workshop/travel/on-site/off-duty)
- **History:** Date-range filter, per-employee breakdown
- Daily summary: hours at workshop, travel, on-site, overtime

### Workshop Management
- Add workshop with map picker (Google Maps or Leaflet)
- Set geofence radius (drag to adjust)
- Edit/deactivate workshops

### Job Management
- Create job: title, description, customer info, location (map picker)
- Assign to employee
- Track status: pending → assigned → in_progress → completed
- View timeline of job (travel start, arrival, completion)

### Salary Reports
- Monthly summary per employee
- Breakdown: workshop hours, travel hours, on-site hours, overtime
- Gross pay calculation
- Advance deductions
- Net pay

### Advance Requests
- List of pending requests
- Approve/reject with notes
- History of all advance requests

---

## Auth & Route Protection

```
middleware.ts → Check Supabase session
  │
  ├── No session → redirect to /login
  ├── Has session, role = employee → redirect to "use mobile app" page
  └── Has session, role = owner/admin → allow dashboard access
```

---

## Role-Based UI

| Feature | Owner | Admin | Employee |
|---------|-------|-------|----------|
| Dashboard | ✅ | ✅ | ❌ |
| Employees | ✅ | ✅ | ❌ |
| Attendance | ✅ | ✅ | ❌ |
| Jobs | ✅ | ✅ | ❌ |
| Salary | ✅ | ✅ (view only) | ❌ |
| Advances | ✅ | ✅ | ❌ |
| Billing | ✅ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ |

---

## Related Docs

- Architecture → `02_ARCHITECTURE.md`
- Database → `05_DATABASE_SCHEMA.md`
- Build phases → `04_BUILD_PHASES.md`
