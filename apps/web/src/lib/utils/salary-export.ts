import type { SalaryReport } from "@/lib/queries/salary.queries";
import type { SalaryMode } from "@/lib/utils/salary-calculation";

export function buildSalaryExportRows(
  reports: SalaryReport[],
  salaryMode: SalaryMode,
  month: string
): string[][] {
  const modeLabel = salaryMode === "fixed" ? "Fixed monthly" : "Hourly";

  if (salaryMode === "fixed") {
    const headers = [
      "Employee",
      "Full Days",
      "Half Days",
      "Absent Days",
      "Gross Salary",
      "Advance Deduction",
      "Net Salary",
      "Already Paid",
      "Due to Pay",
      "Over Advanced",
    ];
    const rows = reports.map((r) => [
      r.employee_name,
      String(r.full_days),
      String(r.half_days),
      String(r.absent_days),
      String(r.gross_salary),
      String(r.advance_deduction),
      String(r.net_salary),
      String(r.already_paid),
      String(r.suggested_pay),
      String(r.over_advanced),
    ]);
    return [
      [`Salary Report — ${month}`, modeLabel],
      [],
      headers,
      ...rows,
    ];
  }

  const headers = [
    "Employee",
    "Hourly Rate",
    "Total Hours",
    "Adjusted Hours",
    "Gross Salary",
    "Advance Deduction",
    "Net Salary",
    "Already Paid",
    "Due to Pay",
    "Over Advanced",
  ];
  const rows = reports.map((r) => [
    r.employee_name,
    String(r.hourly_rate),
    r.total_hours.toFixed(2),
    r.adjusted_hours.toFixed(2),
    String(r.gross_salary),
    String(r.advance_deduction),
    String(r.net_salary),
    String(r.already_paid),
    String(r.suggested_pay),
    String(r.over_advanced),
  ]);

  return [
    [`Salary Report — ${month}`, modeLabel],
    [],
    headers,
    ...rows,
  ];
}

export function salaryExportFilename(month: string, ext: "csv" | "xlsx") {
  const base = `salary-report-${month}`;
  return ext === "csv" ? `${base}.csv` : `${base}.xlsx`;
}