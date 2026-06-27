import { fingerprintNamesMatch } from "@/lib/utils/fingerprint-attendance-parser";

export type FingerprintPayrollSettings = {
  dailyWorkHours: number;
  workingDaysPerMonth: number;
  otRateMultiplier: number;
};

export type FingerprintEmployeeRecord = {
  id: string;
  fullName: string;
  monthlySalary: number;
  designation: string | null;
};

export type FingerprintSalaryLine = {
  employeeId: string | null;
  fingerprintName: string;
  employeeName: string;
  designation: string | null;
  monthlySalary: number;
  workingDays: number;
  eligibleDays: number;
  earnedSalary: number;
  otHours: number;
  otPay: number;
  totalSalary: number;
  advanceDeduction: number;
  netPayment: number;
  alreadyPaid: number;
  suggestedPay: number;
  overAdvanced: number;
  sundaysExcluded: number;
  weekdayAbsents: number;
  isMatched: boolean;
  importRowId: string | null;
};

export type FingerprintSalaryReport = {
  lines: FingerprintSalaryLine[];
  unmatchedCount: number;
  otRateMultiplier: number;
  eligibleDays: number;
  fileName: string | null;
  uploadedAt: string | null;
};

type ImportRowRecord = {
  id: string;
  fingerprint_name: string;
  employee_id: string | null;
  days_worked: number;
  ot_hours: number;
  eligible_days?: number;
  sundays_excluded: number;
  weekday_absents: number;
  summary_present: number | null;
};

type AliasRecord = {
  fingerprint_name: string;
  employee_id: string;
};

function roundMoney(value: number): number {
  return Math.round(value);
}

export function calculateFingerprintSalaryLine(
  employee: FingerprintEmployeeRecord | null,
  parsed: {
    fingerprintName: string;
    daysWorked: number;
    otHours: number;
    sundaysExcluded: number;
    weekdayAbsents: number;
  },
  settings: FingerprintPayrollSettings,
  advanceDeduction: number,
  alreadyPaid: number,
  importRowId: string | null
): FingerprintSalaryLine {
  const monthlySalary = employee?.monthlySalary ?? 0;
  const eligibleDays = settings.workingDaysPerMonth;
  const workingDays = parsed.daysWorked;
  const otHours = parsed.otHours;

  const earnedSalary =
    eligibleDays > 0 && monthlySalary > 0
      ? roundMoney((monthlySalary * workingDays) / eligibleDays)
      : 0;

  const hourlyRate =
    eligibleDays > 0 && settings.dailyWorkHours > 0
      ? monthlySalary / (eligibleDays * settings.dailyWorkHours)
      : 0;

  const otPay = roundMoney(otHours * hourlyRate * settings.otRateMultiplier);
  const totalSalary = earnedSalary + otPay;
  const netPayment = roundMoney(totalSalary - advanceDeduction);
  const overAdvanced = Math.max(0, roundMoney(advanceDeduction - totalSalary));
  const suggestedPay = Math.max(0, roundMoney(netPayment - alreadyPaid));

  return {
    employeeId: employee?.id ?? null,
    fingerprintName: parsed.fingerprintName,
    employeeName: employee?.fullName ?? parsed.fingerprintName,
    designation: employee?.designation ?? null,
    monthlySalary,
    workingDays,
    eligibleDays,
    earnedSalary,
    otHours,
    otPay,
    totalSalary,
    advanceDeduction,
    netPayment,
    alreadyPaid,
    suggestedPay,
    overAdvanced,
    sundaysExcluded: parsed.sundaysExcluded,
    weekdayAbsents: parsed.weekdayAbsents,
    isMatched: Boolean(employee),
    importRowId,
  };
}

export function matchEmployeeForFingerprintName(
  fingerprintName: string,
  employees: FingerprintEmployeeRecord[],
  aliases: AliasRecord[]
): FingerprintEmployeeRecord | null {
  const alias = aliases.find((row) =>
    fingerprintNamesMatch(row.fingerprint_name, fingerprintName)
  );
  if (alias) {
    return employees.find((emp) => emp.id === alias.employee_id) ?? null;
  }

  return (
    employees.find((emp) => fingerprintNamesMatch(emp.fullName, fingerprintName)) ?? null
  );
}

export function buildFingerprintSalaryReport(args: {
  importRows: ImportRowRecord[];
  employees: FingerprintEmployeeRecord[];
  aliases: AliasRecord[];
  settings: FingerprintPayrollSettings;
  advanceByEmployee: Map<string, number>;
  paidByEmployee: Map<string, number>;
  fileName: string | null;
  uploadedAt: string | null;
  eligibleDays: number;
  otRateMultiplier: number;
}): FingerprintSalaryReport {
  const lines: FingerprintSalaryLine[] = args.importRows.map((row) => {
    const employee = row.employee_id
      ? args.employees.find((emp) => emp.id === row.employee_id) ?? null
      : matchEmployeeForFingerprintName(row.fingerprint_name, args.employees, args.aliases);

    const advanceDeduction = employee
      ? roundMoney(args.advanceByEmployee.get(employee.id) ?? 0)
      : 0;
    const alreadyPaid = employee
      ? roundMoney(args.paidByEmployee.get(employee.id) ?? 0)
      : 0;

    return calculateFingerprintSalaryLine(
      employee,
      {
        fingerprintName: row.fingerprint_name,
        daysWorked: Number(row.days_worked),
        otHours: Number(row.ot_hours),
        sundaysExcluded: row.sundays_excluded,
        weekdayAbsents: row.weekday_absents,
      },
      args.settings,
      advanceDeduction,
      alreadyPaid,
      row.id
    );
  });

  return {
    lines: lines.sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    unmatchedCount: lines.filter((line) => !line.isMatched).length,
    otRateMultiplier: args.otRateMultiplier,
    eligibleDays: args.eligibleDays,
    fileName: args.fileName,
    uploadedAt: args.uploadedAt,
  };
}

export function buildFingerprintExportRows(
  report: FingerprintSalaryReport,
  month: string
): string[][] {
  const headers = [
    "Sr. No.",
    "Name",
    "Designation",
    "Salary",
    "Working Days",
    "OT (hours)",
    "Earned Salary",
    "OT (pay)",
    "Total Salary",
    "Advance",
    "Net Payment",
  ];

  const rows = report.lines.map((line, index) => [
    String(index + 1),
    line.employeeName,
    line.designation ?? "",
    String(line.monthlySalary),
    String(line.workingDays),
    line.otHours.toFixed(2),
    String(line.earnedSalary),
    String(line.otPay),
    String(line.totalSalary),
    String(line.advanceDeduction),
    String(line.netPayment),
  ]);

  return [
    [`Salary Report — ${month}`, `OT @ ${report.otRateMultiplier}×`],
    [`Eligible working days: ${report.eligibleDays}`],
    [],
    headers,
    ...rows,
  ];
}

export function fingerprintExportFilename(month: string, ext: "csv" | "xlsx") {
  return ext === "csv"
    ? `fingerprint-salary-${month}.csv`
    : `fingerprint-salary-${month}.xlsx`;
}