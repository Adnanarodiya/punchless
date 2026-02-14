import { supabase } from "@/lib/supabase";

export type TodayAttendanceSummary = {
  currentState: "off_duty" | "workshop" | "travel" | "on_site_job" | "break";
  workshopMinutes: number;
  travelMinutes: number;
  onsiteMinutes: number;
  breakMinutes: number;
  totalMinutes: number;
  /** ISO timestamp of current open session start (for live counter) */
  currentSessionStart: string | null;
};

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function getTodayAttendanceSummary(employeeId: string): Promise<TodayAttendanceSummary> {
  const { start, end } = getTodayRange();

  // Get all closed sessions for today (with duration)
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("state, duration_minutes")
    .eq("employee_id", employeeId)
    .gte("start_time", start)
    .lt("start_time", end)
    .not("duration_minutes", "is", null);

  // Get current open session (if any)
  const { data: active } = await supabase
    .from("attendance_sessions")
    .select("state, start_time")
    .eq("employee_id", employeeId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  let workshopMinutes = 0;
  let travelMinutes = 0;
  let onsiteMinutes = 0;
  let breakMinutes = 0;

  for (const row of sessions ?? []) {
    const mins = row.duration_minutes ?? 0;
    if (row.state === "workshop") workshopMinutes += mins;
    if (row.state === "travel") travelMinutes += mins;
    if (row.state === "on_site_job") onsiteMinutes += mins;
    if (row.state === "break") breakMinutes += mins;
  }

  const currentState = (active?.state as TodayAttendanceSummary["currentState"]) ?? "off_duty";
  const currentSessionStart = active?.start_time ?? null;

  return {
    currentState,
    workshopMinutes,
    travelMinutes,
    onsiteMinutes,
    breakMinutes,
    // Total working minutes = everything except break
    totalMinutes: workshopMinutes + travelMinutes + onsiteMinutes,
    currentSessionStart,
  };
}
