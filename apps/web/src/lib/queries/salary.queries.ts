import { createClient } from "@/lib/supabase/server";
import {
  calculateGrossSalary,
  getMonthDateRange,
  type DailyPayrollRow,
  type SalaryMode,
} from "@/lib/utils/salary-calculation";

export type SalaryReport = {
  employee_id: string;
  employee_name: string;
  hourly_rate: number;
  monthly_salary: number;
  salary_mode: SalaryMode;
  workshop_hours: number;
  travel_hours: number;
  onsite_hours: number;
  total_hours: number;
  adjusted_hours: number;
  full_days: number;
  half_days: number;
  absent_days: number;
  gross_salary: number;
  advance_deduction: number;
  /** gross − advances (may be negative when over-advanced) */
  net_salary: number;
  already_paid: number;
  /** max(0, net_salary − already_paid) — amount still owed this month */
  suggested_pay: number;
  /** max(0, advances − gross) — advances exceed earned salary */
  over_advanced: number;
  /** @deprecated use net_salary instead */
  total_salary: number;
};

type CompanyPayrollConfig = {
  companyId: string;
  salaryMode: SalaryMode;
  workStartTime: string;
  gracePeriodMinutes: number;
  dailyWorkHours: number;
  workingDaysPerMonth: number;
};

async function getCompanyPayrollConfig(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CompanyPayrollConfig | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: userProfile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", authUser.id)
    .single();
  if (!userProfile) return null;

  const companyId = (userProfile as { company_id: string }).company_id;

  const { data: company } = await supabase
    .from("companies")
    .select(
      "salary_mode, work_start_time, grace_period_minutes, daily_work_hours, working_days_per_month"
    )
    .eq("id", companyId)
    .single();

  const row = company as {
    salary_mode: string | null;
    work_start_time: string | null;
    grace_period_minutes: number | null;
    daily_work_hours: number | null;
    working_days_per_month: number | null;
  } | null;

  return {
    companyId,
    salaryMode: row?.salary_mode === "fixed" ? "fixed" : "hourly",
    workStartTime: row?.work_start_time ?? "10:00",
    gracePeriodMinutes: row?.grace_period_minutes ?? 5,
    dailyWorkHours: Number(row?.daily_work_hours ?? 8),
    workingDaysPerMonth: Number(row?.working_days_per_month ?? 26),
  };
}

async function fetchDailyPayrollRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  config: CompanyPayrollConfig,
  monthStart: string,
  monthEnd: string
): Promise<DailyPayrollRow[]> {
  const { data } = await supabase.rpc("get_daily_attendance_payroll" as any, {
    p_company_id: config.companyId,
    p_start_date: monthStart,
    p_end_date: monthEnd,
    p_work_start_time: config.workStartTime,
    p_grace_minutes: config.gracePeriodMinutes,
  });

  return ((data as DailyPayrollRow[] | null) ?? []).map((row) => ({
    employee_id: row.employee_id,
    work_date: row.work_date,
    first_punch_at: row.first_punch_at,
    total_minutes: Number(row.total_minutes ?? 0),
    day_credit: Number(row.day_credit ?? 0),
  }));
}

async function fetchAdvanceMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  monthStr: string,
  monthStart: string,
  monthEnd: string
) {
  const [{ data: advancesData }, { data: staffAdvanceData }] = await Promise.all([
    supabase
      .from("salary_advances")
      .select("employee_id, amount")
      .eq("status", "approved")
      .eq("salary_month", monthStr),
    supabase
      .from("staff_payments")
      .select("employee_id, amount")
      .eq("payment_type", "advance")
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEnd),
  ]);

  const advanceMap = new Map<string, number>();
  for (const source of [advancesData, staffAdvanceData]) {
    if (!source) continue;
    for (const row of source) {
      const empId = (row as { employee_id: string }).employee_id;
      const amt = Number((row as { amount: number }).amount ?? 0);
      advanceMap.set(empId, (advanceMap.get(empId) ?? 0) + amt);
    }
  }

  return advanceMap;
}

async function fetchAlreadyPaidMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  monthStart: string,
  monthEnd: string
) {
  const { data } = await supabase
    .from("staff_payments")
    .select("employee_id, amount")
    .eq("payment_type", "salary_paid")
    .gte("payment_date", monthStart)
    .lte("payment_date", monthEnd);

  const paidMap = new Map<string, number>();
  for (const row of data ?? []) {
    const empId = (row as { employee_id: string }).employee_id;
    const amt = Number((row as { amount: number }).amount ?? 0);
    paidMap.set(empId, (paidMap.get(empId) ?? 0) + amt);
  }
  return paidMap;
}

