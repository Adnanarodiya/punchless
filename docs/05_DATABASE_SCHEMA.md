# 🗄️ 05 — Database Schema (Supabase PostgreSQL)

## Overview

All tables use `company_id` for multi-tenancy. RLS enforces data isolation.

---

## ER Diagram (Text)

```
companies ──┬── users (owner, admin, employee)
             ├── workshops (GPS locations)
             ├── jobs (repair assignments)
             ├── attendance_sessions (time tracking)
             └── salary_advances (advance requests)

users ──┬── attendance_sessions
         └── salary_advances

workshops ── jobs (a job can be linked to a workshop)
```

---

## Table: `companies`

```sql
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'cancelled')),
  stripe_customer_id TEXT,           -- Phase 10
  stripe_subscription_id TEXT,       -- Phase 10
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Table: `users`

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'employee')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  daily_shift_hours DECIMAL(4,2) DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- `hourly_rate` — single rate per hour for workshop + travel + on-site job work
- `daily_shift_hours` — standard shift (e.g., 8 hrs). Beyond = overtime
- `is_active` — only active employees count for billing

---

## Table: `workshops`

```sql
CREATE TABLE workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius INTEGER DEFAULT 100,  -- meters
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- `lat`, `lng` — center of workshop geofence
- `radius` — in meters, how close employee must be to count as "at workshop"

---

## Table: `jobs`

```sql
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  workshop_id UUID REFERENCES workshops(id),
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius INTEGER DEFAULT 50,  -- meters
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- `assigned_to` — which employee is handling this job
- `lat`, `lng` — location of the repair/job site
- Status flow: `pending → assigned → in_progress → completed`

---

## Table: `attendance_sessions`

```sql
CREATE TABLE attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  employee_id UUID REFERENCES users(id) NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('workshop', 'travel', 'on_site_job', 'off_duty')),
  job_id UUID REFERENCES jobs(id),        -- only if state is travel or on_site_job
  workshop_id UUID REFERENCES workshops(id), -- only if state is workshop
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,                    -- NULL = session is active
  duration_minutes INTEGER,                -- calculated on session end
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Notes:**
- Each row = one continuous block of time in a specific state
- `end_time IS NULL` means the session is currently active
- `duration_minutes` is calculated when session ends for easy salary queries

---

## Table: `salary_advances`

```sql
CREATE TABLE salary_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) NOT NULL,
  employee_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,                              -- owner's note on approval/rejection
  salary_month TEXT,                       -- e.g., '2026-02' — which month to deduct from
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## RLS Policies (Key Examples)

### Companies
```sql
-- Users can only read their own company
CREATE POLICY "read_own_company" ON companies
  FOR SELECT USING (id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

### Users
```sql
-- Users can see colleagues in same company
CREATE POLICY "read_company_users" ON users
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));

-- Only owner/admin can insert users
CREATE POLICY "owner_admin_insert_users" ON users
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
  );
```

### Attendance Sessions
```sql
-- Employees see own sessions, owner/admin see all company sessions
CREATE POLICY "read_attendance" ON attendance_sessions
  FOR SELECT USING (company_id = (SELECT company_id FROM users WHERE id = auth.uid()));
```

---

## Indexes (Performance)

```sql
CREATE INDEX idx_attendance_employee ON attendance_sessions(employee_id, start_time);
CREATE INDEX idx_attendance_company ON attendance_sessions(company_id, start_time);
CREATE INDEX idx_jobs_company ON jobs(company_id, status);
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_advances_employee ON salary_advances(employee_id, status);
```

---

## Related Docs

- Attendance engine → `06_ATTENDANCE_ENGINE.md`
- Salary calculation → `08_SALARY_CALCULATION.md`
- Architecture → `02_ARCHITECTURE.md`
