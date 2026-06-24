-- ============================================
-- Phase 11B: Clients CRM + Ledger Foundation
-- ============================================

-- ============================================
-- 1. CLIENTS
-- ============================================
CREATE TABLE clients (
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
-- 2. CLIENT PAYMENTS
-- ============================================
CREATE TABLE client_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'bank', 'credit')),
  bank_id UUID,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. LEDGER ENTRIES (shared finance spine)
-- ============================================
CREATE TABLE ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('client', 'supplier', 'staff', 'bank', 'expense')
  ),
  entity_id UUID NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'bank', 'credit')),
  bank_id UUID,
  reference_type TEXT CHECK (
    reference_type IN (
      'invoice',
      'payment',
      'advance',
      'salary',
      'expense',
      'opening_balance'
    )
  ),
  reference_id UUID,
  remark TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_clients_company ON clients(company_id);
CREATE INDEX idx_clients_company_active ON clients(company_id) WHERE is_deleted = false;
CREATE INDEX idx_client_payments_client ON client_payments(client_id, payment_date DESC);
CREATE INDEX idx_client_payments_company ON client_payments(company_id, payment_date DESC);
CREATE INDEX idx_ledger_company ON ledger_entries(company_id, entry_date DESC);
CREATE INDEX idx_ledger_entity ON ledger_entries(entity_type, entity_id, entry_date DESC);
CREATE INDEX idx_ledger_reference ON ledger_entries(reference_type, reference_id);

-- ============================================
-- 5. UPDATED_AT TRIGGER (clients)
-- ============================================
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 6. ENABLE RLS
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS — CLIENTS
-- ============================================
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 8. RLS — CLIENT PAYMENTS
-- ============================================
CREATE POLICY "client_payments_select" ON client_payments
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "client_payments_insert" ON client_payments
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "client_payments_update" ON client_payments
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "client_payments_delete" ON client_payments
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 9. RLS — LEDGER ENTRIES
-- ============================================
CREATE POLICY "ledger_entries_select" ON ledger_entries
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "ledger_entries_insert" ON ledger_entries
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "ledger_entries_update" ON ledger_entries
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "ledger_entries_delete" ON ledger_entries
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );