-- ============================================
-- Phase 13: Tax Invoices + GST
-- ============================================

-- Optional job link for invoices
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS vehicle_number TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- ============================================
-- 1. TAX INVOICES (client billing)
-- ============================================
CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id),
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_number TEXT,
  taxable_amount DECIMAL(12, 2) NOT NULL CHECK (taxable_amount > 0),
  gst_percent DECIMAL(5, 2) NOT NULL CHECK (gst_percent IN (0, 5, 12, 18, 28)),
  gst_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount > 0),
  payment_mode TEXT NOT NULL CHECK (
    payment_mode IN ('cash', 'bank', 'credit', 'split')
  ),
  cash_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (cash_amount >= 0),
  bank_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (bank_amount >= 0),
  credit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (credit_amount >= 0),
  bank_id UUID,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INVOICE LINE ITEMS
-- ============================================
CREATE TABLE invoice_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price > 0),
  gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX idx_invoices_company ON invoices(company_id, invoice_date DESC);
CREATE INDEX idx_invoices_client ON invoices(client_id, invoice_date DESC);
CREATE INDEX idx_invoices_job ON invoices(job_id) WHERE job_id IS NOT NULL;
CREATE INDEX idx_invoice_line_items_invoice ON invoice_line_items(invoice_id, sort_order);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 5. ENABLE RLS
-- ============================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS — INVOICES
-- ============================================
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "invoices_insert" ON invoices
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "invoices_update" ON invoices
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "invoices_delete" ON invoices
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 7. RLS — INVOICE LINE ITEMS
-- ============================================
CREATE POLICY "invoice_line_items_select" ON invoice_line_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = get_my_company_id()
    )
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "invoice_line_items_insert" ON invoice_line_items
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = get_my_company_id()
    )
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "invoice_line_items_update" ON invoice_line_items
  FOR UPDATE USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = get_my_company_id()
    )
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "invoice_line_items_delete" ON invoice_line_items
  FOR DELETE USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE company_id = get_my_company_id()
    )
    AND get_my_role() IN ('owner', 'admin')
  );