function buildPayrollTotals(
  grossSalary: number,
  advanceDeduction: number,
  alreadyPaid: number
) {
  const netSalary = Math.round(grossSalary - advanceDeduction);
  const overAdvanced = Math.max(0, Math.round(advanceDeduction - grossSalary));
  const suggestedPay = Math.max(0, Math.round(netSalary - alreadyPaid));

  return { netSalary, overAdvanced, suggestedPay };
}

type SessionRow = {
  employee_id: string;
  state: string;
  total_duration_minutes: number;
};

function applySessionHours(
  reportMap: Map<
    string,
    {
      employee_id: string;
      employee_name: string;
      hourly_rate: number;
      monthly_salary: number;
      joining_date: string | null;
      workshop_hours: number;
      travel_hours: number;
      onsite_hours: number;
    }
  >,
  sessions: SessionRow[]
) {
  for (const session of sessions) {
    const report = reportMap.get(session.employee_id);
    if (!report) continue;

    const hours = (session.total_duration_minutes ?? 0) / 60;
    if (session.state === "workshop") report.workshop_hours += hours;
    else if (session.state === "travel") report.travel_hours += hours;
    else if (session.state === "on_site_job") report.onsite_hours += hours;
  }
}

export async function getSalaryReport(
  monthStr: string,
  page = 1,
  limit = 50
): Promise<{ reports: SalaryReport[]; salaryMode: SalaryMode }> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;
  const { monthStart, monthEnd, startDate, endDate } = getMonthDateRange(monthStr);

  const config = await getCompanyPayrollConfig(supabase);
  if (!config) return { reports: [], salaryMode: "hourly" };

  const [dailyRows, advanceMap, paidMap, sessionsData] = await Promise.all([
    fetchDailyPayrollRows(supabase, config, monthStart, monthEnd),
    fetchAdvanceMap(supabase, monthStr, monthStart, monthEnd),
    fetchAlreadyPaidMap(supabase, monthStart, monthEnd),
    supabase.rpc("get_monthly_attendance_summary" as any, {
      p_company_id: config.companyId,
      p_start_time: startDate,
      p_end_time: endDate,
    }),
  ]);

  const sessions = ((sessionsData.data as unknown as SessionRow[]) ?? []);

  const employeeIds = new Set<string>();
  for (const s of sessions) {
    if (s.employee_id) employeeIds.add(s.employee_id);
  }
  for (const row of dailyRows) employeeIds.add(row.employee_id);
  for (const empId of advanceMap.keys()) employeeIds.add(empId);

  let employeeQuery = supabase
    .from("users")
    .select("id, full_name, hourly_rate, monthly_salary, joining_date")
    .eq("role", "employee");

  if (employeeIds.size > 0) {
    employeeQuery = employeeQuery.or(
      `is_active.eq.true,id.in.(${Array.from(employeeIds).join(",")})`
    );
  } else {
    employeeQuery = employeeQuery.eq("is_active", true);
  }

  const { data: employeesData } = await employeeQuery
    .order("full_name")
    .range(offset, offset + limit - 1);

  if (!employeesData || employeesData.length === 0) {
    return { reports: [], salaryMode: config.salaryMode };
  }

  type EmpRow = {
    id: string;
    full_name: string;
    hourly_rate: number | null;
    monthly_salary: number | null;
    joining_date: string | null;
  };

  const employees = employeesData as unknown as EmpRow[];

  const reportMap = new Map<
    string,
    {
      employee_id: string;
      employee_name: string;
      hourly_rate: number;
      monthly_salary: number;
      joining_date: string | null;
      workshop_hours: number;
      travel_hours: number;
      onsite_hours: number;
    }
  >();

  for (const emp of employees) {
    reportMap.set(emp.id, {
      employee_id: emp.id,
      employee_name: emp.full_name,
      hourly_rate: emp.hourly_rate ?? 0,
      monthly_salary: Number(emp.monthly_salary ?? 0),
      joining_date: emp.joining_date,
      workshop_hours: 0,
      travel_hours: 0,
      onsite_hours: 0,
    });
  }

  applySessionHours(reportMap, sessions);

  const reports: SalaryReport[] = Array.from(reportMap.values()).map((r) => {
    const payroll = calculateGrossSalary(
      {
        employeeId: r.employee_id,
        monthlySalary: r.monthly_salary,
        hourlyRate: r.hourly_rate,
        joiningDate: r.joining_date,
      },
      {
        salaryMode: config.salaryMode,
        dailyWorkHours: config.dailyWorkHours,
        workingDaysPerMonth: config.workingDaysPerMonth,
      },
      dailyRows,
      monthStart,
      monthEnd
    );

    const advanceDeduction = Math.round(advanceMap.get(r.employee_id) ?? 0);
    const alreadyPaid = Math.round(paidMap.get(r.employee_id) ?? 0);
    const { netSalary, overAdvanced, suggestedPay } = buildPayrollTotals(
      payroll.grossSalary,
      advanceDeduction,
      alreadyPaid
    );
    const totalHours = r.workshop_hours + r.travel_hours + r.onsite_hours;

    return {
      employee_id: r.employee_id,
      employee_name: r.employee_name,
      hourly_rate: r.hourly_rate,
      monthly_salary: r.monthly_salary,
      salary_mode: config.salaryMode,
      workshop_hours: r.workshop_hours,
      travel_hours: r.travel_hours,
      onsite_hours: r.onsite_hours,
      total_hours: totalHours,
      adjusted_hours: payroll.adjustedHours,
      full_days: payroll.fullDays,
      half_days: payroll.halfDays,
      absent_days: payroll.absentDays,
      gross_salary: payroll.grossSalary,
      advance_deduction: advanceDeduction,
      net_salary: netSalary,
      already_paid: alreadyPaid,
      suggested_pay: suggestedPay,
      over_advanced: overAdvanced,
      total_salary: netSalary,
    };
  });

  return {
    reports: reports.sort((a, b) => b.suggested_pay - a.suggested_pay),
    salaryMode: config.salaryMode,
  };
}

