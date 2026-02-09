import { supabase } from "@/lib/supabase";

export type MySalaryReport = {
  month: string;
  workshopHours: number;
  travelHours: number;
  onsiteHours: number;
  totalHours: number;
  grossSalary: number;
  advanceDeduction: number;
  netSalary: number;
};

export async function getMySalaryReport(employeeId: string, monthStr: string): Promise<MySalaryReport> {
  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 1).toISOString();

  const { data: me } = await supabase
    .from("users")
    .select("hourly_rate")
    .eq("id", employeeId)
    .single();

  const hourlyRate = me?.hourly_rate ?? 0;

  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("state, duration_minutes")
    .eq("employee_id", employeeId)
    .gte("start_time", startDate)
    .lt("start_time", endDate)
    .not("duration_minutes", "is", null);

  let workshopHours = 0;
  let travelHours = 0;
  let onsiteHours = 0;

  for (const row of sessions ?? []) {
    const h = (row.duration_minutes ?? 0) / 60;
    if (row.state === "workshop") workshopHours += h;
    if (row.state === "travel") travelHours += h;
    if (row.state === "on_site_job") onsiteHours += h;
  }

  const grossSalary = Math.round((workshopHours + travelHours + onsiteHours) * hourlyRate);

  const { data: advances } = await supabase
    .from("salary_advances")
    .select("amount")
    .eq("employee_id", employeeId)
    .eq("status", "approved")
    .eq("salary_month", monthStr);

  const advanceDeduction = (advances ?? []).reduce((sum, a) => sum + (a.amount ?? 0), 0);

  return {
    month: monthStr,
    workshopHours,
    travelHours,
    onsiteHours,
    totalHours: workshopHours + travelHours + onsiteHours,
    grossSalary,
    advanceDeduction,
    netSalary: grossSalary - advanceDeduction,
  };
}
