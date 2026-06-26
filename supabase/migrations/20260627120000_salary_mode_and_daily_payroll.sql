-- Company salary mode: hourly (pay by adjusted hours) or fixed (pay by day credits)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS salary_mode TEXT NOT NULL DEFAULT 'hourly'
  CHECK (salary_mode IN ('hourly', 'fixed'));

COMMENT ON COLUMN companies.salary_mode IS
  'hourly = pay by attendance hours (half-day late = 50% hours); fixed = pay by day credits capped at monthly_salary';

-- Per-employee per-day payroll inputs (IST calendar day, grace-based half days)
CREATE OR REPLACE FUNCTION get_daily_attendance_payroll(
  p_company_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_work_start_time TEXT,
  p_grace_minutes INTEGER
) RETURNS TABLE (
  employee_id UUID,
  work_date DATE,
  first_punch_at TIMESTAMPTZ,
  total_minutes NUMERIC,
  day_credit NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH day_sessions AS (
    SELECT
      a.employee_id,
      (a.start_time AT TIME ZONE 'Asia/Kolkata')::date AS work_date,
      MIN(a.start_time) AS first_punch_at,
      SUM(
        COALESCE(
          a.duration_minutes,
          EXTRACT(EPOCH FROM (COALESCE(a.end_time, NOW()) - a.start_time)) / 60
        )
      )::numeric AS total_minutes
    FROM public.attendance_sessions a
    WHERE a.company_id = p_company_id
      AND a.state IN ('workshop', 'travel', 'on_site_job')
      AND (a.start_time AT TIME ZONE 'Asia/Kolkata')::date >= p_start_date
      AND (a.start_time AT TIME ZONE 'Asia/Kolkata')::date <= p_end_date
    GROUP BY a.employee_id, (a.start_time AT TIME ZONE 'Asia/Kolkata')::date
  )
  SELECT
    ds.employee_id,
    ds.work_date,
    ds.first_punch_at,
    ds.total_minutes,
    CASE
      WHEN (
        (ds.first_punch_at AT TIME ZONE 'Asia/Kolkata')::time
        <= (
          p_work_start_time::time
          + (COALESCE(p_grace_minutes, 0) || ' minutes')::interval
        )
      ) THEN 1::numeric
      ELSE 0.5::numeric
    END AS day_credit
  FROM day_sessions ds;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;