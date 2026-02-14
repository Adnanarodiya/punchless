-- ============================================
-- 1. Add 'break' to attendance_sessions state check
-- ============================================
ALTER TABLE attendance_sessions
  DROP CONSTRAINT IF EXISTS attendance_sessions_state_check;

ALTER TABLE attendance_sessions
  ADD CONSTRAINT attendance_sessions_state_check
  CHECK (state IN ('workshop', 'travel', 'on_site_job', 'off_duty', 'break'));

-- ============================================
-- 2. CORRECTION REQUESTS table
-- ============================================
CREATE TABLE correction_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,

  -- What the employee wants to correct
  request_type TEXT NOT NULL CHECK (request_type IN ('break_correction', 'session_correction', 'missing_session')),

  -- Original values (for display in admin panel)
  original_start_time TIMESTAMPTZ,
  original_end_time TIMESTAMPTZ,
  original_state TEXT,

  -- Requested values
  requested_start_time TIMESTAMPTZ,
  requested_end_time TIMESTAMPTZ,
  requested_state TEXT,

  -- Context
  date DATE NOT NULL,
  reason TEXT NOT NULL,

  -- Approval
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX idx_correction_employee ON correction_requests(employee_id, status);
CREATE INDEX idx_correction_company ON correction_requests(company_id, status);
CREATE INDEX idx_attendance_break ON attendance_sessions(employee_id, state) WHERE state = 'break';

-- ============================================
-- 4. ENABLE RLS
-- ============================================
ALTER TABLE correction_requests ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES — CORRECTION REQUESTS
-- ============================================

-- Read: owner/admin see all, employee sees own
CREATE POLICY "correction_select" ON correction_requests
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND (
      get_my_role() IN ('owner', 'admin')
      OR employee_id = auth.uid()
    )
  );

-- Insert: employees can create their own requests
CREATE POLICY "correction_insert" ON correction_requests
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND employee_id = auth.uid()
  );

-- Update: owner/admin can approve/reject
CREATE POLICY "correction_update" ON correction_requests
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

-- Delete: owner/admin can delete
CREATE POLICY "correction_delete" ON correction_requests
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );
