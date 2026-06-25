-- ============================================
-- Phase 14: Banks + Income/Expense Transactions
-- ============================================

-- ============================================
-- 1. BANK ACCOUNTS
-- ============================================
CREATE TABLE bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT,
  ifsc_code TEXT,
  opening_balance DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. BANK TRANSACTIONS (deposit / withdraw)
-- ============================================
CREATE TABLE bank_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  bank_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdraw')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. BANK TRANSFERS
-- ============================================
CREATE TABLE bank_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  from_bank_id UUID REFERENCES bank_accounts(id) ON DELETE RESTRICT NOT NULL,
  to_bank_id UUID REFERENCES bank_accounts(id) ON DELETE RESTRICT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_bank_id <> to_bank_id)
);

-- ============================================
-- 4. INCOME / EXPENSE TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  particular TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'bank')),
  bank_id UUID REFERENCES bank_accounts(id),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (payment_mode = 'cash' AND bank_id IS NULL)
    OR (payment_mode = 'bank' AND bank_id IS NOT NULL)
  )
);

-- ============================================
-- 5. EXTEND LEDGER reference_type
-- ============================================
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_reference_type_check;

ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_reference_type_check
  CHECK (
    reference_type IS NULL
    OR reference_type IN (
      'invoice',
      'payment',
      'advance',
      'salary',
      'expense',
      'opening_balance',
      'transfer',
      'bank_transaction'
    )
  );

-- Link optional bank_id on ledger to bank accounts
ALTER TABLE ledger_entries
  DROP CONSTRAINT IF EXISTS ledger_entries_bank_id_fkey;

ALTER TABLE ledger_entries
  ADD CONSTRAINT ledger_entries_bank_id_fkey
  FOREIGN KEY (bank_id) REFERENCES bank_accounts(id);

ALTER TABLE client_payments
  DROP CONSTRAINT IF EXISTS client_payments_bank_id_fkey;

ALTER TABLE client_payments
  ADD CONSTRAINT client_payments_bank_id_fkey
  FOREIGN KEY (bank_id) REFERENCES bank_accounts(id);

-- ============================================
-- 6. INDEXES
-- ============================================
CREATE INDEX idx_bank_accounts_company ON bank_accounts(company_id);
CREATE INDEX idx_bank_accounts_company_active ON bank_accounts(company_id)
  WHERE is_deleted = false;
CREATE INDEX idx_bank_transactions_bank ON bank_transactions(bank_id, transaction_date DESC);
CREATE INDEX idx_bank_transactions_company ON bank_transactions(company_id, transaction_date DESC);
CREATE INDEX idx_bank_transfers_company ON bank_transfers(company_id, transfer_date DESC);
CREATE INDEX idx_transactions_company ON transactions(company_id, transaction_date DESC);
CREATE INDEX idx_transactions_type ON transactions(company_id, transaction_type, transaction_date DESC);

-- ============================================
-- 7. UPDATED_AT TRIGGER
-- ============================================
CREATE TRIGGER bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 8. ENABLE RLS
-- ============================================
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS — BANK ACCOUNTS
-- ============================================
CREATE POLICY "bank_accounts_select" ON bank_accounts
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_accounts_insert" ON bank_accounts
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_accounts_update" ON bank_accounts
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_accounts_delete" ON bank_accounts
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 10. RLS — BANK TRANSACTIONS
-- ============================================
CREATE POLICY "bank_transactions_select" ON bank_transactions
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_transactions_insert" ON bank_transactions
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_transactions_update" ON bank_transactions
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_transactions_delete" ON bank_transactions
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 11. RLS — BANK TRANSFERS
-- ============================================
CREATE POLICY "bank_transfers_select" ON bank_transfers
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_transfers_insert" ON bank_transfers
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_transfers_update" ON bank_transfers
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "bank_transfers_delete" ON bank_transfers
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 12. RLS — TRANSACTIONS (income/expense)
-- ============================================
CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );