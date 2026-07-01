import { createClient } from "@/lib/supabase/server";
import {
  fetchAllLedgerEntries,
  fetchAllLedgerRowsForEntity,
} from "@/lib/utils/ledger-pagination";
import type { Database } from "@punchless/types/database.types";

type BankRow = Database["public"]["Tables"]["bank_accounts"]["Row"];
type LedgerRow = Database["public"]["Tables"]["ledger_entries"]["Row"];
type BankTransactionRow =
  Database["public"]["Tables"]["bank_transactions"]["Row"];
type BankTransferRow = Database["public"]["Tables"]["bank_transfers"]["Row"];

export type BankWithBalance = BankRow & {
  current_balance: number;
};

export type BankSummary = {
  totalBanks: number;
  totalBalance: number;
};

export type BankStatementLine = {
  id: string;
  entry_date: string;
  remark: string | null;
  reference_type: string | null;
  entry_type: string;
  deposit: number;
  withdraw: number;
  balance: number;
};

export type BankTransactionWithDetails = BankTransactionRow & {
  bank_name: string;
  created_by_name: string | null;
};

export type BankTransferWithDetails = BankTransferRow & {
  from_bank_name: string;
  to_bank_name: string;
  created_by_name: string | null;
};

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumBankBalance(entries: Pick<LedgerRow, "entry_type" | "amount">[]) {
  return entries.reduce((balance, entry) => {
    const amount = parseAmount(entry.amount);
    if (entry.entry_type === "credit") return balance + amount;
    return balance - amount;
  }, 0);
}

async function getLedgerBalancesByBank(
  bankIds: string[]
): Promise<Record<string, number>> {
  if (bankIds.length === 0) return {};

  const supabase = await createClient();
  const data = await fetchAllLedgerEntries(supabase, "bank", bankIds);

  const balances: Record<string, number> = {};
  for (const id of bankIds) balances[id] = 0;

  for (const entry of data) {
    const id = entry.entity_id as string;
    const amount = parseAmount(entry.amount);
    if (entry.entry_type === "credit") {
      balances[id] = Math.round(((balances[id] ?? 0) + amount) * 100) / 100;
    } else {
      balances[id] = Math.round(((balances[id] ?? 0) - amount) * 100) / 100;
    }
  }

  return balances;
}

export async function getBanks(
  options: { includeDeleted?: boolean } = {}
): Promise<BankWithBalance[]> {
  const supabase = await createClient();

  let query = supabase
    .from("bank_accounts")
    .select("*")
    .order("bank_name", { ascending: true });

  if (!options.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data } = await query;
  const banks = (data as BankRow[]) ?? [];
  const balances = await getLedgerBalancesByBank(banks.map((bank) => bank.id));

  return banks.map((bank) => ({
    ...bank,
    current_balance: balances[bank.id] ?? 0,
  }));
}

export async function getBankById(
  bankId: string
): Promise<BankWithBalance | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", bankId)
    .single();

  if (!data) return null;

  const bank = data as BankRow;
  const balances = await getLedgerBalancesByBank([bank.id]);

  return {
    ...bank,
    current_balance: balances[bank.id] ?? 0,
  };
}

export async function getBanksSummary(): Promise<BankSummary> {
  const banks = await getBanks();
  return {
    totalBanks: banks.length,
    totalBalance: banks.reduce((sum, bank) => sum + bank.current_balance, 0),
  };
}

export async function getBankStatement(
  bankId: string,
  startDate: string,
  endDate: string
): Promise<{
  openingBalance: number;
  closingBalance: number;
  lines: BankStatementLine[];
}> {
  const supabase = await createClient();

  const entries = (await fetchAllLedgerRowsForEntity(
    supabase,
    "bank",
    bankId
  )) as LedgerRow[];
  const beforePeriod = entries.filter((entry) => entry.entry_date < startDate);
  const inPeriod = entries.filter(
    (entry) =>
      entry.entry_date >= startDate && entry.entry_date <= endDate
  );

  const openingBalance = sumBankBalance(beforePeriod);
  let runningBalance = openingBalance;

  const lines: BankStatementLine[] = inPeriod.map((entry) => {
    const deposit =
      entry.entry_type === "credit" ? parseAmount(entry.amount) : 0;
    const withdraw =
      entry.entry_type === "debit" ? parseAmount(entry.amount) : 0;
    runningBalance = Math.round((runningBalance + deposit - withdraw) * 100) / 100;

    return {
      id: entry.id,
      entry_date: entry.entry_date,
      remark: entry.remark,
      reference_type: entry.reference_type,
      entry_type: entry.entry_type,
      deposit,
      withdraw,
      balance: runningBalance,
    };
  });

  return {
    openingBalance,
    closingBalance: runningBalance,
    lines: [...lines].reverse(),
  };
}

export async function getBankTransactions(): Promise<BankTransactionWithDetails[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bank_transactions")
    .select("*, bank_accounts(bank_name), users(full_name)")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  type RawRow = BankTransactionRow & {
    bank_accounts: { bank_name: string } | null;
    users: { full_name: string } | null;
  };

  return ((data as unknown as RawRow[]) ?? []).map((row) => ({
    ...row,
    bank_name: row.bank_accounts?.bank_name ?? "—",
    created_by_name: row.users?.full_name ?? null,
  }));
}

export async function getBankTransfers(): Promise<BankTransferWithDetails[]> {
  const supabase = await createClient();

  const [{ data }, banks] = await Promise.all([
    supabase
      .from("bank_transfers")
      .select("*, users(full_name)")
      .order("transfer_date", { ascending: false })
      .order("created_at", { ascending: false }),
    getBanks({ includeDeleted: true }),
  ]);

  const bankNames = Object.fromEntries(
    banks.map((bank) => [bank.id, bank.bank_name])
  );

  type RawRow = BankTransferRow & {
    users: { full_name: string } | null;
  };

  return ((data as unknown as RawRow[]) ?? []).map((row) => ({
    ...row,
    from_bank_name: bankNames[row.from_bank_id] ?? "—",
    to_bank_name: bankNames[row.to_bank_id] ?? "—",
    created_by_name: row.users?.full_name ?? null,
  }));
}