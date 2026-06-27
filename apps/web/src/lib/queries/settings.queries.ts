import { createClient } from "@/lib/supabase/server";
import type { DashboardExperience, UiLanguage } from "@punchless/types";

export type CompanyProfile = {
  name: string;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
};

export type SalaryMode = "hourly" | "fixed";

export type CompanySettings = {
  id: string;
  name: string;
  dashboard_experience: DashboardExperience;
  ui_language: UiLanguage;
  salary_mode: SalaryMode;
  work_start_time: string;
  grace_period_minutes: number;
  daily_work_hours: number;
  working_days_per_month: number;
  ot_rate_multiplier: number;
  has_data_lock_pin: boolean;
  tagline: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
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

  const { data: userData } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  if (!userData) return null;

  const { data, error } = await supabase
    .from("companies")
    .select(
      "id, name, dashboard_experience, ui_language, salary_mode, work_start_time, grace_period_minutes, daily_work_hours, working_days_per_month, ot_rate_multiplier, data_lock_pin_hash, tagline, address, phone, email, logo_url"
    )
    .eq("id", (userData as { company_id: string }).company_id)
    .single();

  if (error || !data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id,
    name: row.name,
    dashboard_experience:
      row.dashboard_experience === "full" ? "full" : "simple",
    ui_language:
      row.ui_language === "gu" || row.ui_language === "hi"
        ? row.ui_language
        : "en",
    salary_mode: row.salary_mode === "fixed" ? "fixed" : "hourly",
    work_start_time: row.work_start_time ?? "10:00",
    grace_period_minutes: row.grace_period_minutes ?? 5,
    daily_work_hours: row.daily_work_hours ?? 8,
    working_days_per_month: row.working_days_per_month ?? 26,
    ot_rate_multiplier: Number(row.ot_rate_multiplier ?? 1),
    has_data_lock_pin: Boolean(row.data_lock_pin_hash),
    tagline: row.tagline ?? null,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    logo_url: row.logo_url ?? null,
  };
}

export async function getCompanyProfile(): Promise<CompanyProfile | null> {
  const settings = await getCompanySettings();
  if (!settings) return null;

  return {
    name: settings.name,
    tagline: settings.tagline,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    logo_url: settings.logo_url,
  };
}

export async function getDataLockStatus(): Promise<{ hasPin: boolean }> {
  const settings = await getCompanySettings();
  return { hasPin: settings?.has_data_lock_pin ?? false };
}

export type DashboardShellPrefs = {
  hasDataLockPin: boolean;
  dashboardExperience: DashboardExperience;
  uiLanguage: UiLanguage;
};

export async function getDashboardShellPrefs(): Promise<DashboardShellPrefs> {
  const settings = await getCompanySettings();
  return {
    hasDataLockPin: settings?.has_data_lock_pin ?? false,
    dashboardExperience: settings?.dashboard_experience ?? "simple",
    uiLanguage: settings?.ui_language ?? "en",
  };
}