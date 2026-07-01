-- Supplier journal: credit notes & debit notes (mirror customer CN/DN on purchase bills)

CREATE TABLE public.supplier_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  credit_note_number TEXT NOT NULL,
  purchase_invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
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

CREATE INDEX idx_supplier_credit_notes_company
  ON public.supplier_credit_notes(company_id, issue_date DESC);
CREATE INDEX idx_supplier_credit_notes_purchase
  ON public.supplier_credit_notes(purchase_invoice_id);

CREATE TABLE public.supplier_debit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  debit_note_number TEXT NOT NULL,
  purchase_invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
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

CREATE INDEX idx_supplier_debit_notes_company
  ON public.supplier_debit_notes(company_id, issue_date DESC);
CREATE INDEX idx_supplier_debit_notes_purchase
  ON public.supplier_debit_notes(purchase_invoice_id);

CREATE TRIGGER supplier_credit_notes_updated_at
  BEFORE UPDATE ON public.supplier_credit_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER supplier_debit_notes_updated_at
  BEFORE UPDATE ON public.supplier_debit_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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
      'debit_note',
      'supplier_credit_note',
      'supplier_debit_note'
    )
  );

ALTER TABLE public.supplier_credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_debit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "supplier_credit_notes_select" ON public.supplier_credit_notes
  FOR SELECT USING (company_id = public.get_my_company_id() AND is_deleted = false);

CREATE POLICY "supplier_credit_notes_insert" ON public.supplier_credit_notes
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "supplier_credit_notes_update" ON public.supplier_credit_notes
  FOR UPDATE USING (company_id = public.get_my_company_id());

CREATE POLICY "supplier_debit_notes_select" ON public.supplier_debit_notes
  FOR SELECT USING (company_id = public.get_my_company_id() AND is_deleted = false);

CREATE POLICY "supplier_debit_notes_insert" ON public.supplier_debit_notes
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

CREATE POLICY "supplier_debit_notes_update" ON public.supplier_debit_notes
  FOR UPDATE USING (company_id = public.get_my_company_id());