-- Sales register CSV imports (one saved batch per company per day)

CREATE TABLE sales_register_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  file_name TEXT NOT NULL,
  invoice_count INTEGER NOT NULL DEFAULT 0 CHECK (invoice_count >= 0),
  total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  clients_created INTEGER NOT NULL DEFAULT 0,
  skipped_existing INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_sales_register_imports_company_date
  ON sales_register_imports(company_id, entry_date);

CREATE INDEX idx_sales_register_imports_company_uploaded
  ON sales_register_imports(company_id, uploaded_at DESC);

ALTER TABLE sales_register_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sales_register_imports_select" ON sales_register_imports
  FOR SELECT USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "sales_register_imports_insert" ON sales_register_imports
  FOR INSERT WITH CHECK (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "sales_register_imports_update" ON sales_register_imports
  FOR UPDATE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );

CREATE POLICY "sales_register_imports_delete" ON sales_register_imports
  FOR DELETE USING (
    company_id = get_my_company_id()
    AND get_my_role() IN ('owner', 'admin')
  );