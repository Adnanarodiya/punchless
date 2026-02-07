-- Fix attendance insert policy to allow admins/owners to create sessions for employees
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance_sessions;

-- Create new policy
CREATE POLICY "attendance_insert" ON public.attendance_sessions
  FOR INSERT WITH CHECK (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (
      employee_id = auth.uid() -- Employee can insert their own
      OR
      (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin') -- Admin/Owner can insert for anyone
    )
  );
