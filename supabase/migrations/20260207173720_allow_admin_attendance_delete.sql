-- Allow Admins/Owners to DELETE attendance sessions
-- This was missing, so no one could delete anything.

CREATE POLICY "attendance_delete" ON public.attendance_sessions
  FOR DELETE USING (
    company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
  );
