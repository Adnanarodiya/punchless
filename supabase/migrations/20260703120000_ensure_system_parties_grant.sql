-- Allow app + wipe script to recreate INCOME/EXPENSE after data wipes

GRANT EXECUTE ON FUNCTION public.ensure_system_parties(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_system_parties(UUID) TO service_role;