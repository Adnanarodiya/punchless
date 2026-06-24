-- ============================================
-- Phase 12: Suppliers + Purchases
-- ============================================

-- Extend ledger reference types for purchase invoices
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_reference_type_check;
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_reference_type_check
  CHECK (
    reference_type IS NULL OR reference_type IN (
      'invoice',
      'payment',
      'advance',
      'salary',
      'expense',
      'opening_balance',
      'purchase'
    )
  );

-- ============================================
-- 1. SUPPLIERS
-- ============================================
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  alias TEXT,
  contact TEXT,
  address TEXT,
  gst_number TEXT,
  opening_balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. SUPPLIER PAYMENTS
-- ============================================
CREATE TABLE supplier_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'bank', 'credit')),
  bank_id UUID,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. PURCHASE INVOICES
-- ============================================
CREATE TABLE purchase_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('purchase', 'sales')),
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  taxable_amount DECIMAL(12, 2) NOT NULL CHECK (taxable_amount > 0),
  gst_percent DECIMAL(5, 2) NOT NULL CHECK (gst_percent IN (0, 5, 12, 18, 28)),
  gst_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount > 0),
  remark TEXT,
  created_by UUID REFERENCES users(id),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_suppliers_company_active ON suppliers(company_id) WHERE is_deleted = false;
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id, payment_date DESC);
CREATE INDEX idx_supplier_payments_company ON supplier_payments(company_id, payment_date DESC);
CREATE INDEX idx_purchase_invoices_supplier ON purchase_invoices(supplier_id, invoice_date DESC);
CREATE INDEX idx_purchase_invoices_company ON purchase_invoices(company_id, invoice_date DESC);

-- ============================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER purchase_invoices_updated_at BEFORE UPDATE ON purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. ENABLE RLS
-- ============================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS — SUPPLIERS
-- ============================================
CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 8. RLS — SUPPLIER PAYMENTS
-- ============================================
CREATE POLICY "supplier_payments_select" ON supplier_payments
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "supplier_payments_insert" ON supplier_payments
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "supplier_payments_update" ON supplier_payments
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "supplier_payments_delete" ON supplier_payments
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 9. RLS — PURCHASE INVOICES
-- ============================================
CREATE POLICY "purchase_invoices_select" ON purchase_invoices
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "purchase_invoices_insert" ON purchase_invoices
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "purchase_invoices_update" ON purchase_invoices
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "purchase_invoices_delete" ON purchase_invoices
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );