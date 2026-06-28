-- V3 bookkeeping: ISHABA prefix, bank sub-mode, entry categories

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sales_invoice_prefix text NOT NULL DEFAULT 'ISHABA';

COMMENT ON COLUMN public.companies.sales_invoice_prefix IS
  'Fixed prefix for sales bill numbers (V3 default: ISHABA)';

DO $$ BEGIN
  CREATE TYPE public.bank_sub_mode AS ENUM ('upi', 'net_banking');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.entry_category AS ENUM (
    'sales_bill',
    'purchase_bill',
    'receipt',
    'payment',
    'indirect_income',
    'indirect_expense'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS bank_sub_mode public.bank_sub_mode,
  ADD COLUMN IF NOT EXISTS entry_category public.entry_category;

ALTER TABLE public.client_payments
  ADD COLUMN IF NOT EXISTS bank_sub_mode public.bank_sub_mode,
  ADD COLUMN IF NOT EXISTS entry_category public.entry_category DEFAULT 'receipt';

ALTER TABLE public.supplier_payments
  ADD COLUMN IF NOT EXISTS bank_sub_mode public.bank_sub_mode,
  ADD COLUMN IF NOT EXISTS entry_category public.entry_category DEFAULT 'payment';

ALTER TABLE public.ledger_entries
  ADD COLUMN IF NOT EXISTS bank_sub_mode public.bank_sub_mode,
  ADD COLUMN IF NOT EXISTS entry_category public.entry_category;

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS entry_category public.entry_category DEFAULT 'sales_bill';

ALTER TABLE public.purchase_invoices
  ADD COLUMN IF NOT EXISTS entry_category public.entry_category DEFAULT 'purchase_bill';