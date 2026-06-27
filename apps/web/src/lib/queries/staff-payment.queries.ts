import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";
import type { StaffPaymentSlipSnapshot } from "@/lib/types/staff-payment-slip";
import { normalizeSlipSnapshot } from "@/lib/utils/staff-payment-slip";

type StaffPaymentRow = Database["public"]["Tables"]["staff_payments"]["Row"];
type SalaryDepositRow = Database["public"]["Tables"]["salary_deposits"]["Row"];

export type StaffPaymentWithDetails = StaffPaymentRow & {
  employee_name: string;
  bank_name: string | null;
  created_by_name: string | null;
  salary_month: string | null;
  slip_snapshot: StaffPaymentSlipSnapshot | null;
};

export type SalaryDepositWithDetails = SalaryDepositRow & {
  employee_name: string;
  created_by_name: string | null;
};

export type StaffStatementLine = {
  id: string;
  entry_date: string;
  remark: string | null;
  reference_type: string | null;
  reference_id: string | null;
  entry_type: string;
  debit: number;
  credit: number;
  balance: number;
};

export type EmployeeSalarySlipRecord = {
  paymentId: string;
  paymentDate: string;
  amount: number;
  snapshot: StaffPaymentSlipSnapshot;
};

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getStaffPayments(): Promise<StaffPaymentWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("staff_payments")
    .select(
      "*, users!staff_payments_employee_id_fkey(full_name), bank_accounts(bank_name), creator:users!staff_payments_created_by_fkey(full_name)"
    )
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  type RawRow = StaffPaymentRow & {
    users: { full_name: string } | null;
    bank_accounts: { bank_name: string } | null;
    creator: { full_name: string } | null;
  };

  return ((data as unknown as RawRow[]) ?? []).map((row) => ({
    ...row,
    employee_name: row.users?.full_name ?? "Unknown",
    bank_name: row.bank_accounts?.bank_name ?? null,
    created_by_name: row.creator?.full_name ?? null,
    salary_month: (row as StaffPaymentRow & { salary_month?: string | null }).salary_month ?? null,
    slip_snapshot: parseSlipSnapshot(
      (row as StaffPaymentRow & { slip_snapshot?: unknown }).slip_snapshot
    ),
  }));
}

function parseSlipSnapshot(value: unknown): StaffPaymentSlipSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const snap = value as StaffPaymentSlipSnapshot;
  if (!snap.employeeName || !snap.salaryMonth) return null;
  return normalizeSlipSnapshot(snap);
}

