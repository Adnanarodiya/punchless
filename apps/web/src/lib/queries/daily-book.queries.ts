import { createClient } from "@/lib/supabase/server";

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type DailyBookSourceType =
  | "client_payment"
  | "supplier_payment"
  | "staff_payment"
  | "salary_advance"
  | "transaction"
  | "purchase_invoice"
  | "bank_transfer";

export type DailyBookLine = {
  id: string;
  sourceType: DailyBookSourceType;
  sourceId: string;
  canDelete: boolean;
  particular: string;
  income: number;
  expense: number;
  transfer: number;
  purchase: number;
  mode: string | null;
  date: string;
  remark: string | null;
  userName: string | null;
  sortAt: string;
};

export type DailyBookReport = {
  date: string;
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
  totalPurchase: number;
  balance: number;
  customerCollected: number;
  supplierPaid: number;
  staffPaid: number;
  advanceGiven: number;
  incomeEntries: number;
  expenseEntries: number;
  purchasesBilled: number;
  lines: DailyBookLine[];
};

const STAFF_TYPE_LABEL: Record<string, string> = {
  salary_paid: "Salary",
  advance: "Upad",
  deduction: "Deduction",
};

function sortKey(createdAt: string | null | undefined, fallbackDate: string) {
  return createdAt ?? `${fallbackDate}T23:59:59`;
}

