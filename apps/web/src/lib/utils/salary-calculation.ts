export type SalaryMode = "hourly" | "fixed";

export type DailyPayrollRow = {
  employee_id: string;
  work_date: string;
  first_punch_at: string | null;
  total_minutes: number;
  day_credit: number;
};

export type EmployeePayrollInput = {
  employeeId: string;
  monthlySalary: number;
  hourlyRate: number;
  joiningDate: string | null;
};

export type CompanyPayrollSettings = {
  salaryMode: SalaryMode;
  dailyWorkHours: number;
  workingDaysPerMonth: number;
};

export type PayrollDayStats = {
  fullDays: number;
  halfDays: number;
  absentDays: number;
  eligibleDays: number;
  rawHours: number;
  adjustedHours: number;
  dayCredits: number;
};

export type GrossSalaryResult = PayrollDayStats & {
  grossSalary: number;
};

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getMonthDateRange(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 1).toISOString();
  return { monthStart, monthEnd, startDate, endDate };
}

export function countEligibleDays(
  monthStart: string,
  monthEnd: string,
  joiningDate: string | null
): number {
  const rangeStart = parseDateOnly(monthStart);
  const rangeEnd = parseDateOnly(monthEnd);
  let start = rangeStart;

  if (joiningDate) {
    const joined = parseDateOnly(joiningDate);
    if (joined > rangeEnd) return 0;
    if (joined > start) start = joined;
  }

  let count = 0;
  const cursor = new Date(start);
  while (cursor <= rangeEnd) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function filterRowsForEmployee(
  rows: DailyPayrollRow[],
  employeeId: string,
  monthStart: string,
  monthEnd: string,
  joiningDate: string | null
): DailyPayrollRow[] {
  const effectiveStart =
    joiningDate && joiningDate > monthStart ? joiningDate : monthStart;

  return rows.filter(
    (row) =>
      row.employee_id === employeeId &&
      row.work_date >= effectiveStart &&
      row.work_date <= monthEnd
  );
}

export function calculateGrossSalary(
  employee: EmployeePayrollInput,
  settings: CompanyPayrollSettings,
  dailyRows: DailyPayrollRow[],
  monthStart: string,
  monthEnd: string
): GrossSalaryResult {
  const eligibleDays = countEligibleDays(monthStart, monthEnd, employee.joiningDate);
  const rows = filterRowsForEmployee(
    dailyRows,
    employee.employeeId,
    monthStart,
    monthEnd,
    employee.joiningDate
  );

  let fullDays = 0;
  let halfDays = 0;
  let rawMinutes = 0;
  let adjustedMinutes = 0;
  let dayCredits = 0;

  for (const row of rows) {
    rawMinutes += row.total_minutes;
    adjustedMinutes += row.total_minutes * row.day_credit;
    dayCredits += row.day_credit;

    if (row.day_credit >= 1) fullDays += 1;
    else halfDays += 1;
  }

  const absentDays = Math.max(0, eligibleDays - fullDays - halfDays);
  const rawHours = Math.round((rawMinutes / 60) * 10) / 10;
  const adjustedHours = Math.round((adjustedMinutes / 60) * 10) / 10;

  const dailyRate =
    settings.workingDaysPerMonth > 0
      ? employee.monthlySalary / settings.workingDaysPerMonth
      : 0;

  let grossSalary = 0;

  if (settings.salaryMode === "fixed") {
    grossSalary = Math.round(dayCredits * dailyRate);
    if (employee.monthlySalary > 0) {
      grossSalary = Math.min(grossSalary, Math.round(employee.monthlySalary));
    }
  } else {
    grossSalary = Math.round((adjustedMinutes / 60) * employee.hourlyRate);
  }

  return {
    fullDays,
    halfDays,
    absentDays,
    eligibleDays,
    rawHours,
    adjustedHours,
    dayCredits: Math.round(dayCredits * 10) / 10,
    grossSalary,
  };
}