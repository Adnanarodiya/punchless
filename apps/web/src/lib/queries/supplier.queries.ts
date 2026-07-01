import { createClient } from "@/lib/supabase/server";
import { ensureSystemParties } from "@/lib/queries/system-party.queries";
import { SYSTEM_EXPENSE_SUPPLIER_NAME } from "@/lib/constants/system-parties";
import {
  fetchAllLedgerEntries,
  fetchAllLedgerRowsForEntity,
} from "@/lib/utils/ledger-pagination";
import { sortPartiesWithSystemFirst } from "@/lib/utils/sort-system-parties";
import type { Database } from "@punchless/types/database.types";
import { getDiscountSettlementIdsByPaymentIds } from "@/lib/queries/journal.queries";
import {
  displayStatementLinesNewestFirst,
  getBalanceMeta,
  resolveStatementSource,
  type StatementEditableEntity,
  type StatementResult,
} from "@/lib/utils/statement";

type SupplierRow = Database["public"]["Tables"]["suppliers"]["Row"];
type LedgerRow = Database["public"]["Tables"]["ledger_entries"]["Row"];

export type SupplierWithPayable = SupplierRow & {
  payable_amount: number;
};

export type SupplierSummary = {
  totalSuppliers: number;
  totalPayable: number;
};

function parseLedgerAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumSupplierPayable(
  entries: { entry_type: string; amount: number }[]
) {
  return entries.reduce((balance, entry) => {
    if (entry.entry_type === "credit") return balance + Number(entry.amount);
    return balance - Number(entry.amount);
  }, 0);
}

function sortSupplierEntries(entries: LedgerRow[]) {
  return [...entries].sort((a, b) => {
    if (a.entry_date !== b.entry_date) {
      return a.entry_date.localeCompare(b.entry_date);
    }
    return (a.created_at ?? "").localeCompare(b.created_at ?? "");
  });
}

function resolveEditableEntity(
  entry: LedgerRow,
  discountPaymentMap: Map<string, string>
): {
  entity: StatementEditableEntity | null;
  id: string | null;
} {
  if (entry.reference_type === "opening_balance" || !entry.reference_id) {
    return { entity: null, id: null };
  }

  if (entry.reference_type === "discount_settlement") {
    return { entity: "discount_settlement", id: entry.reference_id };
  }

  if (entry.reference_type === "supplier_credit_note") {
    return { entity: "supplier_credit_note", id: entry.reference_id };
  }

  if (entry.reference_type === "supplier_debit_note") {
    return { entity: "supplier_debit_note", id: entry.reference_id };
  }

  if (entry.reference_type === "payment") {
    const settlementId = discountPaymentMap.get(entry.reference_id);
    if (settlementId) {
      return { entity: "discount_settlement", id: settlementId };
    }
    return { entity: "supplier_payment", id: entry.reference_id };
  }

  if (entry.reference_type === "purchase") {
    return { entity: "purchase", id: entry.reference_id };
  }

  return { entity: null, id: null };
}

/** Supplier payable = credits − debits (we owe them) */
async function getLedgerPayablesBySupplier(
  supplierIds: string[]
): Promise<Record<string, number>> {
  if (supplierIds.length === 0) return {};

  const supabase = await createClient();
  const data = await fetchAllLedgerEntries(supabase, "supplier", supplierIds);

  const balances: Record<string, number> = {};
  for (const id of supplierIds) balances[id] = 0;

  for (const entry of data) {
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
  await ensureSystemParties();
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

  const withPayable = suppliers.map((supplier) => ({
    ...supplier,
    payable_amount: payables[supplier.id] ?? 0,
  }));

  return sortPartiesWithSystemFirst(withPayable);
}

export async function getActiveSuppliers(): Promise<SupplierWithPayable[]> {
  return getSuppliers({ includeDeleted: false });
}

export async function getSuppliersSummary(): Promise<SupplierSummary> {
  const suppliers = await getSuppliers();
  const vendors = suppliers.filter(
    (s) => !s.is_system && s.name !== SYSTEM_EXPENSE_SUPPLIER_NAME
  );
  return {
    totalSuppliers: vendors.length,
    totalPayable: vendors.reduce(
      (sum, s) => sum + Math.max(0, s.payable_amount),
      0
    ),
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

  const entries = (await fetchAllLedgerRowsForEntity(
    supabase,
    "supplier",
    supplierId
  )) as LedgerRow[];
  const beforePeriod = entries.filter((entry) => entry.entry_date < startDate);
  const inPeriod = sortSupplierEntries(
    entries.filter(
      (entry) => entry.entry_date >= startDate && entry.entry_date <= endDate
    )
  );

  const openingBalance = sumSupplierPayable(beforePeriod);
  const opening = getBalanceMeta(openingBalance, "supplier");

  const paymentIds = [
    ...new Set(
      inPeriod
        .filter(
          (entry) =>
            entry.reference_type === "payment" && Boolean(entry.reference_id)
        )
        .map((entry) => entry.reference_id as string)
    ),
  ];

  const discountPaymentMap =
    await getDiscountSettlementIdsByPaymentIds(paymentIds);

  const purchaseIds = [
    ...new Set(
      inPeriod.flatMap((entry) => {
        const editable = resolveEditableEntity(entry, discountPaymentMap);
        return editable.entity === "purchase" && editable.id ? [editable.id] : [];
      })
    ),
  ];

  const userIds = [
    ...new Set(
      inPeriod
        .map((entry) => entry.created_by)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const [purchaseResult, paymentResult, userResult] = await Promise.all([
    purchaseIds.length > 0
      ? supabase
          .from("purchase_invoices")
          .select("id, invoice_number, taxable_amount, gst_percent, invoice_type")
          .in("id", purchaseIds)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [] }),
    paymentIds.length > 0
      ? supabase
          .from("supplier_payments")
          .select("id, payment_mode")
          .in("id", paymentIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase.from("users").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const purchaseMap = new Map(
    (purchaseResult.data ?? []).map((purchase) => [purchase.id, purchase])
  );
  const paymentMap = new Map(
    (paymentResult.data ?? []).map((payment) => [payment.id, payment])
  );
  const userMap = new Map(
    (userResult.data ?? []).map((user) => [user.id, user.full_name])
  );

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;
  let index = 0;

  const lines = inPeriod.map((entry) => {
    const debit = entry.entry_type === "debit" ? parseLedgerAmount(entry.amount) : 0;
    const credit =
      entry.entry_type === "credit" ? parseLedgerAmount(entry.amount) : 0;
    runningBalance = Math.round((runningBalance + credit - debit) * 100) / 100;
    totalDebit = Math.round((totalDebit + debit) * 100) / 100;
    totalCredit = Math.round((totalCredit + credit) * 100) / 100;
    index += 1;

    const editable = resolveEditableEntity(entry, discountPaymentMap);
    const purchase =
      editable.entity === "purchase" && editable.id
        ? purchaseMap.get(editable.id)
        : null;
    const payment =
      editable.entity === "supplier_payment" && editable.id
        ? paymentMap.get(editable.id)
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
      editable_entity: editable.entity,
      editable_id: editable.id,
      payment_mode: payment?.payment_mode ?? null,
      bill_amount: purchase ? parseLedgerAmount(purchase.taxable_amount) : null,
      is_quick_bill: false,
    };
  });

  return {
    opening,
    closing: getBalanceMeta(runningBalance, "supplier"),
    totals: { debit: totalDebit, credit: totalCredit },
    lines: displayStatementLinesNewestFirst(lines),
  };
}