export async function getDailyBookReport(date: string): Promise<DailyBookReport> {
  const supabase = await createClient();
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const [
    { data: clientPayments },
    { data: supplierPayments },
    { data: staffPayments },
    { data: advances },
    { data: transactions },
    { data: purchases },
    { data: bankTransfers },
    { data: banks },
  ] = await Promise.all([
    supabase
      .from("client_payments")
      .select(
        "id, amount, payment_mode, remark, payment_date, created_at, clients(name), creator:users!client_payments_created_by_fkey(full_name)"
      )
      .eq("payment_date", date),
    supabase
      .from("supplier_payments")
      .select(
        "id, amount, payment_mode, remark, payment_date, created_at, suppliers(name), creator:users!supplier_payments_created_by_fkey(full_name)"
      )
      .eq("payment_date", date),
    supabase
      .from("staff_payments")
      .select(
        "id, amount, payment_mode, payment_type, remark, payment_date, created_at, users!staff_payments_employee_id_fkey(full_name), creator:users!staff_payments_created_by_fkey(full_name)"
      )
      .eq("payment_date", date),
    supabase
      .from("salary_advances")
      .select(
        "id, amount, reason, approved_at, users!salary_advances_employee_id_fkey(full_name), approver:users!salary_advances_approved_by_fkey(full_name)"
      )
      .eq("status", "approved")
      .gte("approved_at", dayStart)
      .lte("approved_at", dayEnd),
    supabase
      .from("transactions")
      .select(
        "id, amount, transaction_type, payment_mode, particular, remark, transaction_date, created_at, creator:users!transactions_created_by_fkey(full_name)"
      )
      .eq("transaction_date", date),
    supabase
      .from("purchase_invoices")
      .select(
        "id, total_amount, invoice_number, invoice_date, remark, created_at, suppliers(name), creator:users!purchase_invoices_created_by_fkey(full_name)"
      )
      .eq("is_deleted", false)
      .eq("invoice_date", date),
    supabase
      .from("bank_transfers")
      .select(
        "id, amount, remark, transfer_date, created_at, from_bank_id, to_bank_id, creator:users!bank_transfers_created_by_fkey(full_name)"
      )
      .eq("transfer_date", date),
    supabase.from("bank_accounts").select("id, bank_name"),
  ]);

  const bankNames = Object.fromEntries(
    (banks ?? []).map((b) => [(b as { id: string }).id, (b as { bank_name: string }).bank_name])
  );

  const lines: DailyBookLine[] = [];
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransfer = 0;
  let totalPurchase = 0;
  let customerCollected = 0;
  let supplierPaid = 0;
  let staffPaid = 0;
  let advanceGiven = 0;
  let incomeEntries = 0;
  let expenseEntries = 0;
  let purchasesBilled = 0;

  for (const row of clientPayments ?? []) {
    const r = row as {
      id: string;
      amount: number;
      payment_mode: string;
      remark: string | null;
      payment_date: string;
      created_at: string | null;
      clients: { name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const name = r.clients?.name ?? "Customer";
    totalIncome += amount;
    customerCollected += amount;
    lines.push({
      id: `cp-${r.id}`,
      sourceType: "client_payment",
      sourceId: r.id,
      canDelete: false,
      particular: name,
      income: amount,
      expense: 0,
      transfer: 0,
      purchase: 0,
      mode: r.payment_mode,
      date: r.payment_date,
      remark: r.remark,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.payment_date),
    });
  }

  for (const row of supplierPayments ?? []) {
    const r = row as {
      id: string;
      amount: number;
      payment_mode: string;
      remark: string | null;
      payment_date: string;
      created_at: string | null;
      suppliers: { name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const name = r.suppliers?.name ?? "Supplier";
    totalExpense += amount;
    supplierPaid += amount;
    lines.push({
      id: `sp-${r.id}`,
      sourceType: "supplier_payment",
      sourceId: r.id,
      canDelete: false,
      particular: name,
      income: 0,
      expense: amount,
      transfer: 0,
      purchase: 0,
      mode: r.payment_mode,
      date: r.payment_date,
      remark: r.remark,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.payment_date),
    });
  }

  for (const row of advances ?? []) {
    const r = row as {
      id: string;
      amount: number;
      reason: string | null;
      approved_at: string | null;
      users: { full_name: string } | null;
      approver: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const name = r.users?.full_name ?? "Staff";
    const approvedDate = r.approved_at?.slice(0, 10) ?? date;
    totalExpense += amount;
    advanceGiven += amount;
    lines.push({
      id: `adv-${r.id}`,
      sourceType: "salary_advance",
      sourceId: r.id,
      canDelete: false,
      particular: name,
      income: 0,
      expense: amount,
      transfer: 0,
      purchase: 0,
      mode: "cash",
      date: approvedDate,
      remark: r.reason,
      userName: r.approver?.full_name ?? null,
      sortAt: sortKey(r.approved_at, approvedDate),
    });
  }

  for (const row of staffPayments ?? []) {
    const r = row as {
      id: string;
      amount: number;
      payment_mode: string | null;
      payment_type: string;
      remark: string | null;
      payment_date: string;
      created_at: string | null;
      users: { full_name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const type = r.payment_type;
    if (type === "deduction") continue;

    const name = r.users?.full_name ?? "Staff";
    const typeLabel = STAFF_TYPE_LABEL[type] ?? "Payment";
    totalExpense += amount;
    if (type === "advance") advanceGiven += amount;
    else staffPaid += amount;
    lines.push({
      id: `st-${r.id}`,
      sourceType: "staff_payment",
      sourceId: r.id,
      canDelete: true,
      particular: name,
      income: 0,
      expense: amount,
      transfer: 0,
      purchase: 0,
      mode: r.payment_mode,
      date: r.payment_date,
      remark: r.remark ?? typeLabel,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.payment_date),
    });
  }

  for (const row of transactions ?? []) {
    const r = row as {
      id: string;
      amount: number;
      transaction_type: string;
      payment_mode: string;
      particular: string;
      remark: string | null;
      transaction_date: string;
      created_at: string | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    if (r.transaction_type === "income") {
      totalIncome += amount;
      incomeEntries += amount;
      lines.push({
        id: `tx-${r.id}`,
        sourceType: "transaction",
        sourceId: r.id,
        canDelete: true,
        particular: r.particular,
        income: amount,
        expense: 0,
        transfer: 0,
        purchase: 0,
        mode: r.payment_mode,
        date: r.transaction_date,
        remark: r.remark,
        userName: r.creator?.full_name ?? null,
        sortAt: sortKey(r.created_at, r.transaction_date),
      });
    } else {
      totalExpense += amount;
      expenseEntries += amount;
      lines.push({
        id: `tx-${r.id}`,
        sourceType: "transaction",
        sourceId: r.id,
        canDelete: true,
        particular: r.particular,
        income: 0,
        expense: amount,
        transfer: 0,
        purchase: 0,
        mode: r.payment_mode,
        date: r.transaction_date,
        remark: r.remark,
        userName: r.creator?.full_name ?? null,
        sortAt: sortKey(r.created_at, r.transaction_date),
      });
    }
  }

  for (const row of purchases ?? []) {
    const r = row as {
      id: string;
      total_amount: number;
      invoice_number: string | null;
      invoice_date: string;
      remark: string | null;
      created_at: string | null;
      suppliers: { name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.total_amount);
    const name = r.suppliers?.name ?? "Supplier";
    totalPurchase += amount;
    purchasesBilled += amount;
    lines.push({
      id: `pur-${r.id}`,
      sourceType: "purchase_invoice",
      sourceId: r.id,
      canDelete: false,
      particular: name,
      income: 0,
      expense: 0,
      transfer: 0,
      purchase: amount,
      mode: "credit",
      date: r.invoice_date,
      remark: r.remark ?? r.invoice_number,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.invoice_date),
    });
  }

  for (const row of bankTransfers ?? []) {
    const r = row as {
      id: string;
      amount: number;
      remark: string | null;
      transfer_date: string;
      created_at: string | null;
      from_bank_id: string;
      to_bank_id: string;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const fromName = bankNames[r.from_bank_id] ?? "Bank";
    const toName = bankNames[r.to_bank_id] ?? "Bank";
    totalTransfer += amount;
    lines.push({
      id: `bt-${r.id}`,
      sourceType: "bank_transfer",
      sourceId: r.id,
      canDelete: false,
      particular: `${fromName} → ${toName}`,
      income: 0,
      expense: 0,
      transfer: amount,
      purchase: 0,
      mode: "bank",
      date: r.transfer_date,
      remark: r.remark,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.transfer_date),
    });
  }

  lines.sort((a, b) => a.sortAt.localeCompare(b.sortAt));

  return {
    date,
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    totalTransfer: round2(totalTransfer),
    totalPurchase: round2(totalPurchase),
    balance: round2(totalIncome - totalExpense),
    customerCollected: round2(customerCollected),
    supplierPaid: round2(supplierPaid),
    staffPaid: round2(staffPaid),
    advanceGiven: round2(advanceGiven),
    incomeEntries: round2(incomeEntries),
    expenseEntries: round2(expenseEntries),
    purchasesBilled: round2(purchasesBilled),
    lines,
  };
}