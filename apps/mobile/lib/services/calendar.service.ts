import { supabase } from "@/lib/supabase";

export type DayAttendanceStatus = "present" | "incomplete" | "absent";

export type DayAttendance = {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  requiredMinutes: number;
  status: DayAttendanceStatus;
};

export type MonthlyAttendanceData = {
  days: Record<string, DayAttendance>;
  totalPresent: number;
  totalIncomplete: number;
  totalAbsent: number;
};

/**
 * Fetch monthly attendance summary for calendar view.
 * For each day of the month:
 *   - Green (present): worked >= required hours
 *   - Orange (incomplete): worked > 0 but < required hours
 *   - Gray (absent): no attendance records
 */
export async function getMonthlyAttendance(
  employeeId: string,
  companyId: string,
  year: number,
  month: number // 1-indexed (1 = January)
): Promise<MonthlyAttendanceData> {
  // Get company settings for daily work hours
  const { data: company } = await supabase
    .from("companies")
    .select("daily_work_hours")
    .eq("id", companyId)
    .single();

  const dailyWorkHours = company?.daily_work_hours ?? 8;
  const requiredMinutes = dailyWorkHours * 60;

  // Build date range for the month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1); // first day of next month

  const startISO = startDate.toISOString();
  const endISO = endDate.toISOString();

  // Fetch all completed sessions for this month
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("start_time, duration_minutes, state")
    .eq("employee_id", employeeId)
    .gte("start_time", startISO)
    .lt("start_time", endISO)
    .not("duration_minutes", "is", null);

  // Aggregate minutes per day
  const dailyMinutes: Record<string, number> = {};

  for (const session of sessions ?? []) {
    if (!session.start_time || session.duration_minutes == null) continue;
    // Extract YYYY-MM-DD from the start_time
    const dateStr = session.start_time.substring(0, 10);
    dailyMinutes[dateStr] = (dailyMinutes[dateStr] ?? 0) + session.duration_minutes;
  }

  // Also check for any active (ongoing) sessions today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month
  ) {
    const { data: activeSessions } = await supabase
      .from("attendance_sessions")
      .select("start_time")
      .eq("employee_id", employeeId)
      .is("end_time", null)
      .limit(1);

    if (activeSessions && activeSessions.length > 0) {
      // Employee is currently working, mark today as at least present
      if (!dailyMinutes[todayStr]) {
        dailyMinutes[todayStr] = 1; // At least mark as some work done
      }
    }
  }

  // Build result for each day of the month
  const days: Record<string, DayAttendance> = {};
  let totalPresent = 0;
  let totalIncomplete = 0;
  let totalAbsent = 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const now = new Date();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayDate = new Date(year, month - 1, d);

    // Skip future dates
    if (dayDate > now) continue;

    const totalMins = dailyMinutes[dateStr] ?? 0;

    let status: DayAttendanceStatus;
    if (totalMins === 0) {
      status = "absent";
      totalAbsent++;
    } else if (totalMins >= requiredMinutes) {
      status = "present";
      totalPresent++;
    } else {
      status = "incomplete";
      totalIncomplete++;
    }

    days[dateStr] = {
      date: dateStr,
      totalMinutes: totalMins,
      requiredMinutes,
      status,
    };
  }

  return {
    days,
    totalPresent,
    totalIncomplete,
    totalAbsent,
  };
}
