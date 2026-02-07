import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

// type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type SalaryReport = {
  employee_id: string;
  employee_name: string;
  hourly_rate: number;
  travel_rate: number;
  workshop_hours: number;
  travel_hours: number;
  onsite_hours: number;
  total_hours: number;
  total_salary: number;
};

export async function getSalaryReport(monthStr: string): Promise<SalaryReport[]> {
  const supabase = await createClient();

  // Calculate start/end dates for the selected month
  // monthStr format: "YYYY-MM" (e.g., "2026-02")
  const [year, month] = monthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString();
  // End date is start of next month
  const endDate = new Date(year, month, 1).toISOString();

  // 1. Fetch all employees
  const { data: employeesData } = await supabase
    .from("users")
    .select("id, full_name, hourly_rate, travel_rate")
    .eq("role", "employee")
    .eq("is_active", true);

  if (!employeesData || employeesData.length === 0) return [];

  type EmpRow = {
    id: string;
    full_name: string;
    hourly_rate: number | null;
    travel_rate: number | null;
  };

  const employees = employeesData as unknown as EmpRow[];

  // 2. Fetch attendance sessions for this month
  const { data: sessionsData } = await supabase
    .from("attendance_sessions")
    .select("employee_id, state, duration_minutes")
    .gte("start_time", startDate)
    .lt("start_time", endDate)
    .not("duration_minutes", "is", null);

  if (!sessionsData) return [];

  type SessionRow = {
    employee_id: string;
    state: string;
    duration_minutes: number | null;
  };

  const sessions = sessionsData as unknown as SessionRow[];

  // 3. Aggregate data per employee
  const reportMap = new Map<string, SalaryReport>();

  // Initialize report for all employees (even those with 0 hours)
  for (const emp of employees) {
    reportMap.set(emp.id, {
      employee_id: emp.id,
      employee_name: emp.full_name,
      hourly_rate: emp.hourly_rate ?? 0,
      travel_rate: emp.travel_rate ?? 0,
      workshop_hours: 0,
      travel_hours: 0,
      onsite_hours: 0,
      total_hours: 0,
      total_salary: 0,
    });
  }

  // Sum up hours
  for (const session of sessions) {
    const report = reportMap.get(session.employee_id);
    if (!report) continue;

    const hours = (session.duration_minutes ?? 0) / 60;

    if (session.state === "workshop") {
      report.workshop_hours += hours;
    } else if (session.state === "travel") {
      report.travel_hours += hours;
    } else if (session.state === "on_site_job") {
      report.onsite_hours += hours;
    }
  }

  // Calculate totals
  const reports = Array.from(reportMap.values()).map((r) => {
    const workshopPay = r.workshop_hours * r.hourly_rate;
    const onsitePay = r.onsite_hours * r.hourly_rate; // Assuming same rate for now
    const travelPay = r.travel_hours * r.travel_rate;

    return {
      ...r,
      total_hours: r.workshop_hours + r.travel_hours + r.onsite_hours,
      total_salary: Math.round(workshopPay + onsitePay + travelPay),
    };
  });

  return reports.sort((a, b) => b.total_salary - a.total_salary);
}
