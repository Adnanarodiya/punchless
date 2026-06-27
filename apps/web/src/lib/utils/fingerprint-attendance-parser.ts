import * as XLSX from "xlsx";

export const FINGERPRINT_SHEET_NAME = "rptMonthlyWorkDurationSummary";
const LABEL_COL = 7;
const BLOCK_ROW_LABELS = new Set(["INTIME", "OUTTIME", "DURATION", "OT", "SUMMERY"]);

export type FingerprintDayStatus = {
  day: number;
  status: string;
  isSunday: boolean;
};

export type FingerprintSummary = {
  present: number | null;
  absent: number | null;
  half: number | null;
  late: number | null;
  weekOff: number | null;
  totalHours: string | null;
  otHours: string | null;
};

export type ParsedFingerprintEmployee = {
  fingerprintName: string;
  fingerprintEmpId: string | null;
  dailyStatuses: FingerprintDayStatus[];
  summary: FingerprintSummary;
  daysWorked: number;
  eligibleDays: number;
  sundaysExcluded: number;
  weekdayAbsents: number;
  rawSummaryCells: string[];
};

export type ParsedFingerprintWorkbook = {
  year: number;
  month: number;
  salaryMonth: string;
  eligibleDays: number;
  employees: ParsedFingerprintEmployee[];
  skippedNonameCount: number;
};

type DayColumn = { day: number; headerCol: number; statusCol: number };

function normalizeCell(value: unknown): string {
  return String(value ?? "").trim();
}

function isSunday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 0;
}

function parseMonthYearFromTitle(title: string): { year: number; month: number } | null {
  const match = title.match(
    /(?:report\s+of\s+|summary\s+.*?\s+of\s+)?([A-Za-z]+),?\s*(\d{4})/i
  );
  if (!match) return null;

  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const monthIndex = monthNames.indexOf(match[1].toLowerCase());
  if (monthIndex < 0) return null;

  return { year: Number(match[2]), month: monthIndex + 1 };
}

function findDayColumns(rows: unknown[][]): DayColumn[] {
  for (const row of rows.slice(0, 20)) {
    if (!Array.isArray(row)) continue;

    const dayColumns: DayColumn[] = [];
    for (let col = 0; col < row.length; col++) {
      const value = normalizeCell(row[col]);
      if (!value || Number.isNaN(Number(value))) continue;
      const day = Number(value);
      if (day < 1 || day > 31) continue;
      dayColumns.push({ day, headerCol: col, statusCol: col - 1 });
    }

    if (dayColumns.length >= 28) {
      return dayColumns.sort((a, b) => a.day - b.day);
    }
  }

  return [];
}

function parseDurationHours(value: string | null): number {
  if (!value) return 0;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+):(\d{2})$/);
  if (!match) return 0;
  return Number(match[1]) + Number(match[2]) / 60;
}

function parseSummaryRow(row: unknown[]): FingerprintSummary {
  const cells = row.map(normalizeCell).filter(Boolean);
  const joined = cells.join(" ");

  const readCount = (code: string) => {
    const match = joined.match(new RegExp(`${code}:(\\d+)`, "i"));
    return match ? Number(match[1]) : null;
  };

  const totalHoursMatch = joined.match(/W\s*:?\s*(\d+:\d{2})/i);
  const otHoursMatch = joined.match(/OT:?\s*(\d+:\d{2})/i);

  return {
    present: readCount("P"),
    absent: readCount("A"),
    half: readCount("H"),
    late: readCount("L"),
    weekOff: readCount("WO"),
    totalHours: totalHoursMatch?.[1] ?? null,
    otHours: otHoursMatch?.[1] ?? null,
  };
}

function countDaysWorked(
  dailyStatuses: FingerprintDayStatus[]
): { daysWorked: number; weekdayAbsents: number; sundaysExcluded: number } {
  let daysWorked = 0;
  let weekdayAbsents = 0;
  let sundaysExcluded = 0;

  for (const day of dailyStatuses) {
    const status = day.status.toUpperCase();

    if (day.isSunday) {
      sundaysExcluded += 1;
      continue;
    }

    if (status === "P") {
      daysWorked += 1;
    } else if (status === "HP") {
      daysWorked += 0.5;
    } else if (status === "A" || status === "0:0" || status === "00:00") {
      weekdayAbsents += 1;
    }
  }

  return { daysWorked, weekdayAbsents, sundaysExcluded };
}

function readDailyStatuses(
  statusRow: unknown[],
  dayColumns: DayColumn[],
  year: number,
  month: number
): FingerprintDayStatus[] {
  return dayColumns.map(({ day, statusCol }) => ({
    day,
    status: normalizeCell(statusRow[statusCol]),
    isSunday: isSunday(year, month, day),
  }));
}

function findBlockRows(rows: unknown[][], startRow: number): Record<string, number> {
  const map: Record<string, number> = { name: startRow };
  for (let offset = 1; offset <= 6; offset++) {
    const label = normalizeCell(rows[startRow + offset]?.[LABEL_COL]).toUpperCase();
    if (label) map[label] = startRow + offset;
  }
  return map;
}

function parseEmployeeBlock(
  rows: unknown[][],
  startRow: number,
  dayColumns: DayColumn[],
  year: number,
  month: number
): ParsedFingerprintEmployee | null {
  const name = normalizeCell(rows[startRow]?.[LABEL_COL]);
  if (!name || name.toUpperCase() === "NONAME") return null;

  const blockRows = findBlockRows(rows, startRow);
  const summaryRowIndex = blockRows.SUMMERY;
  if (summaryRowIndex == null) return null;

  const dailyStatuses = readDailyStatuses(rows[startRow], dayColumns, year, month);
  const summary = parseSummaryRow(rows[summaryRowIndex] as unknown[]);
  const counts = countDaysWorked(dailyStatuses);

  const eligibleDays = dayColumns.filter((col) => !isSunday(year, month, col.day)).length;

  let daysWorked = counts.daysWorked;
  if (summary.present != null) {
    const halfCredit = (summary.half ?? 0) * 0.5;
    const summaryWorked = summary.present + halfCredit;
    if (Math.abs(summaryWorked - daysWorked) > 0.01) {
      daysWorked = summaryWorked;
    }
  }

  return {
    fingerprintName: name,
    fingerprintEmpId: normalizeCell(rows[startRow]?.[0]) || null,
    dailyStatuses,
    summary,
    daysWorked,
    eligibleDays,
    sundaysExcluded: counts.sundaysExcluded,
    weekdayAbsents: counts.weekdayAbsents,
    rawSummaryCells: (rows[summaryRowIndex] as unknown[]).map(normalizeCell).filter(Boolean),
  };
}

export function parseFingerprintWorkbook(buffer: ArrayBuffer): ParsedFingerprintWorkbook {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheet =
    workbook.Sheets[FINGERPRINT_SHEET_NAME] ??
    workbook.Sheets[workbook.SheetNames[0] ?? ""];

  if (!sheet) {
    throw new Error("Could not read the attendance spreadsheet.");
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  const titleRow = rows.find((row) =>
    normalizeCell(row[1]).toLowerCase().includes("monthly work duration summary")
  );
  const period = parseMonthYearFromTitle(normalizeCell(titleRow?.[1]));
  if (!period) {
    throw new Error(
      "Could not detect month/year from the file. Use the fingerprint monthly summary export."
    );
  }

  const dayColumns = findDayColumns(rows);
  if (dayColumns.length === 0) {
    throw new Error("Could not find day columns in the attendance sheet.");
  }

  const employees: ParsedFingerprintEmployee[] = [];
  let skippedNonameCount = 0;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const label = normalizeCell(rows[rowIndex]?.[LABEL_COL]);
    if (!label || BLOCK_ROW_LABELS.has(label)) continue;

    if (label.toUpperCase() === "NONAME") {
      skippedNonameCount += 1;
      continue;
    }

    const parsed = parseEmployeeBlock(rows, rowIndex, dayColumns, period.year, period.month);
    if (parsed) employees.push(parsed);
  }

  const eligibleDays = dayColumns.filter(
    (col) => !isSunday(period.year, period.month, col.day)
  ).length;

  const salaryMonth = `${period.year}-${String(period.month).padStart(2, "0")}`;

  return {
    year: period.year,
    month: period.month,
    salaryMonth,
    eligibleDays,
    employees,
    skippedNonameCount,
  };
}

export function normalizeFingerprintName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export function fingerprintNamesMatch(a: string, b: string): boolean {
  return normalizeFingerprintName(a) === normalizeFingerprintName(b);
}

export { parseDurationHours };