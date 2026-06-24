-- Allow admin to delete ledger entries (needed for invoice ledger resync on edit)
DROP POLICY IF EXISTS "ledger_entries_delete" ON ledger_entries;

CREATE POLICY "ledger_entries_delete" ON ledger_entries
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );