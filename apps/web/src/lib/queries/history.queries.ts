import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type AttendanceRow = Database["public"]["Tables"]["attendance_sessions"]["Row"];

export type HistorySession = AttendanceRow & {
  employee_name: string;
  employee_email: string;
  workshop_name: string | null;
  job_title: string | null;
};

export type EmployeeHistorySummary = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  workshop_name: string | null;
  total_sessions: number;
  total_minutes: number;
  workshop_minutes: number;
  travel_minutes: number;
  onsite_minutes: number;
  first_clock_in: string | null;
  last_activity: string | null;
  is_active_now: boolean;
  current_state: string | null;
  /** Start time of the current live session (for real-time calculation) */
  live_session_start: string | null;
};

/**
 * Get all attendance sessions for a date range (history)
 */
export async function getHistorySessions(
  startDate: string,
  endDate: string,
  page = 1,
  limit = 50
): Promise<HistorySession[]> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1);

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
 * Get employee-level summary for a date range
 */
export async function getEmployeeSummaries(
  startDate: string,
  endDate: string
): Promise<EmployeeHistorySummary[]> {
  const supabase = await createClient();

  // Get all sessions in date range
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email, workshop_id, workshops(name))")
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time", { ascending: false });

  // Get currently active sessions (with start_time for live duration calc)
  const { data: activeSessions } = await supabase
    .from("attendance_sessions")
    .select("employee_id, state, start_time")
    .is("end_time", null) as { data: { employee_id: string; state: string; start_time: string }[] | null };

  type RawRow = AttendanceRow & {
    users: {
      full_name: string;
      email: string;
      workshop_id: string | null;
      workshops: { name: string } | null;
    } | null;
  };

  const rows = (sessions as unknown as RawRow[]) ?? [];
  const activeMap = new Map<string, { state: string; start_time: string }>();
  for (const a of activeSessions ?? []) {
    activeMap.set(a.employee_id, { state: a.state, start_time: a.start_time });
  }

  const nowMs = Date.now();

  // Group by employee
  const employeeMap = new Map<string, EmployeeHistorySummary>();

  for (const r of rows) {
    const empId = r.employee_id;
    let summary = employeeMap.get(empId);
    const activeInfo = activeMap.get(empId);

    if (!summary) {
      summary = {
        employee_id: empId,
        employee_name: r.users?.full_name ?? "Unknown",
        employee_email: r.users?.email ?? "",
        workshop_name: r.users?.workshops?.name ?? null,
        total_sessions: 0,
        total_minutes: 0,
        workshop_minutes: 0,
        travel_minutes: 0,
        onsite_minutes: 0,
        first_clock_in: null,
        last_activity: null,
        is_active_now: !!activeInfo,
        current_state: activeInfo?.state ?? null,
        live_session_start: activeInfo?.start_time ?? null,
      };
      employeeMap.set(empId, summary);
    }

    summary.total_sessions++;

    // For open (live) sessions, calculate live duration instead of using null duration_minutes
    const isLive = !r.end_time;
    const mins = isLive
      ? Math.round((nowMs - new Date(r.start_time).getTime()) / 60000)
      : (r.duration_minutes ?? 0);

    summary.total_minutes += mins;

    if (r.state === "workshop") summary.workshop_minutes += mins;
    if (r.state === "travel") summary.travel_minutes += mins;
    if (r.state === "on_site_job") summary.onsite_minutes += mins;

    // Track first clock-in
    if (!summary.first_clock_in || r.start_time < summary.first_clock_in) {
      summary.first_clock_in = r.start_time;
    }

    // Track last activity — for open sessions use "now", for closed use end_time
    if (isLive) {
      summary.last_activity = new Date().toISOString();
    } else {
      const endTime = r.end_time!;
      if (!summary.last_activity || endTime > summary.last_activity) {
        summary.last_activity = endTime;
      }
    }
  }

  return Array.from(employeeMap.values());
}

/**
 * Get history sessions for a specific employee
 */
export async function getEmployeeHistory(
  employeeId: string,
  startDate: string,
  endDate: string,
  page = 1,
  limit = 50
): Promise<HistorySession[]> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .eq("employee_id", employeeId)
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1);

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
