-- P0-1: Simple Owner Mode — company-wide dashboard experience toggle (simple | full)

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS dashboard_experience TEXT NOT NULL DEFAULT 'simple'
    CHECK (dashboard_experience IN ('simple', 'full'));

COMMENT ON COLUMN companies.dashboard_experience IS
  'Sidebar UX mode: simple = fewer nav items for non-technical owners; full = all ERP modules.';