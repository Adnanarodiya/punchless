-- Add workshop_id to users table
-- This is the "currently assigned" workshop for the employee
-- The attendance engine uses this + geofence to auto-detect which workshop they're at
-- When reassigned, just update this field — attendance_sessions keep the historical workshop_id

ALTER TABLE public.users
  ADD COLUMN workshop_id UUID REFERENCES public.workshops(id) ON DELETE SET NULL;

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_workshop_id ON public.users(workshop_id);
