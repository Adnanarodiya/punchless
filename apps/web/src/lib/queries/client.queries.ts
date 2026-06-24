import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type LedgerRow = Database["public"]["Tables"]["ledger_entries"]["Row"];

export type ClientWithDue = ClientRow & {
  due_amount: number;
};

export type ClientSummary = {
  totalClients: number;
  totalDue: number;
};

export type StatementLine = {
  id: string;
  entry_date: string;
  remark: string | null;
  reference_type: string | null;
  entry_type: string;
  debit: number;
  credit: number;
  balance: number;
};

function parseLedgerAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumLedgerBalance(entries: Pick<LedgerRow, "entry_type" | "amount">[]) {
  return entries.reduce((balance, entry) => {
    const amount = parseLedgerAmount(entry.amount);
    if (entry.entry_type === "debit") return balance + amount;
    return balance - amount;
  }, 0);
}

function sortLedgerEntries(entries: LedgerRow[]) {
  return [...entries].sort((a, b) => {
    if (a.entry_date !== b.entry_date) {
      return a.entry_date.localeCompare(b.entry_date);
    }
    if (a.entry_type !== b.entry_type) {
      return a.entry_type === "debit" ? -1 : 1;
    }
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

type ClientInvoiceRow = {
  id: string;
  total_amount: number;
  cash_amount: number;
  bank_amount: number;
  credit_amount: number;
};

async function getClientInvoices(clientId: string): Promise<ClientInvoiceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("id, total_amount, cash_amount, bank_amount, credit_amount")
    .eq("client_id", clientId)
    .eq("is_deleted", false);

  return (data as ClientInvoiceRow[]) ?? [];
}

function getFullyPaidInvoiceIds(invoices: ClientInvoiceRow[]): Set<string> {
  return new Set(
    invoices
      .filter((invoice) => {
        const total = parseLedgerAmount(invoice.total_amount);
        const paid =
          parseLedgerAmount(invoice.cash_amount) +
          parseLedgerAmount(invoice.bank_amount);
        const creditDue = parseLedgerAmount(invoice.credit_amount);
        return creditDue <= 0.01 || paid >= total - 0.01;
      })
      .map((invoice) => invoice.id)
  );
}

async function cleanupStaleInvoiceLedgerEntries(
  clientId: string,
  invoices: ClientInvoiceRow[]
) {
  const supabase = await createClient();
  const fullyPaidIds = getFullyPaidInvoiceIds(invoices);

  for (const invoiceId of fullyPaidIds) {
    await supabase
      .from("ledger_entries")
      .delete()
      .eq("entity_type", "client")
      .eq("entity_id", clientId)
      .eq("reference_id", invoiceId)
      .eq("reference_type", "invoice");
  }

  const { data: invoiceRefEntries } = await supabase
    .from("ledger_entries")
    .select("id, entry_type")
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
    .eq("reference_type", "invoice");

  const corruptIds = (invoiceRefEntries ?? [])
    .filter(
      (entry) => entry.entry_type !== "debit" && entry.entry_type !== "credit"
    )
    .map((entry) => entry.id);

  if (corruptIds.length > 0) {
    await supabase.from("ledger_entries").delete().in("id", corruptIds);
  }
}

function shouldHideInvoiceDebit(
  entry: LedgerRow,
  fullyPaidInvoiceIds: Set<string>,
  allEntries: LedgerRow[]
) {
  if (
    entry.reference_type !== "invoice" ||
    entry.entry_type !== "debit" ||
    !entry.reference_id
  ) {
    return false;
  }

  if (fullyPaidInvoiceIds.has(entry.reference_id)) return true;

  const debitAmount = parseLedgerAmount(entry.amount);
  const paidTotal = allEntries
    .filter(
      (row) =>
        row.reference_id === entry.reference_id &&
        row.reference_type === "payment" &&
        row.entry_type === "credit"
    )
    .reduce((sum, row) => sum + parseLedgerAmount(row.amount), 0);

  return paidTotal > 0 && paidTotal >= debitAmount - 0.01;
}

function prepareStatementEntries(
  entries: LedgerRow[],
  fullyPaidInvoiceIds: Set<string>,
  allEntries: LedgerRow[]
): LedgerRow[] {
  const filtered = entries.filter((entry) => {
    const amount = parseLedgerAmount(entry.amount);

    if (amount <= 0) return false;

    if (entry.entry_type !== "debit" && entry.entry_type !== "credit") {
      return false;
    }

    if (shouldHideInvoiceDebit(entry, fullyPaidInvoiceIds, allEntries)) {
      return false;
    }

    return true;
  });

  const standalone: LedgerRow[] = [];
  const paymentGroups = new Map<string, LedgerRow[]>();

  for (const entry of filtered) {
    if (
      entry.reference_type === "payment" &&
      entry.entry_type === "credit" &&
      entry.reference_id
    ) {
      const group = paymentGroups.get(entry.reference_id) ?? [];
      group.push(entry);
      paymentGroups.set(entry.reference_id, group);
      continue;
    }
    standalone.push(entry);
  }

  const mergedPayments: LedgerRow[] = [];

  for (const [, payments] of paymentGroups) {
    if (payments.length === 1) {
      mergedPayments.push(payments[0]);
      continue;
    }

    const sorted = [...payments].sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );
    const totalAmount = sorted.reduce(
      (sum, entry) => sum + parseLedgerAmount(entry.amount),
      0
    );
    const modes = [
      ...new Set(sorted.map((entry) => entry.payment_mode).filter(Boolean)),
    ];
    const baseRemark =
      sorted[0].remark?.replace(/ — (cash|bank)$/i, "") ??
      "Payment received";

    mergedPayments.push({
      ...sorted[0],
      amount: totalAmount,
      remark: `${baseRemark} — paid (${modes.join(" + ")})`,
    });
  }

  return sortLedgerEntries([...standalone, ...mergedPayments]);
}

async function getLedgerBalancesByClient(
  clientIds: string[]
): Promise<Record<string, number>> {
  if (clientIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_entries")
    .select("entity_id, entry_type, amount")
    .eq("entity_type", "client")
    .in("entity_id", clientIds);

  const balances: Record<string, number> = {};
  for (const id of clientIds) balances[id] = 0;

  for (const entry of data ?? []) {
    const id = entry.entity_id as string;
    const amount = parseLedgerAmount(entry.amount);
    if (entry.entry_type === "debit") {
      balances[id] = Math.round(((balances[id] ?? 0) + amount) * 100) / 100;
    } else {
      balances[id] = Math.round(((balances[id] ?? 0) - amount) * 100) / 100;
    }
  }

  return balances;
}

export async function getActiveClients(): Promise<ClientWithDue[]> {
  return getClients({ includeDeleted: false });
}

export async function getClients(
  options: { includeDeleted?: boolean } = {}
): Promise<ClientWithDue[]> {
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (!options.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data } = await query;
  const clients = (data as ClientRow[]) ?? [];
  const balances = await getLedgerBalancesByClient(clients.map((c) => c.id));

  return clients.map((client) => ({
    ...client,
    due_amount: balances[client.id] ?? 0,
  }));
}

export async function getClientById(
  clientId: string
): Promise<ClientWithDue | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (!data) return null;

  const client = data as ClientRow;
  const balances = await getLedgerBalancesByClient([client.id]);

  return {
    ...client,
    due_amount: balances[client.id] ?? 0,
  };
}

export async function getClientsSummary(): Promise<ClientSummary> {
  const clients = await getClients();
  return {
    totalClients: clients.length,
    totalDue: clients.reduce((sum, client) => sum + client.due_amount, 0),
  };
}

export async function getClientStatement(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<{
  openingBalance: number;
  closingBalance: number;
  lines: StatementLine[];
}> {
  const supabase = await createClient();

  const { data: allEntries } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const entries = (allEntries as LedgerRow[]) ?? [];
  const invoices = await getClientInvoices(clientId);
  await cleanupStaleInvoiceLedgerEntries(clientId, invoices);

  const { data: refreshedEntries } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const ledgerRows = (refreshedEntries as LedgerRow[]) ?? entries;
  const fullyPaidInvoiceIds = getFullyPaidInvoiceIds(invoices);

  const beforePeriod = prepareStatementEntries(
    ledgerRows.filter((entry) => entry.entry_date < startDate),
    fullyPaidInvoiceIds,
    ledgerRows
  );
  const inPeriod = prepareStatementEntries(
    ledgerRows.filter(
      (entry) => entry.entry_date >= startDate && entry.entry_date <= endDate
    ),
    fullyPaidInvoiceIds,
    ledgerRows
  );

  const openingBalance = sumLedgerBalance(beforePeriod);
  let runningBalance = openingBalance;

  const lines: StatementLine[] = inPeriod
    .map((entry) => {
      const debit =
        entry.entry_type === "debit" ? parseLedgerAmount(entry.amount) : 0;
      const credit =
        entry.entry_type === "credit" ? parseLedgerAmount(entry.amount) : 0;
      runningBalance = Math.round((runningBalance + debit - credit) * 100) / 100;

      return {
        id: entry.id,
        entry_date: entry.entry_date,
        remark: entry.remark,
        reference_type: entry.reference_type,
        entry_type: entry.entry_type,
        debit,
        credit,
        balance: runningBalance,
      };
    })
    .filter((line) => line.debit > 0 || line.credit > 0);

  return {
    openingBalance,
    closingBalance: runningBalance,
    lines,
  };
}