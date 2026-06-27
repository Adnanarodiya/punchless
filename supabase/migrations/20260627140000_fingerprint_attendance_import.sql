-- ============================================
-- Phase 0: Fingerprint attendance import → salary report
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS ot_rate_multiplier NUMERIC(3, 1) NOT NULL DEFAULT 1.0
    CHECK (ot_rate_multiplier IN (1, 1.5, 2));

COMMENT ON COLUMN companies.ot_rate_multiplier IS
  'OT pay multiplier: 1× same as regular hourly rate, 1.5×, or 2×';

-- ============================================
-- 1. ATTENDANCE IMPORTS (one upload per company per month)
-- ============================================
CREATE TABLE attendance_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  salary_month TEXT NOT NULL CHECK (salary_month ~ '^\d{4}-\d{2}$'),
  file_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  eligible_days INTEGER NOT NULL CHECK (eligible_days > 0),
  ot_rate_multiplier NUMERIC(3, 1) NOT NULL DEFAULT 1.0
    CHECK (ot_rate_multiplier IN (1, 1.5, 2)),
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_attendance_imports_company_month
  ON attendance_imports(company_id, salary_month);

CREATE INDEX idx_attendance_imports_company
  ON attendance_imports(company_id, uploaded_at DESC);

-- ============================================
-- 2. PARSED ROWS (one per fingerprint employee block)
-- ============================================
CREATE TABLE attendance_import_rows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES attendance_imports(id) ON DELETE CASCADE NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  fingerprint_name TEXT NOT NULL,
  fingerprint_emp_id TEXT,
  employee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  days_worked NUMERIC(5, 1) NOT NULL DEFAULT 0,
  summary_present INTEGER,
  summary_absent INTEGER,
  summary_half INTEGER,
  ot_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  total_hours NUMERIC(8, 2),
  sundays_excluded INTEGER NOT NULL DEFAULT 0,
  weekday_absents INTEGER NOT NULL DEFAULT 0,
  daily_statuses JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attendance_import_rows_import
  ON attendance_import_rows(import_id);

CREATE INDEX idx_attendance_import_rows_employee
  ON attendance_import_rows(employee_id)
  WHERE employee_id IS NOT NULL;

-- ============================================
-- 3. FINGERPRINT NAME → EMPLOYEE ALIASES
-- ============================================
CREATE TABLE employee_fingerprint_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  fingerprint_name TEXT NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_fingerprint_aliases_company_name
  ON employee_fingerprint_aliases(company_id, fingerprint_name);

CREATE INDEX idx_fingerprint_aliases_employee
  ON employee_fingerprint_aliases(employee_id);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE attendance_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_fingerprint_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_imports_select" ON attendance_imports
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_imports_insert" ON attendance_imports
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_imports_update" ON attendance_imports
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_imports_delete" ON attendance_imports
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_import_rows_select" ON attendance_import_rows
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_import_rows_insert" ON attendance_import_rows
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_import_rows_update" ON attendance_import_rows
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "attendance_import_rows_delete" ON attendance_import_rows
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "fingerprint_aliases_select" ON employee_fingerprint_aliases
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "fingerprint_aliases_insert" ON employee_fingerprint_aliases
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "fingerprint_aliases_update" ON employee_fingerprint_aliases
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "fingerprint_aliases_delete" ON employee_fingerprint_aliases
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );