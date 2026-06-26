import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";
import {
  getBalanceMeta,
  resolveStatementSource,
  type StatementResult,
} from "@/lib/utils/statement";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type LedgerRow = Database["public"]["Tables"]["ledger_entries"]["Row"];

export type ClientWithDue = ClientRow & {
  due_amount: number;
};

export type ClientSummary = {
  totalClients: number;
  totalDue: number;
};

function parseLedgerAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

type PreparedStatementEntry = {
  id: string;
  entry_date: string;
  remark: string | null;
  reference_type: string | null;
  reference_id: string | null;
  entry_type: string;
  debit: number;
  credit: number;
  created_at: string | null;
  created_by: string | null;
};

function sumPreparedBalance(entries: Pick<PreparedStatementEntry, "debit" | "credit">[]) {
  return entries.reduce(
    (balance, entry) =>
      Math.round((balance + entry.debit - entry.credit) * 100) / 100,
    0
  );
}

function sortPreparedEntries(entries: PreparedStatementEntry[]) {
  return [...entries].sort((a, b) => {
    if (a.entry_date !== b.entry_date) {
      return a.entry_date.localeCompare(b.entry_date);
    }
    if (a.debit > 0 !== b.debit > 0) {
      return a.debit > 0 ? -1 : 1;
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
  fullyPaidInvoiceIds: Set<string>
) {
  if (
    entry.reference_type !== "invoice" ||
    entry.entry_type !== "debit" ||
    !entry.reference_id
  ) {
    return false;
  }

  // Only hide when the invoice has no unpaid credit portion left.
  return fullyPaidInvoiceIds.has(entry.reference_id);
}

function buildInvoicePaymentRemark(
  baseRemark: string,
  payments: LedgerRow[],
  totalCredit: number
) {
  if (totalCredit <= 0) return baseRemark;

  const modes = [
    ...new Set(payments.map((entry) => entry.payment_mode).filter(Boolean)),
  ];

  return `${baseRemark} — received (${modes.join(" + ")})`;
}

function prepareStatementEntries(
  entries: LedgerRow[],
  fullyPaidInvoiceIds: Set<string>
): PreparedStatementEntry[] {
  const filtered = entries.filter((entry) => {
    const amount = parseLedgerAmount(entry.amount);

    if (amount <= 0) return false;

    if (entry.entry_type !== "debit" && entry.entry_type !== "credit") {
      return false;
    }

    if (shouldHideInvoiceDebit(entry, fullyPaidInvoiceIds)) {
      return false;
    }

    return true;
  });

  const invoiceDebits = new Map<string, LedgerRow>();
  const paymentGroups = new Map<string, LedgerRow[]>();
  const otherEntries: LedgerRow[] = [];

  for (const entry of filtered) {
    if (
      entry.reference_type === "invoice" &&
      entry.entry_type === "debit" &&
      entry.reference_id
    ) {
      invoiceDebits.set(entry.reference_id, entry);
      continue;
    }

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

    otherEntries.push(entry);
  }

  const mergedInvoiceIds = new Set<string>();
  const prepared: PreparedStatementEntry[] = [];

  for (const [invoiceId, payments] of paymentGroups) {
    const sortedPayments = [...payments].sort((a, b) =>
      (a.created_at ?? "").localeCompare(b.created_at ?? "")
    );
    const invoiceDebit = invoiceDebits.get(invoiceId);
    const totalCredit = sortedPayments.reduce(
      (sum, entry) => sum + parseLedgerAmount(entry.amount),
      0
    );
    const debitAmount = invoiceDebit
      ? parseLedgerAmount(invoiceDebit.amount)
      : 0;
    const baseRemark =
      invoiceDebit?.remark ??
      sortedPayments[0].remark?.replace(/ — (cash|bank)$/i, "") ??
      "Tax invoice";

    mergedInvoiceIds.add(invoiceId);
    prepared.push({
      id: invoiceDebit?.id ?? sortedPayments[0].id,
      entry_date: invoiceDebit?.entry_date ?? sortedPayments[0].entry_date,
      remark: buildInvoicePaymentRemark(baseRemark, sortedPayments, totalCredit),
      reference_type: debitAmount > 0 ? "invoice" : "payment",
      reference_id: invoiceId,
      entry_type: debitAmount > 0 ? "debit" : "credit",
      debit: debitAmount,
      credit: totalCredit,
      created_at: invoiceDebit?.created_at ?? sortedPayments[0].created_at,
      created_by: invoiceDebit?.created_by ?? sortedPayments[0].created_by,
    });
  }

  for (const [invoiceId, invoiceDebit] of invoiceDebits) {
    if (mergedInvoiceIds.has(invoiceId)) continue;

    prepared.push({
      id: invoiceDebit.id,
      entry_date: invoiceDebit.entry_date,
      remark: invoiceDebit.remark,
      reference_type: invoiceDebit.reference_type,
      reference_id: invoiceId,
      entry_type: invoiceDebit.entry_type,
      debit: parseLedgerAmount(invoiceDebit.amount),
      credit: 0,
      created_at: invoiceDebit.created_at,
      created_by: invoiceDebit.created_by,
    });
  }

  for (const entry of otherEntries) {
    prepared.push({
      id: entry.id,
      entry_date: entry.entry_date,
      remark: entry.remark,
      reference_type: entry.reference_type,
      reference_id: entry.reference_id,
      entry_type: entry.entry_type,
      debit:
        entry.entry_type === "debit" ? parseLedgerAmount(entry.amount) : 0,
      credit:
        entry.entry_type === "credit" ? parseLedgerAmount(entry.amount) : 0,
      created_at: entry.created_at,
      created_by: entry.created_by,
    });
  }

  return sortPreparedEntries(prepared);
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

async function enrichClientStatementLines(
  entries: PreparedStatementEntry[],
  runningStart: number
): Promise<{
  lines: StatementResult["lines"];
  closingBalance: number;
  totals: { debit: number; credit: number };
}> {
  const supabase = await createClient();

  const invoiceIds = [
    ...new Set(
      entries
        .filter((entry) => entry.reference_type === "invoice" && entry.reference_id)
        .map((entry) => entry.reference_id as string)
    ),
  ];

  const userIds = [
    ...new Set(
      entries
        .map((entry) => entry.created_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [invoiceResult, userResult] = await Promise.all([
    invoiceIds.length > 0
      ? supabase
          .from("invoices")
          .select("id, invoice_number, vehicle_number")
          .in("id", invoiceIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from("users").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const invoiceMap = new Map(
    (invoiceResult.data ?? []).map((invoice) => [invoice.id, invoice])
  );
  const userMap = new Map(
    (userResult.data ?? []).map((user) => [user.id, user.full_name])
  );

  let runningBalance = runningStart;
  let totalDebit = 0;
  let totalCredit = 0;
  let index = 0;

  const lines = entries
    .map((entry) => {
      runningBalance = Math.round(
        (runningBalance + entry.debit - entry.credit) * 100
      ) / 100;
      totalDebit = Math.round((totalDebit + entry.debit) * 100) / 100;
      totalCredit = Math.round((totalCredit + entry.credit) * 100) / 100;
      index += 1;

      const invoice =
        entry.reference_type === "invoice" && entry.reference_id
          ? invoiceMap.get(entry.reference_id)
          : null;

      return {
        id: entry.id,
        index,
        entry_date: entry.entry_date,
        remark: entry.remark,
        reference_type: entry.reference_type,
        reference_id: entry.reference_id,
        entry_type: entry.entry_type,
        debit: entry.debit,
        credit: entry.credit,
        balance: runningBalance,
        balance_meta: getBalanceMeta(runningBalance, "client"),
        invoice_number: invoice?.invoice_number ?? null,
        vehicle_number: invoice?.vehicle_number ?? null,
        user_name: entry.created_by
          ? (userMap.get(entry.created_by) ?? null)
          : null,
        source: resolveStatementSource(entry.reference_type),
      };
    })
    .filter((line) => line.debit > 0 || line.credit > 0);

  return {
    lines,
    closingBalance: runningBalance,
    totals: { debit: totalDebit, credit: totalCredit },
  };
}

export async function getClientStatement(
  clientId: string,
  startDate: string,
  endDate: string
): Promise<StatementResult> {
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
    fullyPaidInvoiceIds
  );
  const inPeriod = prepareStatementEntries(
    ledgerRows.filter(
      (entry) => entry.entry_date >= startDate && entry.entry_date <= endDate
    ),
    fullyPaidInvoiceIds
  );

  const openingBalance = sumPreparedBalance(beforePeriod);
  const opening = getBalanceMeta(openingBalance, "client");
  const enriched = await enrichClientStatementLines(inPeriod, openingBalance);

  return {
    opening,
    closing: getBalanceMeta(enriched.closingBalance, "client"),
    totals: enriched.totals,
    lines: enriched.lines,
  };
}