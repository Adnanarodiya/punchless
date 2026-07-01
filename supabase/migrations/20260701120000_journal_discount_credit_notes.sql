-- Journal: discount settlements, credit notes, debit notes, purchase bill outstanding

-- Extend entry_category for journal entries
ALTER TYPE public.entry_category ADD VALUE IF NOT EXISTS 'discount_given';
ALTER TYPE public.entry_category ADD VALUE IF NOT EXISTS 'discount_received';
ALTER TYPE public.entry_category ADD VALUE IF NOT EXISTS 'credit_note';
ALTER TYPE public.entry_category ADD VALUE IF NOT EXISTS 'debit_note';

-- Purchase bills: track outstanding like sales invoices
ALTER TABLE public.purchase_invoices
  ADD COLUMN IF NOT EXISTS credit_amount DECIMAL(12, 2) NOT NULL DEFAULT 0
    CHECK (credit_amount >= 0);

UPDATE public.purchase_invoices
SET credit_amount = total_amount
WHERE credit_amount = 0 AND is_deleted = false;

-- Discount settlements (payment + discount = full bill clearance)
CREATE TABLE public.discount_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  settlement_kind TEXT NOT NULL CHECK (settlement_kind IN ('given', 'received')),
  party_side TEXT NOT NULL CHECK (party_side IN ('client', 'supplier')),
  party_id UUID NOT NULL,
  bill_id UUID NOT NULL,
  bill_side TEXT NOT NULL CHECK (bill_side IN ('client', 'supplier')),
  invoice_number TEXT,
  bill_amount DECIMAL(12, 2) NOT NULL CHECK (bill_amount > 0),
  discount_amount DECIMAL(12, 2) NOT NULL CHECK (discount_amount > 0),
  payment_amount DECIMAL(12, 2) NOT NULL CHECK (payment_amount >= 0),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('cash', 'bank')),
  bank_sub_mode public.bank_sub_mode,
  bank_id UUID REFERENCES public.bank_accounts(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remark TEXT,
  payment_reference_id UUID,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_discount_settlements_company
  ON public.discount_settlements(company_id, entry_date DESC);

-- Credit notes (customer — reduce outstanding)
CREATE TABLE public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  credit_note_number TEXT NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  remark TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, credit_note_number)
);

CREATE INDEX idx_credit_notes_company ON public.credit_notes(company_id, issue_date DESC);
CREATE INDEX idx_credit_notes_invoice ON public.credit_notes(invoice_id);

-- Debit notes (customer — increase outstanding)
CREATE TABLE public.debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  debit_note_number TEXT NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  remark TEXT,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, debit_note_number)
);

CREATE INDEX idx_debit_notes_company ON public.debit_notes(company_id, issue_date DESC);
CREATE INDEX idx_debit_notes_invoice ON public.debit_notes(invoice_id);

CREATE TRIGGER credit_notes_updated_at
  BEFORE UPDATE ON public.credit_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER debit_notes_updated_at
  BEFORE UPDATE ON public.debit_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Ledger reference types for journal documents
ALTER TABLE public.ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_reference_type_check;
ALTER TABLE public.ledger_entries ADD CONSTRAINT ledger_entries_reference_type_check
  CHECK (
    reference_type IS NULL OR reference_type IN (
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
      'staff_payment',
      'discount_settlement',
      'credit_note',
      'debit_note'
    )
  );

-- RLS
ALTER TABLE public.discount_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discount_settlements_select" ON public.discount_settlements
  FOR SELECT USING (company_id = public.get_my_company_id());

CREATE POLICY "discount_settlements_insert" ON public.discount_settlements
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "credit_notes_select" ON public.credit_notes
  FOR SELECT USING (company_id = public.get_my_company_id() AND is_deleted = false);

CREATE POLICY "credit_notes_insert" ON public.credit_notes
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "credit_notes_update" ON public.credit_notes
  FOR UPDATE USING (company_id = public.get_my_company_id());

CREATE POLICY "debit_notes_select" ON public.debit_notes
  FOR SELECT USING (company_id = public.get_my_company_id() AND is_deleted = false);

CREATE POLICY "debit_notes_insert" ON public.debit_notes
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "debit_notes_update" ON public.debit_notes
  FOR UPDATE USING (company_id = public.get_my_company_id());