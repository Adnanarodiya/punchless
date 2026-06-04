-- Soft Delete & RLS Performance Optimizations Migration

-- 1. Add deleted_at columns for soft deletes
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.workshops ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create partial indexes to scan only active records
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workshops_deleted_at ON public.workshops(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs(deleted_at) WHERE deleted_at IS NULL;

-- 3. Redefine RLS security helper functions to utilize auth JWT claims
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid,
    (SELECT company_id FROM public.users WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    (SELECT role FROM public.users WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 4. Backfill existing auth.users app_metadata with company_id and role
UPDATE auth.users au
SET raw_app_meta_data = COALESCE(au.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('company_id', u.company_id, 'role', u.role)
FROM public.users u
WHERE au.id = u.id;

-- 5. Update user signup trigger to populate raw_app_meta_data
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

    -- Update JWT app_metadata for RLS instant checks
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('company_id', new_company_id, 'role', 'owner')
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Recalculate hourly rates for all active employees of a company
CREATE OR REPLACE FUNCTION recalculate_hourly_rates(
  p_company_id UUID,
  p_daily_hours NUMERIC,
  p_working_days NUMERIC
) RETURNS VOID AS $$
BEGIN
  IF (p_daily_hours * p_working_days) > 0 THEN
    UPDATE public.users
    SET hourly_rate = ROUND((monthly_salary::numeric / (p_daily_hours * p_working_days))::numeric, 2)
    WHERE company_id = p_company_id AND role = 'employee' AND monthly_salary > 0 AND deleted_at IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Aggregate monthly attendance sessions grouped by employee and state
CREATE OR REPLACE FUNCTION get_monthly_attendance_summary(
  p_company_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
) RETURNS TABLE (
  employee_id UUID,
  state TEXT,
  total_duration_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT a.employee_id, a.state, SUM(COALESCE(a.duration_minutes, 0))::numeric
  FROM public.attendance_sessions a
  WHERE a.company_id = p_company_id
    AND a.start_time >= p_start_time AND a.start_time < p_end_time
    AND a.duration_minutes IS NOT NULL
  GROUP BY a.employee_id, a.state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
