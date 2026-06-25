import { createClient } from "@/lib/supabase/server";

export type CompanySettings = {
  id: string;
  name: string;
  work_start_time: string;
  grace_period_minutes: number;
  daily_work_hours: number;
  working_days_per_month: number;
  has_data_lock_pin: boolean;
};

/**
 * Get company settings for the current user's company
 */
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Get user's company_id
  const { data: userData } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, work_start_time, grace_period_minutes, daily_work_hours, working_days_per_month, data_lock_pin_hash"
    )
    .eq("id", (userData as { company_id: string }).company_id)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id,
    name: row.name,
    work_start_time: row.work_start_time ?? "10:00",
    grace_period_minutes: row.grace_period_minutes ?? 5,
    daily_work_hours: row.daily_work_hours ?? 8,
    working_days_per_month: row.working_days_per_month ?? 26,
    has_data_lock_pin: Boolean(row.data_lock_pin_hash),
  };
}

export async function getDataLockStatus(): Promise<{ hasPin: boolean }> {
  const settings = await getCompanySettings();
  return { hasPin: settings?.has_data_lock_pin ?? false };
}