export type EmployeeSalaryPayable = {
  employeeId: string;
  employeeName: string;
  month: string;
  salaryMode: SalaryMode;
  grossSalary: number;
  advanceDeduction: number;
  netSalary: number;
  alreadyPaid: number;
  suggestedAmount: number;
  overAdvanced: number;
  fullDays: number;
  halfDays: number;
  absentDays: number;
};

export async function getEmployeeSalaryPayable(
  employeeId: string,
  monthStr: string
): Promise<EmployeeSalaryPayable | null> {
  const { getFingerprintEmployeePayable } = await import(
    "@/lib/queries/attendance-import.queries"
  );
  const fingerprintPayable = await getFingerprintEmployeePayable(employeeId, monthStr);
  if (fingerprintPayable) return fingerprintPayable;

  const supabase = await createClient();
  const { monthStart, monthEnd } = getMonthDateRange(monthStr);

  const config = await getCompanyPayrollConfig(supabase);
  if (!config) return null;

  const { data: employee } = await supabase
    .from("users")
    .select("id, full_name, hourly_rate, monthly_salary, joining_date")
    .eq("id", employeeId)
    .eq("role", "employee")
    .single();

  if (!employee) return null;

  const emp = employee as {
    id: string;
    full_name: string;
    hourly_rate: number | null;
    monthly_salary: number | null;
    joining_date: string | null;
  };

  const [dailyRows, advanceMap, { data: salaryPaid }] = await Promise.all([
    fetchDailyPayrollRows(supabase, config, monthStart, monthEnd),
    fetchAdvanceMap(supabase, monthStr, monthStart, monthEnd),
    supabase
      .from("staff_payments")
      .select("amount")
      .eq("employee_id", employeeId)
      .eq("payment_type", "salary_paid")
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEnd),
  ]);

  const payroll = calculateGrossSalary(
    {
      employeeId: emp.id,
      monthlySalary: Number(emp.monthly_salary ?? 0),
      hourlyRate: emp.hourly_rate ?? 0,
      joiningDate: emp.joining_date,
    },
    {
      salaryMode: config.salaryMode,
      dailyWorkHours: config.dailyWorkHours,
      workingDaysPerMonth: config.workingDaysPerMonth,
    },
    dailyRows,
    monthStart,
    monthEnd
  );

  const advanceDeduction = Math.round(advanceMap.get(employeeId) ?? 0);
  const alreadyPaid = Math.round(
    ((salaryPaid as { amount: number }[] | null) ?? []).reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    )
  );
  const { netSalary, overAdvanced, suggestedPay } = buildPayrollTotals(
    payroll.grossSalary,
    advanceDeduction,
    alreadyPaid
  );

  return {
    employeeId: emp.id,
    employeeName: emp.full_name,
    month: monthStr,
    salaryMode: config.salaryMode,
    grossSalary: payroll.grossSalary,
    advanceDeduction,
    netSalary,
    alreadyPaid,
    suggestedAmount: suggestedPay,
    overAdvanced,
    fullDays: payroll.fullDays,
    halfDays: payroll.halfDays,
    absentDays: payroll.absentDays,
  };
}