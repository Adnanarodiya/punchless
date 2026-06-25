-- ============================================
-- Phase 16: HR Extensions — Posts, Staff Payments, Salary Deposits
-- ============================================

-- Extend ledger reference types
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
      'purchase',
      'transfer',
      'bank_transaction',
      'salary_deposit',
      'staff_payment'
    )
  );

-- ============================================
-- 1. POSTS (job titles / positions)
-- ============================================
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_posts_company_name_active
  ON posts(company_id, lower(name))
  WHERE is_deleted = false;

-- ============================================
-- 2. EXTEND USERS (employee profile fields)
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES posts(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS joining_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_no TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ifsc_code TEXT;

-- ============================================
-- 3. STAFF PAYMENTS (advance / salary paid / deduction)
-- ============================================
CREATE TABLE staff_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  payment_type TEXT NOT NULL CHECK (
    payment_type IN ('advance', 'salary_paid', 'deduction')
  ),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'bank')),
  bank_id UUID REFERENCES bank_accounts(id),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (
      payment_type = 'deduction'
      AND payment_mode IS NULL
      AND bank_id IS NULL
    )
    OR (
      payment_type IN ('advance', 'salary_paid')
      AND payment_mode IS NOT NULL
    )
  ),
  CHECK (
    payment_mode IS NULL
    OR (
      payment_mode = 'cash'
      AND bank_id IS NULL
    )
    OR (
      payment_mode = 'bank'
      AND bank_id IS NOT NULL
    )
  )
);

-- ============================================
-- 4. SALARY DEPOSITS (accrual tracking)
-- ============================================
CREATE TABLE salary_deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  deposit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES
-- ============================================
CREATE INDEX idx_posts_company ON posts(company_id);
CREATE INDEX idx_posts_company_active ON posts(company_id) WHERE is_deleted = false;
CREATE INDEX idx_staff_payments_employee ON staff_payments(employee_id, payment_date DESC);
CREATE INDEX idx_staff_payments_company ON staff_payments(company_id, payment_date DESC);
CREATE INDEX idx_salary_deposits_employee ON salary_deposits(employee_id, deposit_date DESC);
CREATE INDEX idx_salary_deposits_company ON salary_deposits(company_id, deposit_date DESC);
CREATE INDEX idx_users_post ON users(post_id);

-- ============================================
-- 6. UPDATED_AT TRIGGER (posts)
-- ============================================
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 7. ENABLE RLS
-- ============================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_deposits ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS — POSTS
-- ============================================
CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 9. RLS — STAFF PAYMENTS
-- ============================================
CREATE POLICY "staff_payments_select" ON staff_payments
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "staff_payments_insert" ON staff_payments
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "staff_payments_update" ON staff_payments
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "staff_payments_delete" ON staff_payments
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );

-- ============================================
-- 10. RLS — SALARY DEPOSITS
-- ============================================
CREATE POLICY "salary_deposits_select" ON salary_deposits
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "salary_deposits_insert" ON salary_deposits
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "salary_deposits_update" ON salary_deposits
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "salary_deposits_delete" ON salary_deposits
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() = 'owner'
  );