-- Remove redundant travel_rate column from users
-- We use a single hourly_rate for workshop, travel, and on-site work

ALTER TABLE users
  DROP COLUMN IF EXISTS travel_rate;
