-- ============================================
-- Company Settings: work schedule & attendance rules
-- ============================================

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS work_start_time TEXT DEFAULT '10:00',         -- HH:MM format (e.g., '10:00')
  ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 5,       -- minutes after start time that's still OK
  ADD COLUMN IF NOT EXISTS daily_work_hours DECIMAL(4,2) DEFAULT 8,      -- hours per day (e.g., 8 or 9)
  ADD COLUMN IF NOT EXISTS working_days_per_month INTEGER DEFAULT 26;    -- days per month for salary calc

-- ============================================
-- Employee: store monthly salary, hourly_rate is auto-calculated
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(10,2) DEFAULT 0;

-- Backfill: calculate monthly_salary from existing hourly_rate
-- Formula: monthly_salary = hourly_rate × daily_work_hours × working_days
-- Using defaults: 8 hours × 26 days = 208 hours
UPDATE users
  SET monthly_salary = COALESCE(hourly_rate, 0) * 8 * 26
  WHERE role = 'employee' AND (monthly_salary IS NULL OR monthly_salary = 0) AND hourly_rate > 0;
