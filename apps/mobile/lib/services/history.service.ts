import { supabase } from "@/lib/supabase";

export type HistorySession = {
  id: string;
  state: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  workshop_name: string | null;
  job_title: string | null;
};

export type HistoryDaySummary = {
  date: string;
  sessions: HistorySession[];
  workshopMinutes: number;
  travelMinutes: number;
  onsiteMinutes: number;
  totalMinutes: number;
  firstClockIn: string | null;
  lastClockOut: string | null;
};

/**
 * Get attendance history for an employee in a date range
 */
export async function getAttendanceHistory(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<HistorySession[]> {
  const { data } = await supabase
    .from("attendance_sessions")
    .select("id, state, start_time, end_time, duration_minutes, workshop_id, job_id, workshops(name), jobs(title)")
    .eq("employee_id", employeeId)
    .gte("start_time", startDate)
    .lte("start_time", endDate)
    .order("start_time", { ascending: false });

  type RawRow = {
    id: string;
    state: string;
    start_time: string;
    end_time: string | null;
    duration_minutes: number | null;
    workshop_id: string | null;
    job_id: string | null;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((r) => ({
    id: r.id,
    state: r.state,
    start_time: r.start_time,
    end_time: r.end_time,
    duration_minutes: r.duration_minutes,
    workshop_name: r.workshops?.name ?? null,
    job_title: r.jobs?.title ?? null,
  }));
}

/**
 * Group sessions by date and compute daily summaries
 */
export function groupSessionsByDate(sessions: HistorySession[]): HistoryDaySummary[] {
  const dateMap = new Map<string, HistorySession[]>();

  for (const s of sessions) {
    const date = new Date(s.start_time).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
    const existing = dateMap.get(date) ?? [];
    existing.push(s);
    dateMap.set(date, existing);
  }

  const summaries: HistoryDaySummary[] = [];

  for (const [date, daySessions] of dateMap) {
    let workshopMinutes = 0;
    let travelMinutes = 0;
    let onsiteMinutes = 0;
    let firstClockIn: string | null = null;
    let lastClockOut: string | null = null;

    for (const s of daySessions) {
      const mins = s.duration_minutes ?? 0;
      if (s.state === "workshop") workshopMinutes += mins;
      if (s.state === "travel") travelMinutes += mins;
      if (s.state === "on_site_job") onsiteMinutes += mins;

      if (!firstClockIn || s.start_time < firstClockIn) {
        firstClockIn = s.start_time;
      }
      const endOrStart = s.end_time ?? s.start_time;
      if (!lastClockOut || endOrStart > lastClockOut) {
        lastClockOut = endOrStart;
      }
    }

    summaries.push({
      date,
      sessions: daySessions,
      workshopMinutes,
      travelMinutes,
      onsiteMinutes,
      totalMinutes: workshopMinutes + travelMinutes + onsiteMinutes,
      firstClockIn,
      lastClockOut,
    });
  }

  return summaries;
}
