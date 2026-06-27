import { createClient } from "@/lib/supabase/server";
import {
  getFinancialYearRangeToDate,
  getFinancialYearStartYearForDate,
} from "@/lib/utils/financial-year";
import type { AttendanceWithDetails } from "./attendance.queries";
import type { JobWithDetails } from "./job.queries";
import { getBanksSummary } from "./bank.queries";
import { getClientsSummary, getActiveClients } from "./client.queries";
import { getSuppliers, getSuppliersSummary } from "./supplier.queries";

export type DashboardStats = {
  employeeCount: number;
  activeSessionCount: number;
  activeJobCount: number;
  pendingAdvanceCount: number;
};

export type FinancialSummary = {
  periodLabel: string;
  income: number;
  expense: number;
  cashNet: number;
  bankBalance: number;
  clientCredit: number;
  supplierPayable: number;
};

export type TodayPaymentRow = {
  id: string;
  label: string;
  amount: number;
  direction: "in" | "out";
  paymentMode: string;
  source: string;
};

export type PendingDueRow = {
  id: string;
  name: string;
  amount: number;
  type: "client" | "supplier";
};

export type RevenueChartPoint = {
  date: string;
  label: string;
  income: number;
  expense: number;
};

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: now.toISOString().slice(0, 10),
    label: start.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
  };
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [
    { count: employeeCount },
    { count: activeSessionCount },
    { count: activeJobCount },
    { count: pendingAdvanceCount },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .eq("role", "employee"),
    supabase
      .from("attendance_sessions")
      .select("*", { count: "exact", head: true })
      .is("end_time", null),
    supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .in("status", ["pending", "assigned", "in_progress"]),
    supabase
      .from("salary_advances")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return {
    employeeCount: employeeCount ?? 0,
    activeSessionCount: activeSessionCount ?? 0,
    activeJobCount: activeJobCount ?? 0,
    pendingAdvanceCount: pendingAdvanceCount ?? 0,
  };
}

