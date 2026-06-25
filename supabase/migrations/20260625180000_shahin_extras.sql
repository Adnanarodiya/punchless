-- ============================================
-- Shahin Extras: Data lock PIN + Sticky notes
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS data_lock_pin_hash TEXT;

COMMENT ON COLUMN companies.data_lock_pin_hash IS
  'Scrypt hash of owner data-lock PIN (salt:hash). NULL = financials always visible.';

CREATE TABLE sticky_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  note_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sticky_notes_company ON sticky_notes(company_id, note_date DESC);

ALTER TABLE sticky_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sticky_notes_select" ON sticky_notes
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "sticky_notes_insert" ON sticky_notes
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "sticky_notes_update" ON sticky_notes
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "sticky_notes_delete" ON sticky_notes
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE TRIGGER sticky_notes_updated_at
  BEFORE UPDATE ON sticky_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();