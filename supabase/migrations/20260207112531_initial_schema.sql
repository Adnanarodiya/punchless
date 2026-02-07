-- ============================================
-- Punchless — Initial Database Schema
-- Phase 2: Auth & Company Setup
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. COMPANIES
-- ============================================
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'inactive', 'cancelled')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS (linked to auth.users)
-- ============================================
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'employee')),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  travel_rate DECIMAL(10,2) DEFAULT 0,
  daily_shift_hours DECIMAL(4,2) DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. WORKSHOPS
-- ============================================
CREATE TABLE workshops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. JOBS
-- ============================================
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES workshops(id),
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ATTENDANCE SESSIONS
-- ============================================
CREATE TABLE attendance_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('workshop', 'travel', 'on_site_job', 'off_duty')),
  job_id UUID REFERENCES jobs(id),
  workshop_id UUID REFERENCES workshops(id),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. SALARY ADVANCES
-- ============================================
CREATE TABLE salary_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  salary_month TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. INDEXES
-- ============================================
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_workshops_company ON workshops(company_id);
CREATE INDEX idx_jobs_company ON jobs(company_id, status);
CREATE INDEX idx_jobs_assigned ON jobs(assigned_to, status);
CREATE INDEX idx_attendance_employee ON attendance_sessions(employee_id, start_time);
CREATE INDEX idx_attendance_company ON attendance_sessions(company_id, start_time);
CREATE INDEX idx_attendance_active ON attendance_sessions(employee_id) WHERE end_time IS NULL;
CREATE INDEX idx_advances_employee ON salary_advances(employee_id, status);
CREATE INDEX idx_advances_company ON salary_advances(company_id, status);

-- ============================================
-- 8. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_advances ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. HELPER FUNCTION: Get current user's company_id
-- ============================================
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- 10. HELPER FUNCTION: Get current user's role
-- ============================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- 11. RLS POLICIES — COMPANIES
-- ============================================

-- Read: users can see their own company
CREATE POLICY "companies_select" ON companies
  FOR SELECT USING (id = get_my_company_id());

-- Update: only owner can update company
CREATE POLICY "companies_update" ON companies
  FOR UPDATE USING (id = get_my_company_id() AND get_my_role() = 'owner');

-- Insert: allow during signup (handled by trigger, so allow service role)
-- No direct insert policy needed — handled by trigger below

-- ============================================
-- 12. RLS POLICIES — USERS
-- ============================================

-- Read: see all users in same company
CREATE POLICY "users_select" ON users
  FOR SELECT USING (company_id = get_my_company_id());

-- Insert: owner/admin can add users to their company
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- Update: owner/admin can update users in their company, employees can update themselves
CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      get_my_role() IN ('owner', 'admin')
      OR id = auth.uid()
    )
  );

-- ============================================
-- 13. RLS POLICIES — WORKSHOPS
-- ============================================

-- Read: all company members can see workshops
CREATE POLICY "workshops_select" ON workshops
  FOR SELECT USING (company_id = get_my_company_id());

-- Insert: owner/admin only
CREATE POLICY "workshops_insert" ON workshops
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- Update: owner/admin only
CREATE POLICY "workshops_update" ON workshops
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- Delete: owner only
CREATE POLICY "workshops_delete" ON workshops
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 14. RLS POLICIES — JOBS
-- ============================================

-- Read: all company members can see jobs
CREATE POLICY "jobs_select" ON jobs
  FOR SELECT USING (company_id = get_my_company_id());

-- Insert: owner/admin can create jobs
CREATE POLICY "jobs_insert" ON jobs
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- Update: owner/admin can update any job, employee can update their assigned job
CREATE POLICY "jobs_update" ON jobs
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      get_my_role() IN ('owner', 'admin')
      OR assigned_to = auth.uid()
    )
  );

-- ============================================
-- 15. RLS POLICIES — ATTENDANCE SESSIONS
-- ============================================

-- Read: owner/admin see all, employee sees own
CREATE POLICY "attendance_select" ON attendance_sessions
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND (
      get_my_role() IN ('owner', 'admin')
      OR employee_id = auth.uid()
    )
  );

-- Insert: employees can create their own sessions
CREATE POLICY "attendance_insert" ON attendance_sessions
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND employee_id = auth.uid()
  );

-- Update: employee can update own active session, owner/admin can update any
CREATE POLICY "attendance_update" ON attendance_sessions
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND (
      get_my_role() IN ('owner', 'admin')
      OR employee_id = auth.uid()
    )
  );

-- ============================================
-- 16. RLS POLICIES — SALARY ADVANCES
-- ============================================

-- Read: owner/admin see all, employee sees own
CREATE POLICY "advances_select" ON salary_advances
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND (
      get_my_role() IN ('owner', 'admin')
      OR employee_id = auth.uid()
    )
  );

-- Insert: employees can request advances
CREATE POLICY "advances_insert" ON salary_advances
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND employee_id = auth.uid()
  );

-- Update: owner/admin can approve/reject
CREATE POLICY "advances_update" ON salary_advances
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- ============================================
-- 17. TRIGGER: Auto-create company + user on signup
-- ============================================

-- This function runs when a new user signs up via Supabase Auth.
-- It creates a company and the owner user record automatically.
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Only create company if user metadata has company_name (owner signup)
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    -- Create the company
    INSERT INTO companies (name)
    VALUES (NEW.raw_user_meta_data->>'company_name')
    RETURNING id INTO new_company_id;

    -- Create the owner user
    INSERT INTO users (id, company_id, role, full_name, email)
    VALUES (
      NEW.id,
      new_company_id,
      'owner',
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- ============================================
-- 18. FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