function monthsInDateRange(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (cursor <= endMonth) {
    months.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`
    );
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export async function getEmployeeSalarySlips(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<EmployeeSalarySlipRecord[]> {
  const supabase = await createClient();
  const salaryMonths = monthsInDateRange(startDate, endDate);

  const [{ data: byPaymentDate }, { data: bySalaryMonth }] = await Promise.all([
    supabase
      .from("staff_payments")
      .select("id, amount, payment_date, slip_snapshot, payment_type, salary_month")
      .eq("employee_id", employeeId)
      .eq("payment_type", "salary_paid")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate)
      .not("slip_snapshot", "is", null),
    salaryMonths.length > 0
      ? supabase
          .from("staff_payments")
          .select("id, amount, payment_date, slip_snapshot, payment_type, salary_month")
          .eq("employee_id", employeeId)
          .eq("payment_type", "salary_paid")
          .in("salary_month", salaryMonths)
          .not("slip_snapshot", "is", null)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const seen = new Set<string>();
  const records: EmployeeSalarySlipRecord[] = [];

  for (const row of [...(byPaymentDate ?? []), ...(bySalaryMonth ?? [])]) {
    const id = (row as { id: string }).id;
    if (seen.has(id)) continue;
    seen.add(id);

    const snap = parseSlipSnapshot(
      (row as { slip_snapshot?: unknown }).slip_snapshot
    );
    if (!snap) continue;

    records.push({
      paymentId: id,
      paymentDate: (row as { payment_date: string }).payment_date,
      amount: parseAmount((row as { amount: unknown }).amount),
      snapshot: snap,
    });
  }

  records.sort((a, b) => {
    const monthCmp = a.snapshot.salaryMonth.localeCompare(b.snapshot.salaryMonth);
    if (monthCmp !== 0) return monthCmp;
    return a.paymentDate.localeCompare(b.paymentDate);
  });

  return records;
}

export async function getStaffPaymentById(
  paymentId: string
): Promise<StaffPaymentWithDetails | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("staff_payments")
    .select(
      "*, users!staff_payments_employee_id_fkey(full_name), bank_accounts(bank_name), creator:users!staff_payments_created_by_fkey(full_name)"
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (!data) return null;

  type RawRow = StaffPaymentRow & {
    users: { full_name: string } | null;
    bank_accounts: { bank_name: string } | null;
    creator: { full_name: string } | null;
    salary_month?: string | null;
    slip_snapshot?: unknown;
  };

  const row = data as unknown as RawRow;
  return {
    ...row,
    employee_name: row.users?.full_name ?? "Unknown",
    bank_name: row.bank_accounts?.bank_name ?? null,
    created_by_name: row.creator?.full_name ?? null,
    salary_month: row.salary_month ?? null,
    slip_snapshot: parseSlipSnapshot(row.slip_snapshot),
  };
}

export async function getSalaryDeposits(): Promise<SalaryDepositWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("salary_deposits")
    .select(
      "*, users!salary_deposits_employee_id_fkey(full_name), creator:users!salary_deposits_created_by_fkey(full_name)"
    )
    .order("deposit_date", { ascending: false })
    .order("created_at", { ascending: false });

  type RawRow = SalaryDepositRow & {
    users: { full_name: string } | null;
    creator: { full_name: string } | null;
  };

  return ((data as unknown as RawRow[]) ?? []).map((row) => ({
    ...row,
    employee_name: row.users?.full_name ?? "Unknown",
    created_by_name: row.creator?.full_name ?? null,
  }));
}

async function getLedgerBalanceBeforeDate(
  employeeId: string,
  beforeDate: string
): Promise<number> {
  const supabase = await createClient();

  const { data: ledgerRows } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount")
    .eq("entity_type", "staff")
    .eq("entity_id", employeeId)
    .lt("entry_date", beforeDate);

  let balance = 0;
  for (const entry of ledgerRows ?? []) {
    const amount = parseAmount(entry.amount);
    if (entry.entry_type === "credit") balance += amount;
    else balance -= amount;
  }

  const { data: advances } = await supabase
    .from("salary_advances")
    .select("amount, approved_at")
    .eq("employee_id", employeeId)
    .eq("status", "approved");

  for (const advance of advances ?? []) {
    if (!advance.approved_at) continue;
    const approvedDate = advance.approved_at.slice(0, 10);
    if (approvedDate < beforeDate) {
      balance -= parseAmount(advance.amount);
    }
  }

  return Math.round(balance * 100) / 100;
}

export async function getEmployeeSalaryBalance(
  employeeId: string
): Promise<number> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getLedgerBalanceBeforeDate(employeeId, tomorrow.toISOString().slice(0, 10));
}

export async function getEmployeeStatement(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<{
  openingBalance: number;
  closingBalance: number;
  lines: StaffStatementLine[];
}> {
  const supabase = await createClient();
  const openingBalance = await getLedgerBalanceBeforeDate(employeeId, startDate);

  const { data: ledgerRows } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("entity_type", "staff")
    .eq("entity_id", employeeId)
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: advances } = await supabase
    .from("salary_advances")
    .select("id, amount, reason, approved_at, status")
    .eq("employee_id", employeeId)
    .eq("status", "approved")
    .gte("approved_at", `${startDate}T00:00:00`)
    .lte("approved_at", `${endDate}T23:59:59`);

  type LedgerEntry = Database["public"]["Tables"]["ledger_entries"]["Row"];

  const combined: Array<{
    id: string;
    entry_date: string;
    remark: string | null;
    reference_type: string | null;
    reference_id: string | null;
    entry_type: string;
    debit: number;
    credit: number;
    created_at: string | null;
  }> = [];

  for (const row of (ledgerRows as LedgerEntry[]) ?? []) {
    const amount = parseAmount(row.amount);
    combined.push({
      id: row.id,
      entry_date: row.entry_date,
      remark: row.remark,
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      entry_type: row.entry_type,
      debit: row.entry_type === "debit" ? amount : 0,
      credit: row.entry_type === "credit" ? amount : 0,
      created_at: row.created_at,
    });
  }

  for (const advance of advances ?? []) {
    if (!advance.approved_at) continue;
    const amount = parseAmount(advance.amount);
    combined.push({
      id: `advance-${advance.id}`,
      entry_date: advance.approved_at.slice(0, 10),
      remark: advance.reason || "Salary advance (approved)",
      reference_type: "advance",
      reference_id: advance.id,
      entry_type: "debit",
      debit: amount,
      credit: 0,
      created_at: advance.approved_at,
    });
  }

  combined.sort((a, b) => {
    if (a.entry_date !== b.entry_date) {
      return a.entry_date.localeCompare(b.entry_date);
    }
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });

  let running = openingBalance;
  const lines: StaffStatementLine[] = combined.map((entry) => {
    running = Math.round((running + entry.credit - entry.debit) * 100) / 100;
    return {
      id: entry.id,
      entry_date: entry.entry_date,
      remark: entry.remark,
      reference_type: entry.reference_type,
      reference_id: entry.reference_id,
      entry_type: entry.entry_type,
      debit: entry.debit,
      credit: entry.credit,
      balance: running,
    };
  });

  return {
    openingBalance,
    closingBalance: running,
    lines,
  };
}