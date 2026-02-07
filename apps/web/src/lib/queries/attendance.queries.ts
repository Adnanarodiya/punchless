import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type AttendanceRow = Database["public"]["Tables"]["attendance_sessions"]["Row"];

export type AttendanceWithDetails = AttendanceRow & {
  employee_name: string;
  employee_email: string;
  workshop_name: string | null;
  job_title: string | null;
};

/**
 * Get today's attendance sessions for the company
 */
export async function getTodayAttendance(): Promise<AttendanceWithDetails[]> {
  const supabase = await createClient();

  // Start of today in UTC
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .gte("start_time", todayStart.toISOString())
    .order("start_time", { ascending: false });

  type RawRow = AttendanceRow & {
    users: { full_name: string; email: string } | null;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((r) => ({
    ...r,
    employee_name: r.users?.full_name ?? "Unknown",
    employee_email: r.users?.email ?? "",
    workshop_name: r.workshops?.name ?? null,
    job_title: r.jobs?.title ?? null,
  }));
}

/**
 * Get attendance sessions for a date range (for reports)
 */
export async function getAttendanceByDateRange(
  startDate: string,
  endDate: string
): Promise<AttendanceWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time", { ascending: false });

  type RawRow = AttendanceRow & {
    users: { full_name: string; email: string } | null;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((r) => ({
    ...r,
    employee_name: r.users?.full_name ?? "Unknown",
    employee_email: r.users?.email ?? "",
    workshop_name: r.workshops?.name ?? null,
    job_title: r.jobs?.title ?? null,
  }));
}

/**
 * Get live/active sessions (no end_time = still clocked in)
 */
export async function getActiveSessions(): Promise<AttendanceWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .is("end_time", null)
    .order("start_time", { ascending: false });

  type RawRow = AttendanceRow & {
    users: { full_name: string; email: string } | null;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((r) => ({
    ...r,
    employee_name: r.users?.full_name ?? "Unknown",
    employee_email: r.users?.email ?? "",
    workshop_name: r.workshops?.name ?? null,
    job_title: r.jobs?.title ?? null,
  }));
}

/**
 * Get per-employee summary for a date range
 * Groups attendance by employee + workshop and sums hours
 */
export async function getAttendanceSummary(
  startDate: string,
  endDate: string
): Promise<
  {
    employee_id: string;
    employee_name: string;
    workshop_name: string | null;
    state: string;
    total_minutes: number;
  }[]
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("attendance_sessions")
    .select("employee_id, state, duration_minutes, workshop_id, users(full_name), workshops(name)")
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .not("duration_minutes", "is", null);

  type RawRow = {
    employee_id: string;
    state: string;
    duration_minutes: number | null;
    workshop_id: string | null;
    users: { full_name: string } | null;
    workshops: { name: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  // Group by employee + workshop + state
  const grouped = new Map<string, {
    employee_id: string;
    employee_name: string;
    workshop_name: string | null;
    state: string;
    total_minutes: number;
  }>();

  for (const r of rows) {
    const key = `${r.employee_id}|${r.workshop_id ?? "none"}|${r.state}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.total_minutes += r.duration_minutes ?? 0;
    } else {
      grouped.set(key, {
        employee_id: r.employee_id,
        employee_name: r.users?.full_name ?? "Unknown",
        workshop_name: r.workshops?.name ?? null,
        state: r.state,
        total_minutes: r.duration_minutes ?? 0,
      });
    }
  }

  return Array.from(grouped.values());
}
