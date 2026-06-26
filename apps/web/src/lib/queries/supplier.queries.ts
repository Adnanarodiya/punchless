import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";
import {
  getBalanceMeta,
  resolveStatementSource,
  type StatementResult,
} from "@/lib/utils/statement";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];

export type SupplierWithPayable = SupplierRow & {
  payable_amount: number;
};

export type SupplierSummary = {
  totalSuppliers: number;
  totalPayable: number;
};

function sumSupplierPayable(
  entries: { entry_type: string; amount: number }[]
) {
  return entries.reduce((balance, entry) => {
    if (entry.entry_type === "credit") return balance + Number(entry.amount);
    return balance - Number(entry.amount);
  }, 0);
}

/** Supplier payable = credits − debits (we owe them) */
async function getLedgerPayablesBySupplier(
  supplierIds: string[]
): Promise<Record<string, number>> {
  if (supplierIds.length === 0) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_entries")
    .select("entity_id, entry_type, amount")
    .eq("entity_type", "supplier")
    .in("entity_id", supplierIds);

  const balances: Record<string, number> = {};
  for (const id of supplierIds) balances[id] = 0;

  for (const entry of data ?? []) {
    const id = entry.entity_id as string;
    if (entry.entry_type === "credit") {
      balances[id] = (balances[id] ?? 0) + Number(entry.amount);
    } else {
      balances[id] = (balances[id] ?? 0) - Number(entry.amount);
    }
  }

  return balances;
}

export async function getSuppliers(
  options: { includeDeleted?: boolean } = {}
): Promise<SupplierWithPayable[]> {
  const supabase = await createClient();

  let query = supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (!options.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data } = await query;
  const suppliers = (data as SupplierRow[]) ?? [];
  const payables = await getLedgerPayablesBySupplier(suppliers.map((s) => s.id));

  return suppliers.map((supplier) => ({
    ...supplier,
    payable_amount: payables[supplier.id] ?? 0,
  }));
}

export async function getActiveSuppliers(): Promise<SupplierWithPayable[]> {
  return getSuppliers({ includeDeleted: false });
}

export async function getSuppliersSummary(): Promise<SupplierSummary> {
  const suppliers = await getSuppliers();
  return {
    totalSuppliers: suppliers.length,
    totalPayable: suppliers.reduce((sum, s) => sum + s.payable_amount, 0),
  };
}

export async function getSupplierById(
  supplierId: string
): Promise<SupplierWithPayable | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", supplierId)
    .single();

  if (!data) return null;

  const supplier = data as SupplierRow;
  const payables = await getLedgerPayablesBySupplier([supplier.id]);

  return {
    ...supplier,
    payable_amount: payables[supplier.id] ?? 0,
  };
}

export async function getSupplierStatement(
  supplierId: string,
  startDate: string,
  endDate: string
): Promise<StatementResult> {
  const supabase = await createClient();

  const { data: allEntries } = await supabase
    .from("ledger_entries")
    .select("*")
    .eq("entity_type", "supplier")
    .eq("entity_id", supplierId)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  const entries = allEntries ?? [];

  const beforePeriod = entries.filter((entry) => entry.entry_date < startDate);
  const inPeriod = entries.filter(
    (entry) => entry.entry_date >= startDate && entry.entry_date <= endDate
  );

  const openingBalance = sumSupplierPayable(beforePeriod);
  const opening = getBalanceMeta(openingBalance, "supplier");

  const purchaseIds = [
    ...new Set(
      inPeriod
        .filter(
          (entry) => entry.reference_type === "purchase" && entry.reference_id
        )
        .map((entry) => entry.reference_id as string)
    ),
  ];

  const userIds = [
    ...new Set(
      inPeriod
        .map((entry) => entry.created_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [purchaseResult, userResult] = await Promise.all([
    purchaseIds.length > 0
      ? supabase
          .from("purchase_invoices")
          .select("id, invoice_number")
          .in("id", purchaseIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from("users").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const purchaseMap = new Map(
    (purchaseResult.data ?? []).map((purchase) => [purchase.id, purchase])
  );
  const userMap = new Map(
    (userResult.data ?? []).map((user) => [user.id, user.full_name])
  );

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  let index = 0;

  const lines = inPeriod.map((entry) => {
    const debit = entry.entry_type === "debit" ? Number(entry.amount) : 0;
    const credit = entry.entry_type === "credit" ? Number(entry.amount) : 0;
    runningBalance = Math.round((runningBalance + credit - debit) * 100) / 100;
    totalDebit = Math.round((totalDebit + debit) * 100) / 100;
    totalCredit = Math.round((totalCredit + credit) * 100) / 100;
    index += 1;

    const purchase =
      entry.reference_type === "purchase" && entry.reference_id
        ? purchaseMap.get(entry.reference_id)
        : null;

    return {
      id: entry.id,
      index,
      entry_date: entry.entry_date,
      remark: entry.remark,
      reference_type: entry.reference_type,
      reference_id: entry.reference_id,
      entry_type: entry.entry_type,
      debit,
      credit,
      balance: runningBalance,
      balance_meta: getBalanceMeta(runningBalance, "supplier"),
      invoice_number: purchase?.invoice_number ?? null,
      vehicle_number: null,
      user_name: entry.created_by
        ? (userMap.get(entry.created_by) ?? null)
        : null,
      source: resolveStatementSource(entry.reference_type),
    };
  });

  return {
    opening,
    closing: getBalanceMeta(runningBalance, "supplier"),
    totals: { debit: totalDebit, credit: totalCredit },
    lines,
  };
}