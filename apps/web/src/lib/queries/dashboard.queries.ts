import { createClient } from "@/lib/supabase/server";
import type { AttendanceWithDetails } from "./attendance.queries";
import type { JobWithDetails } from "./job.queries";

export type DashboardStats = {
  employeeCount: number;
  activeSessionCount: number;
  activeJobCount: number;
  pendingAdvanceCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    { count: employeeCount },
    { count: activeSessionCount },
    { count: activeJobCount },
    { count: pendingAdvanceCount },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("role", "employee"),
    supabase
      .from("attendance_sessions")
      .select("*", { count: "exact", head: true })
      .is("end_time", null),
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["pending", "assigned", "in_progress"]),
    supabase
      .from("salary_advances")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    employeeCount: employeeCount ?? 0,
    activeSessionCount: activeSessionCount ?? 0,
    activeJobCount: activeJobCount ?? 0,
    pendingAdvanceCount: pendingAdvanceCount ?? 0,
  };
}

export async function getRecentAttendance(
  limit = 10
): Promise<AttendanceWithDetails[]> {
  const supabase = await createClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .gte("start_time", weekAgo.toISOString())
    .order("start_time", { ascending: false })
    .limit(limit);

  type RawRow = AttendanceWithDetails & {
    users: { full_name: string; email: string } | null;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((row) => ({
    ...row,
    employee_name: row.users?.full_name ?? row.employee_name ?? "Unknown",
    employee_email: row.users?.email ?? row.employee_email ?? "",
    workshop_name: row.workshops?.name ?? row.workshop_name ?? null,
    job_title: row.jobs?.title ?? row.job_title ?? null,
  }));
}

export async function getRecentJobs(limit = 10): Promise<JobWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select("*, users(full_name, email)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  type RawRow = JobWithDetails & {
    users: { full_name: string; email: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((job) => ({
    ...job,
    assigned_to_name: job.users?.full_name ?? job.assigned_to_name ?? null,
    assigned_to_email: job.users?.email ?? job.assigned_to_email ?? null,
  }));
}