export async function getRecentAttendance(
  limit = 10
): Promise<AttendanceWithDetails[]> {
  const supabase = await createClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  weekAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("attendance_sessions")
    .select("*, users(full_name, email), workshops(name), jobs(title)")
    .gte("start_time", weekAgo.toISOString())
    .order("start_time", { ascending: false })
    .limit(limit);

  type RawRow = AttendanceWithDetails & {
    users: { full_name: string; email: string } | null;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((row) => ({
    ...row,
    employee_name: row.users?.full_name ?? row.employee_name ?? "Unknown",
    employee_email: row.users?.email ?? row.employee_email ?? "",
    workshop_name: row.workshops?.name ?? row.workshop_name ?? null,
    job_title: row.jobs?.title ?? row.job_title ?? null,
  }));
}

export async function getRecentJobs(limit = 10): Promise<JobWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("jobs")
    .select("*, users(full_name, email)")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  type RawRow = JobWithDetails & {
    users: { full_name: string; email: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((job) => ({
    ...job,
    assigned_to_name: job.users?.full_name ?? job.assigned_to_name ?? null,
    assigned_to_email: job.users?.email ?? job.assigned_to_email ?? null,
  }));
}

/** FY start years that have income/expense transaction data, newest first. */
export async function getFinancialYearsWithData(): Promise<number[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transactions")
    .select("transaction_date");

  const years = new Set<number>();
  for (const row of data ?? []) {
    if (row.transaction_date) {
      years.add(getFinancialYearStartYearForDate(row.transaction_date));
    }
  }

  return Array.from(years).sort((a, b) => b - a);
}

export async function getFinancialSummary(
  fyStartYear?: number
): Promise<FinancialSummary> {
  const supabase = await createClient();
  const { start, end, label } = fyStartYear
    ? getFinancialYearRangeToDate(fyStartYear)
    : currentMonthRange();

  const [
    { data: monthTransactions },
    banksSummary,
    clientsSummary,
    suppliersSummary,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, transaction_type, payment_mode")
      .gte("transaction_date", start)
      .lte("transaction_date", end),
    getBanksSummary(),
    getClientsSummary(),
    getSuppliersSummary(),
  ]);

  let income = 0;
  let expense = 0;
  let cashIncome = 0;
  let cashExpense = 0;

  for (const row of monthTransactions ?? []) {
    const amount = parseAmount(row.amount);
    if (row.transaction_type === "income") {
      income += amount;
      if (row.payment_mode === "cash") cashIncome += amount;
    } else {
      expense += amount;
      if (row.payment_mode === "cash") cashExpense += amount;
    }
  }

  return {
    periodLabel: label,
    income: Math.round(income * 100) / 100,
    expense: Math.round(expense * 100) / 100,
    cashNet: Math.round((cashIncome - cashExpense) * 100) / 100,
    bankBalance: banksSummary.totalBalance,
    clientCredit: clientsSummary.totalDue,
    supplierPayable: suppliersSummary.totalPayable,
  };
}

export async function getTodaysPayments(): Promise<TodayPaymentRow[]> {
  const supabase = await createClient();
  const today = todayDate();
  const rows: TodayPaymentRow[] = [];

  const [
    { data: clientPayments },
    { data: supplierPayments },
    { data: bankTx },
    { data: incomeExpense },
  ] = await Promise.all([
    supabase
      .from("client_payments")
      .select("id, amount, payment_mode, remark, clients(name)")
      .eq("payment_date", today),
    supabase
      .from("supplier_payments")
      .select("id, amount, payment_mode, remark, suppliers(name)")
      .eq("payment_date", today),
    supabase
      .from("bank_transactions")
      .select("id, amount, transaction_type, remark, bank_accounts(bank_name)")
      .eq("transaction_date", today),
    supabase
      .from("transactions")
      .select("id, amount, transaction_type, payment_mode, particular")
      .eq("transaction_date", today),
  ]);

  for (const payment of clientPayments ?? []) {
    const client = payment.clients as { name: string } | null;
    rows.push({
      id: payment.id,
      label: client?.name ?? "Customer payment",
      amount: parseAmount(payment.amount),
      direction: "in",
      paymentMode: payment.payment_mode,
      source: "Customer",
    });
  }

  for (const payment of supplierPayments ?? []) {
    const supplier = payment.suppliers as { name: string } | null;
    rows.push({
      id: payment.id,
      label: supplier?.name ?? "Supplier payment",
      amount: parseAmount(payment.amount),
      direction: "out",
      paymentMode: payment.payment_mode,
      source: "Supplier",
    });
  }

  for (const tx of bankTx ?? []) {
    const bank = tx.bank_accounts as { bank_name: string } | null;
    rows.push({
      id: tx.id,
      label: bank?.bank_name ?? "Bank",
      amount: parseAmount(tx.amount),
      direction: tx.transaction_type === "deposit" ? "in" : "out",
      paymentMode: "bank",
      source: `Bank ${tx.transaction_type}`,
    });
  }

  for (const tx of incomeExpense ?? []) {
    rows.push({
      id: tx.id,
      label: tx.particular,
      amount: parseAmount(tx.amount),
      direction: tx.transaction_type === "income" ? "in" : "out",
      paymentMode: tx.payment_mode,
      source: tx.transaction_type === "income" ? "Income" : "Expense",
    });
  }

  return rows.sort((a, b) => b.amount - a.amount);
}

export async function getTopPendingDues(
  limit = 5
): Promise<PendingDueRow[]> {
  const [clients, suppliers] = await Promise.all([
    getActiveClients(),
    getSuppliers(),
  ]);

  const clientRows: PendingDueRow[] = clients
    .filter((c) => c.due_amount > 0.01)
    .map((c) => ({
      id: c.id,
      name: c.name,
      amount: c.due_amount,
      type: "client" as const,
    }));

  const supplierRows: PendingDueRow[] = suppliers
    .filter((s) => !s.is_deleted && s.payable_amount > 0.01)
    .map((s) => ({
      id: s.id,
      name: s.name,
      amount: s.payable_amount,
      type: "supplier" as const,
    }));

  return [...clientRows, ...supplierRows]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export async function getRevenueChart(
  days = 7
): Promise<RevenueChartPoint[]> {
  const supabase = await createClient();
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("transactions")
    .select("amount, transaction_type, transaction_date")
    .gte("transaction_date", startStr)
    .lte("transaction_date", endStr);

  const byDate: Record<string, { income: number; expense: number }> = {};

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate[key] = { income: 0, expense: 0 };
  }

  for (const row of data ?? []) {
    const key = row.transaction_date;
    if (!byDate[key]) continue;
    const amount = parseAmount(row.amount);
    if (row.transaction_type === "income") {
      byDate[key].income += amount;
    } else {
      byDate[key].expense += amount;
    }
  }

  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
    date,
    label: new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    }),
    income: Math.round(values.income * 100) / 100,
    expense: Math.round(values.expense * 100) / 100,
  }));
}

export async function getRevenueChartByMonth(
  months = 6
): Promise<RevenueChartPoint[]> {
  const supabase = await createClient();
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);

  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("transactions")
    .select("amount, transaction_type, transaction_date")
    .gte("transaction_date", startStr)
    .lte("transaction_date", endStr);

  const byMonth: Record<string, { income: number; expense: number }> = {};

  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = d.toISOString().slice(0, 7);
    byMonth[key] = { income: 0, expense: 0 };
  }

  for (const row of data ?? []) {
    const key = row.transaction_date.slice(0, 7);
    if (!byMonth[key]) continue;
    const amount = parseAmount(row.amount);
    if (row.transaction_type === "income") {
      byMonth[key].income += amount;
    } else {
      byMonth[key].expense += amount;
    }
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      date: `${month}-01`,
      label: new Date(`${month}-01`).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      }),
      income: Math.round(values.income * 100) / 100,
      expense: Math.round(values.expense * 100) / 100,
    }));
}