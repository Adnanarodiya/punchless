-- Fix: Allow owner/admin to create advances on behalf of employees
-- Previously only the employee themselves could insert (employee_id = auth.uid())
-- Now: employees can create their own, OR owner/admin can create for any company employee

DROP POLICY IF EXISTS "advances_insert" ON salary_advances;

CREATE POLICY "advances_insert" ON salary_advances
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND (
      -- Employee creating their own advance request
      employee_id = auth.uid()
      -- OR owner/admin creating on behalf of an employee
      OR get_my_role() IN ('owner', 'admin')
    )
  );

-- Also add delete policy (was missing — needed for delete button)
DROP POLICY IF EXISTS "advances_delete" ON salary_advances;

CREATE POLICY "advances_delete" ON salary_advances
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );
