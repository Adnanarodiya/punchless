import {
  getDailyBookReport,
  getMonthlyBookReport,
  type DailyBookLine,
} from "@/lib/queries/daily-book.queries";

export type BookLine = DailyBookLine;

export type BookReport = {
  periodStart: string;
  periodEnd: string;
  lines: BookLine[];
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
  totalPurchase: number;
  balance: number;
  totalReceipts: number;
  totalPayments: number;
  netChange: number;
};

export type CashBookReport = BookReport;
export type BankBookReport = BookReport;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function lineAmount(line: DailyBookLine) {
  if (line.income > 0) return line.income;
  if (line.expense > 0) return line.expense;
  if (line.purchase > 0) return line.purchase;
  return line.transfer || 0;
}

function classifyMovement(line: DailyBookLine): "receipt" | "payment" | "neutral" {
  if (line.income > 0 && line.expense === 0) return "receipt";
  if (line.expense > 0 && line.income === 0) return "payment";
  if (line.purchase > 0) return "payment";
  if (line.category.toLowerCase().includes("bill")) return "receipt";
  return "neutral";
}

function summarizeLines(lines: BookLine[]) {
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfer = 0;
  let totalPurchase = 0;
  let totalReceipts = 0;
  let totalPayments = 0;

  for (const line of lines) {
    totalIncome += line.income;
    totalExpense += line.expense;
    totalTransfer += line.transfer;
    totalPurchase += line.purchase;

    const amt = lineAmount(line);
    const kind = classifyMovement(line);
    if (kind === "receipt") totalReceipts += amt;
    else if (kind === "payment") totalPayments += amt;
  }

  return {
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    totalTransfer: round2(totalTransfer),
    totalPurchase: round2(totalPurchase),
    balance: round2(totalIncome - totalExpense),
    totalReceipts: round2(totalReceipts),
    totalPayments: round2(totalPayments),
    netChange: round2(totalReceipts - totalPayments),
  };
}

function normalizeRange(startDate: string, endDate: string) {
  const start = startDate.trim();
  const end = endDate.trim() || start;
  if (end < start) {
    return { start: end, end: start };
  }
  return { start, end };
}

async function getBookReportForRange(
  startDate: string,
  endDate: string,
  mode: "cash" | "bank"
): Promise<BookReport> {
  const { start, end } = normalizeRange(startDate, endDate);
  const report =
    start === end
      ? await getDailyBookReport(start)
      : await getMonthlyBookReport(start, end);

  const lines = report.lines.filter((line) => line.mode === mode);
  const totals = summarizeLines(lines);

  return {
    periodStart: start,
    periodEnd: end,
    lines,
    ...totals,
  };
}

export async function getCashBookReportForRange(
  startDate: string,
  endDate: string
): Promise<CashBookReport> {
  return getBookReportForRange(startDate, endDate, "cash");
}

export async function getBankBookReportForRange(
  startDate: string,
  endDate: string
): Promise<BankBookReport> {
  return getBookReportForRange(startDate, endDate, "bank");
}

export async function getCashBookReport(date: string): Promise<CashBookReport> {
  return getCashBookReportForRange(date, date);
}

export async function getBankBookReport(date: string): Promise<BankBookReport> {
  return getBankBookReportForRange(date, date);
}

export async function getTodaysBookSummary(date: string) {
  const [cash, bank, full] = await Promise.all([
    getCashBookReport(date),
    getBankBookReport(date),
    getDailyBookReport(date),
  ]);

  return {
    date,
    cash,
    bank,
    allLines: full.lines,
    entryCount: full.lines.length,
    summary: full.summary,
  };
}