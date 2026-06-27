-- P2-2: Owner UI language (English, Gujarati, Hindi)

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS ui_language TEXT NOT NULL DEFAULT 'en'
    CHECK (ui_language IN ('en', 'gu', 'hi'));

COMMENT ON COLUMN companies.ui_language IS
  'Dashboard UI language for owner-facing labels: en, gu (Gujarati), hi (Hindi).';