import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export type TransactionWithDetails = TransactionRow & {
  bank_name: string | null;
  created_by_name: string | null;
};

export type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
};

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getTransactions(): Promise<TransactionWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transactions")
    .select("*, bank_accounts(bank_name), users(full_name)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  type RawRow = TransactionRow & {
    bank_accounts: { bank_name: string } | null;
    users: { full_name: string } | null;
  };

  return ((data as unknown as RawRow[]) ?? []).map((row) => ({
    ...row,
    bank_name: row.bank_accounts?.bank_name ?? null,
    created_by_name: row.users?.full_name ?? null,
  }));
}

export async function getTransactionsSummary(): Promise<TransactionSummary> {
  const transactions = await getTransactions();

  const totalIncome = transactions
    .filter((row) => row.transaction_type === "income")
    .reduce((sum, row) => sum + parseAmount(row.amount), 0);

  const totalExpense = transactions
    .filter((row) => row.transaction_type === "expense")
    .reduce((sum, row) => sum + parseAmount(row.amount), 0);

  return {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
  };
}