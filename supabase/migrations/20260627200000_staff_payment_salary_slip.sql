-- Salary payment slip: month + frozen snapshot for print/re-print

ALTER TABLE staff_payments
  ADD COLUMN IF NOT EXISTS salary_month TEXT
    CHECK (salary_month IS NULL OR salary_month ~ '^\d{4}-\d{2}$');

ALTER TABLE staff_payments
  ADD COLUMN IF NOT EXISTS slip_snapshot JSONB;

COMMENT ON COLUMN staff_payments.salary_month IS
  'Salary month (YYYY-MM) for salary_paid payments — used for slips and history';

COMMENT ON COLUMN staff_payments.slip_snapshot IS
  'Frozen salary breakdown at payment time for printable attendance/salary slip';