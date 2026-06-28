import { createClient } from "@/lib/supabase/server";
import type { EmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import { getMonthDateRange } from "@/lib/utils/salary-calculation";
import {
  buildFingerprintSalaryReport,
  type FingerprintEmployeeRecord,
  type FingerprintSalaryReport,
} from "@/lib/utils/fingerprint-salary-report";
import { fetchSalaryPaidByEmployeeForMonth } from "@/lib/utils/salary-paid-map";

type CompanyFingerprintConfig = {
  companyId: string;
  dailyWorkHours: number;
  workingDaysPerMonth: number;
  otRateMultiplier: number;
};

async function getCompanyFingerprintConfig(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CompanyFingerprintConfig | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const companyId = (profile as { company_id: string }).company_id;

  const { data: company } = await supabase
    .from("companies")
    .select("daily_work_hours, working_days_per_month, ot_rate_multiplier")
    .eq("id", companyId)
    .single();

  const row = company as {
    daily_work_hours: number | null;
    working_days_per_month: number | null;
    ot_rate_multiplier: number | null;
  } | null;

  return {
    companyId,
    dailyWorkHours: Number(row?.daily_work_hours ?? 8),
    workingDaysPerMonth: Number(row?.working_days_per_month ?? 26),
    otRateMultiplier: Number(row?.ot_rate_multiplier ?? 1),
  };
}

async function fetchEmployees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyId: string
): Promise<FingerprintEmployeeRecord[]> {
  const { data } = await supabase
    .from("users")
    .select("id, full_name, monthly_salary, posts(name)")
    .eq("company_id", companyId)
    .eq("role", "employee")
    .eq("is_active", true)
    .order("full_name");

  return ((data as Array<{
    id: string;
    full_name: string;
    monthly_salary: number | null;
    posts: { name: string } | null;
  }> | null) ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    monthlySalary: Number(row.monthly_salary ?? 0),
    designation: row.posts?.name ?? null,
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

async function fetchPaidMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  monthStr: string,
  monthStart: string,
  monthEnd: string
) {
  return fetchSalaryPaidByEmployeeForMonth(supabase, monthStr, monthStart, monthEnd);
}

export async function getFingerprintSalaryReport(
  monthStr: string
): Promise<FingerprintSalaryReport | null> {
  const supabase = await createClient();
  const config = await getCompanyFingerprintConfig(supabase);
  if (!config) return null;

  const { data: importRecord } = await supabase
    .from("attendance_imports")
    .select("id, file_name, uploaded_at, eligible_days, ot_rate_multiplier")
    .eq("company_id", config.companyId)
    .eq("salary_month", monthStr)
    .maybeSingle();

  if (!importRecord) return null;

  const importRow = importRecord as {
    id: string;
    file_name: string;
    uploaded_at: string;
    eligible_days: number;
    ot_rate_multiplier: number;
  };

  const [{ data: rows }, { data: aliases }] = await Promise.all([
    supabase
      .from("attendance_import_rows")
      .select(
        "id, fingerprint_name, employee_id, days_worked, ot_hours, sundays_excluded, weekday_absents, summary_present"
      )
      .eq("import_id", importRow.id)
      .order("fingerprint_name"),
    supabase
      .from("employee_fingerprint_aliases")
      .select("fingerprint_name, employee_id")
      .eq("company_id", config.companyId),
  ]);

  if (!rows || rows.length === 0) return null;

  const { monthStart, monthEnd } = getMonthDateRange(monthStr);
  const [employees, advanceMap, paidMap] = await Promise.all([
    fetchEmployees(supabase, config.companyId),
    fetchAdvanceMap(supabase, monthStr, monthStart, monthEnd),
    fetchPaidMap(supabase, monthStr, monthStart, monthEnd),
  ]);

  return buildFingerprintSalaryReport({
    importRows: rows as Array<{
      id: string;
      fingerprint_name: string;
      employee_id: string | null;
      days_worked: number;
      ot_hours: number;
      sundays_excluded: number;
      weekday_absents: number;
      summary_present: number | null;
    }>,
    employees,
    aliases: (aliases as Array<{ fingerprint_name: string; employee_id: string }> | null) ?? [],
    settings: {
      dailyWorkHours: config.dailyWorkHours,
      workingDaysPerMonth: config.workingDaysPerMonth,
      otRateMultiplier: Number(importRow.ot_rate_multiplier ?? config.otRateMultiplier),
    },
    advanceByEmployee: advanceMap,
    paidByEmployee: paidMap,
    fileName: importRow.file_name,
    uploadedAt: importRow.uploaded_at,
    eligibleDays: importRow.eligible_days,
    otRateMultiplier: Number(importRow.ot_rate_multiplier ?? config.otRateMultiplier),
  });
}

export type UnmatchedFingerprintRow = {
  importRowId: string;
  fingerprintName: string;
};

export async function getUnmatchedFingerprintRows(
  monthStr: string
): Promise<UnmatchedFingerprintRow[]> {
  const supabase = await createClient();
  const config = await getCompanyFingerprintConfig(supabase);
  if (!config) return [];

  const { data: importRecord } = await supabase
    .from("attendance_imports")
    .select("id")
    .eq("company_id", config.companyId)
    .eq("salary_month", monthStr)
    .maybeSingle();

  if (!importRecord) return [];

  const { data: rows } = await supabase
    .from("attendance_import_rows")
    .select("id, fingerprint_name, employee_id")
    .eq("import_id", (importRecord as { id: string }).id)
    .is("employee_id", null)
    .order("fingerprint_name");

  return ((rows as Array<{ id: string; fingerprint_name: string }> | null) ?? []).map(
    (row) => ({
      importRowId: row.id,
      fingerprintName: row.fingerprint_name,
    })
  );
}

export async function getFingerprintEmployeePayable(
  employeeId: string,
  monthStr: string
): Promise<EmployeeSalaryPayable | null> {
  const report = await getFingerprintSalaryReport(monthStr);
  if (!report) return null;

  const line = report.lines.find((row) => row.employeeId === employeeId && row.isMatched);
  if (!line) return null;

  const fullDays = Math.floor(line.workingDays);
  const halfDays = line.workingDays - fullDays >= 0.5 ? 1 : 0;

  return {
    employeeId: line.employeeId!,
    employeeName: line.employeeName,
    month: monthStr,
    salaryMode: "fixed",
    grossSalary: line.totalSalary,
    advanceDeduction: line.advanceDeduction,
    netSalary: line.netPayment,
    alreadyPaid: line.alreadyPaid,
    suggestedAmount: line.suggestedPay,
    overAdvanced: line.overAdvanced,
    fullDays,
    halfDays,
    absentDays: line.weekdayAbsents,
  };
}

export type AttendanceImportSummary = {
  salaryMonth: string;
  label: string;
  fileName: string;
  uploadedAt: string;
  employeeCount: number;
};

export async function getAttendanceImportMonths(): Promise<AttendanceImportSummary[]> {
  const supabase = await createClient();
  const config = await getCompanyFingerprintConfig(supabase);
  if (!config) return [];

  const { data: imports } = await supabase
    .from("attendance_imports")
    .select("id, salary_month, file_name, uploaded_at")
    .eq("company_id", config.companyId)
    .order("salary_month", { ascending: false });

  if (!imports?.length) return [];

  const importIds = (imports as Array<{ id: string }>).map((row) => row.id);
  const { data: rows } = await supabase
    .from("attendance_import_rows")
    .select("import_id")
    .in("import_id", importIds);

  const countByImport = new Map<string, number>();
  for (const row of (rows as Array<{ import_id: string }> | null) ?? []) {
    countByImport.set(row.import_id, (countByImport.get(row.import_id) ?? 0) + 1);
  }

  return (imports as Array<{
    id: string;
    salary_month: string;
    file_name: string;
    uploaded_at: string;
  }>).map((row) => {
    const [year, month] = row.salary_month.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    return {
      salaryMonth: row.salary_month,
      label,
      fileName: row.file_name,
      uploadedAt: row.uploaded_at,
      employeeCount: countByImport.get(row.id) ?? 0,
    };
  });
}

export async function getActiveEmployeesForMapping(): Promise<
  Array<{ id: string; fullName: string }>
> {
  const supabase = await createClient();
  const config = await getCompanyFingerprintConfig(supabase);
  if (!config) return [];

  const employees = await fetchEmployees(supabase, config.companyId);
  return employees.map((emp) => ({ id: emp.id, fullName: emp.fullName }));
}