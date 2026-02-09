import { createClient } from "@/lib/supabase/server";

export type SalaryReport = {
  employee_id: string;
  employee_name: string;
  hourly_rate: number;
  workshop_hours: number;
  travel_hours: number;
  onsite_hours: number;
  total_hours: number;
  gross_salary: number;
  advance_deduction: number;
  net_salary: number;
  /** @deprecated use net_salary instead */
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
    .select("id, full_name, hourly_rate")
    .eq("role", "employee")
    .eq("is_active", true);

  if (!employeesData || employeesData.length === 0) return [];

  type EmpRow = {
    id: string;
    full_name: string;
    hourly_rate: number | null;
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

  // 3. Fetch approved advances for this month
  const { data: advancesData } = await supabase
    .from("salary_advances")
    .select("employee_id, amount")
    .eq("status", "approved")
    .eq("salary_month", monthStr);

  // Build a map of employee_id → total advance amount
  const advanceMap = new Map<string, number>();
  if (advancesData) {
    for (const adv of advancesData) {
      const empId = (adv as { employee_id: string }).employee_id;
      const amt = (adv as { amount: number }).amount ?? 0;
      advanceMap.set(empId, (advanceMap.get(empId) ?? 0) + amt);
    }
  }

  // 4. Aggregate data per employee
  const reportMap = new Map<
    string,
    Omit<SalaryReport, "gross_salary" | "advance_deduction" | "net_salary" | "total_salary" | "total_hours">
    & { workshop_hours: number; travel_hours: number; onsite_hours: number }
  >();

  // Initialize report for all employees (even those with 0 hours)
  for (const emp of employees) {
    reportMap.set(emp.id, {
      employee_id: emp.id,
      employee_name: emp.full_name,
      hourly_rate: emp.hourly_rate ?? 0,
      workshop_hours: 0,
      travel_hours: 0,
      onsite_hours: 0,
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
  const reports: SalaryReport[] = Array.from(reportMap.values()).map((r) => {
    // Same hourly_rate applies to all states (workshop, travel, on-site)
    const workshopPay = r.workshop_hours * r.hourly_rate;
    const onsitePay = r.onsite_hours * r.hourly_rate;
    const travelPay = r.travel_hours * r.hourly_rate;
    const grossSalary = Math.round(workshopPay + onsitePay + travelPay);
    const advanceDeduction = advanceMap.get(r.employee_id) ?? 0;
    const netSalary = Math.round(grossSalary - advanceDeduction);
    const totalHours = r.workshop_hours + r.travel_hours + r.onsite_hours;

    return {
      ...r,
      total_hours: totalHours,
      gross_salary: grossSalary,
      advance_deduction: advanceDeduction,
      net_salary: netSalary,
      total_salary: netSalary, // backward compat
    };
  });

  return reports.sort((a, b) => b.net_salary - a.net_salary);
}
