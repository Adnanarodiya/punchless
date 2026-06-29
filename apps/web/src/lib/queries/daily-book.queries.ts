import { createClient } from "@/lib/supabase/server";
import { formatPaymentModeLabel } from "@/lib/utils/payment-mode-display";

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function sortKey(createdAt: string | null | undefined, fallbackDate: string) {
  return createdAt ?? `${fallbackDate}T23:59:59`;
}

const BANK_RECEIPT_REMARK = "Imported bank receipt";

function bankReceiptLineKey(date: string, amount: number) {
  return `${date}|${round2(amount)}`;
}

function isImportedBankReceiptRemark(remark: string | null | undefined) {
  if (!remark) return false;
  const normalized = remark.trim().toLowerCase();
  return (
    normalized === BANK_RECEIPT_REMARK.toLowerCase() ||
    normalized.startsWith("receipt —") ||
    normalized.startsWith("receipt -")
  );
}

function lineModes(
  paymentMode: string | null | undefined,
  bankId: string | null | undefined,
  bankNames: Record<string, string>
) {
  const raw = paymentMode ?? null;
  const bankName = bankId ? bankNames[bankId] : null;
  return {
    paymentMode: raw,
    mode: formatPaymentModeLabel(raw, bankName),
  };
}

function shiftDate(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type DailyBookSourceType =
  | "invoice"
  | "client_payment"
  | "supplier_payment"
  | "staff_payment"
  | "salary_advance"
  | "transaction"
  | "purchase_invoice"
  | "bank_transfer"
  | "bank_transaction";

export type DailyBookLine = {
  id: string;
  sourceType: DailyBookSourceType;
  sourceId: string;
  canDelete: boolean;
  category: string;
  particular: string;
  income: number;
  expense: number;
  transfer: number;
  purchase: number;
  /** Display label, e.g. "Bank" or "Cash" */
  mode: string | null;
  /** Raw mode for cash/bank book filters: cash | bank | credit | split */
  paymentMode: string | null;
  date: string;
  remark: string | null;
  userName: string | null;
  sortAt: string;
};

export type DailyBookDaySummary = {
  totalBilling: number;
  cashReceived: number;
  bankReceived: number;
  creditUdhar: number;
  totalExpenses: number;
};

export type DailyBookReport = {
  periodStart: string;
  periodEnd: string;
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
  summary: DailyBookDaySummary;
  comparisonSummary: DailyBookDaySummary;
  lines: DailyBookLine[];
};

const STAFF_TYPE_CATEGORY: Record<string, string> = {
  salary_paid: "Salary paid",
  advance: "Advance paid",
  deduction: "Deduction",
};

type BuildResult = Omit<
  DailyBookReport,
  "periodStart" | "periodEnd" | "comparisonSummary"
>;

function previousMonthBounds(startDate: string): { start: string; end: string } {
  const d = new Date(`${startDate}T12:00:00`);
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const start = d.toISOString().slice(0, 10);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

async function buildDailyBookForRange(
  startDate: string,
  endDate: string
): Promise<BuildResult> {
  const supabase = await createClient();
  const rangeStart = `${startDate}T00:00:00`;
  const rangeEnd = `${endDate}T23:59:59`;

  const [
    { data: invoices },
    { data: clientPayments },
    { data: supplierPayments },
    { data: staffPayments },
    { data: advances },
    { data: transactions },
    { data: purchases },
    { data: bankTransfers },
    { data: bankTransactions },
    { data: banks },
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select(
        "id, total_amount, cash_amount, bank_amount, credit_amount, payment_mode, invoice_number, invoice_date, remark, created_at, gst_percent, clients(name), creator:users!invoices_created_by_fkey(full_name)"
      )
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate),
    supabase
      .from("client_payments")
      .select(
        "id, amount, payment_mode, bank_id, remark, payment_date, created_at, clients(name), creator:users!client_payments_created_by_fkey(full_name)"
      )
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
    supabase
      .from("supplier_payments")
      .select(
        "id, amount, payment_mode, bank_id, remark, payment_date, created_at, suppliers(name), creator:users!supplier_payments_created_by_fkey(full_name)"
      )
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
    supabase
      .from("staff_payments")
      .select(
        "id, amount, payment_mode, bank_id, payment_type, remark, payment_date, created_at, users!staff_payments_employee_id_fkey(full_name), creator:users!staff_payments_created_by_fkey(full_name)"
      )
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
    supabase
      .from("salary_advances")
      .select(
        "id, amount, reason, approved_at, users!salary_advances_employee_id_fkey(full_name), approver:users!salary_advances_approved_by_fkey(full_name)"
      )
      .eq("status", "approved")
      .gte("approved_at", rangeStart)
      .lte("approved_at", rangeEnd),
    supabase
      .from("transactions")
      .select(
        "id, amount, transaction_type, payment_mode, bank_id, particular, remark, transaction_date, created_at, creator:users!transactions_created_by_fkey(full_name)"
      )
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate),
    supabase
      .from("purchase_invoices")
      .select(
        "id, total_amount, invoice_number, invoice_date, remark, created_at, suppliers(name), creator:users!purchase_invoices_created_by_fkey(full_name)"
      )
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate),
    supabase
      .from("bank_transfers")
      .select(
        "id, amount, remark, transfer_date, created_at, from_bank_id, to_bank_id, creator:users!bank_transfers_created_by_fkey(full_name)"
      )
      .gte("transfer_date", startDate)
      .lte("transfer_date", endDate),
    supabase
      .from("bank_transactions")
      .select(
        "id, amount, transaction_type, remark, transaction_date, created_at, bank_accounts(bank_name), creator:users!bank_transactions_created_by_fkey(full_name)"
      )
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate),
    supabase.from("bank_accounts").select("id, bank_name"),
  ]);

  const bankNames = Object.fromEntries(
    (banks ?? []).map((b) => [(b as { id: string }).id, (b as { bank_name: string }).bank_name])
  );

  const lines: DailyBookLine[] = [];
  const bankClientReceiptKeys = new Set<string>();
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

  const summary: DailyBookDaySummary = {
    totalBilling: 0,
    cashReceived: 0,
    bankReceived: 0,
    creditUdhar: 0,
    totalExpenses: 0,
  };

  for (const row of invoices ?? []) {
    const r = row as {
      id: string;
      total_amount: number;
      cash_amount: number;
      bank_amount: number;
      credit_amount: number;
      payment_mode: string;
      invoice_number: string | null;
      invoice_date: string;
      remark: string | null;
      created_at: string | null;
      gst_percent: number;
      clients: { name: string } | null;
      creator: { full_name: string } | null;
    };

    const total = parseAmount(r.total_amount);
    const cash = parseAmount(r.cash_amount);
    const bank = parseAmount(r.bank_amount);
    const credit = parseAmount(r.credit_amount);
    const received = cash + bank;
    const name = r.clients?.name ?? "Customer";
    const isQuickBill = r.gst_percent === 0 && !r.invoice_number;

    summary.totalBilling += total;
    summary.cashReceived += cash;
    summary.bankReceived += bank;
    summary.creditUdhar += credit;

    // Bill rows show full billing in Income (cash + bank + credit), same idea as Purchase for supplier bills.
    totalIncome += total;
    if (received > 0) {
      customerCollected += received;
    }

    const remarkParts = [
      r.invoice_number ? `#${r.invoice_number}` : null,
      credit > 0 ? `Udhar ${credit.toFixed(2)}` : null,
      r.remark,
    ].filter(Boolean);

    const invoiceModes = lineModes(r.payment_mode, null, bankNames);

    lines.push({
      id: `inv-${r.id}`,
      sourceType: "invoice",
      sourceId: r.id,
      canDelete: false,
      category: isQuickBill ? "Quick bill" : "Bill created",
      particular: name,
      income: total,
      expense: 0,
      transfer: 0,
      purchase: 0,
      ...invoiceModes,
      date: r.invoice_date,
      remark: remarkParts.length > 0 ? remarkParts.join(" · ") : null,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.invoice_date),
    });
  }

  for (const row of clientPayments ?? []) {
    const r = row as {
      id: string;
      amount: number;
      payment_mode: string;
      bank_id: string | null;
      remark: string | null;
      payment_date: string;
      created_at: string | null;
      clients: { name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const name = r.clients?.name ?? "Customer";
    const clientModes = lineModes(r.payment_mode, r.bank_id, bankNames);

    totalIncome += amount;
    customerCollected += amount;
    if (r.payment_mode === "cash") summary.cashReceived += amount;
    if (r.payment_mode === "bank") {
      summary.bankReceived += amount;
      bankClientReceiptKeys.add(bankReceiptLineKey(r.payment_date, amount));
    }

    const isBankReceipt = r.payment_mode === "bank";
    lines.push({
      id: `cp-${r.id}`,
      sourceType: "client_payment",
      sourceId: r.id,
      canDelete: false,
      category: isBankReceipt ? "Bank deposit" : "Payment received",
      particular: name,
      income: amount,
      expense: 0,
      transfer: 0,
      purchase: 0,
      ...clientModes,
      date: r.payment_date,
      remark: isBankReceipt
        ? isImportedBankReceiptRemark(r.remark)
          ? BANK_RECEIPT_REMARK
          : r.remark
        : r.remark,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.payment_date),
    });
  }

  for (const row of supplierPayments ?? []) {
    const r = row as {
      id: string;
      amount: number;
      payment_mode: string;
      bank_id: string | null;
      remark: string | null;
      payment_date: string;
      created_at: string | null;
      suppliers: { name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const name = r.suppliers?.name ?? "Supplier";
    const supplierModes = lineModes(r.payment_mode, r.bank_id, bankNames);

    totalExpense += amount;
    supplierPaid += amount;
    summary.totalExpenses += amount;

    lines.push({
      id: `sp-${r.id}`,
      sourceType: "supplier_payment",
      sourceId: r.id,
      canDelete: false,
      category: "Supplier paid",
      particular: name,
      income: 0,
      expense: amount,
      transfer: 0,
      purchase: 0,
      ...supplierModes,
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
    const approvedDate = r.approved_at?.slice(0, 10) ?? startDate;

    totalExpense += amount;
    advanceGiven += amount;
    summary.totalExpenses += amount;

    const advanceModes = lineModes("cash", null, bankNames);

    lines.push({
      id: `adv-${r.id}`,
      sourceType: "salary_advance",
      sourceId: r.id,
      canDelete: false,
      category: "Advance given",
      particular: name,
      income: 0,
      expense: amount,
      transfer: 0,
      purchase: 0,
      ...advanceModes,
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
      bank_id: string | null;
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
    const category = STAFF_TYPE_CATEGORY[type] ?? "Staff payment";
    const staffModes = lineModes(r.payment_mode, r.bank_id, bankNames);

    totalExpense += amount;
    summary.totalExpenses += amount;
    if (type === "advance") advanceGiven += amount;
    else staffPaid += amount;

    lines.push({
      id: `st-${r.id}`,
      sourceType: "staff_payment",
      sourceId: r.id,
      canDelete: true,
      category,
      particular: name,
      income: 0,
      expense: amount,
      transfer: 0,
      purchase: 0,
      ...staffModes,
      date: r.payment_date,
      remark: r.remark,
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
      bank_id: string | null;
      particular: string;
      remark: string | null;
      transaction_date: string;
      created_at: string | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const txModes = lineModes(r.payment_mode, r.bank_id, bankNames);

    if (r.transaction_type === "income") {
      totalIncome += amount;
      incomeEntries += amount;
      if (r.payment_mode === "cash") summary.cashReceived += amount;
      if (r.payment_mode === "bank") summary.bankReceived += amount;

      lines.push({
        id: `tx-${r.id}`,
        sourceType: "transaction",
        sourceId: r.id,
        canDelete: true,
        category: "Other income",
        particular: r.particular,
        income: amount,
        expense: 0,
        transfer: 0,
        purchase: 0,
        ...txModes,
        date: r.transaction_date,
        remark: r.remark,
        userName: r.creator?.full_name ?? null,
        sortAt: sortKey(r.created_at, r.transaction_date),
      });
    } else {
      totalExpense += amount;
      expenseEntries += amount;
      summary.totalExpenses += amount;

      lines.push({
        id: `tx-${r.id}`,
        sourceType: "transaction",
        sourceId: r.id,
        canDelete: true,
        category: "Expense",
        particular: r.particular,
        income: 0,
        expense: amount,
        transfer: 0,
        purchase: 0,
        ...txModes,
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

    const purchaseModes = lineModes("credit", null, bankNames);

    lines.push({
      id: `pur-${r.id}`,
      sourceType: "purchase_invoice",
      sourceId: r.id,
      canDelete: false,
      category: "Supplier bill",
      particular: name,
      income: 0,
      expense: 0,
      transfer: 0,
      purchase: amount,
      ...purchaseModes,
      date: r.invoice_date,
      remark: r.remark ?? (r.invoice_number ? `#${r.invoice_number}` : null),
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

    const transferModes = lineModes("bank", null, bankNames);

    lines.push({
      id: `bt-${r.id}`,
      sourceType: "bank_transfer",
      sourceId: r.id,
      canDelete: false,
      category: "Bank transfer",
      particular: `${fromName} → ${toName}`,
      income: 0,
      expense: 0,
      transfer: amount,
      purchase: 0,
      ...transferModes,
      date: r.transfer_date,
      remark: r.remark,
      userName: r.creator?.full_name ?? null,
      sortAt: sortKey(r.created_at, r.transfer_date),
    });
  }

  for (const row of bankTransactions ?? []) {
    const r = row as {
      id: string;
      amount: number;
      transaction_type: string;
      remark: string | null;
      transaction_date: string;
      created_at: string | null;
      bank_accounts: { bank_name: string } | null;
      creator: { full_name: string } | null;
    };
    const amount = parseAmount(r.amount);
    const bankName = r.bank_accounts?.bank_name ?? "Bank";
    const isDeposit = r.transaction_type === "deposit";

    const bankTxModes = lineModes("bank", null, bankNames);
    const bankTxDisplay = {
      ...bankTxModes,
      mode: formatPaymentModeLabel("bank", bankName),
    };

    if (isDeposit) {
      if (bankClientReceiptKeys.has(bankReceiptLineKey(r.transaction_date, amount))) {
        continue;
      }

      totalIncome += amount;
      summary.bankReceived += amount;
      lines.push({
        id: `btx-${r.id}`,
        sourceType: "bank_transaction",
        sourceId: r.id,
        canDelete: false,
        category: "Bank deposit",
        particular: bankName,
        income: amount,
        expense: 0,
        transfer: 0,
        purchase: 0,
        ...bankTxDisplay,
        date: r.transaction_date,
        remark: r.remark,
        userName: r.creator?.full_name ?? null,
        sortAt: sortKey(r.created_at, r.transaction_date),
      });
    } else {
      totalExpense += amount;
      summary.totalExpenses += amount;
      lines.push({
        id: `btx-${r.id}`,
        sourceType: "bank_transaction",
        sourceId: r.id,
        canDelete: false,
        category: "Bank withdrawal",
        particular: bankName,
        income: 0,
        expense: amount,
        transfer: 0,
        purchase: 0,
        ...bankTxDisplay,
        date: r.transaction_date,
        remark: r.remark,
        userName: r.creator?.full_name ?? null,
        sortAt: sortKey(r.created_at, r.transaction_date),
      });
    }
  }

  lines.sort((a, b) => b.sortAt.localeCompare(a.sortAt));

  return {
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
    summary: {
      totalBilling: round2(summary.totalBilling),
      cashReceived: round2(summary.cashReceived),
      bankReceived: round2(summary.bankReceived),
      creditUdhar: round2(summary.creditUdhar),
      totalExpenses: round2(summary.totalExpenses),
    },
    lines,
  };
}

export async function getDailyBookReport(date: string): Promise<DailyBookReport> {
  const [today, yesterday] = await Promise.all([
    buildDailyBookForRange(date, date),
    buildDailyBookForRange(shiftDate(date, -1), shiftDate(date, -1)),
  ]);

  return {
    periodStart: date,
    periodEnd: date,
    ...today,
    comparisonSummary: yesterday.summary,
  };
}

export async function getMonthlyBookReport(
  startDate: string,
  endDate: string
): Promise<DailyBookReport> {
  const previous = previousMonthBounds(startDate);
  const [current, prior] = await Promise.all([
    buildDailyBookForRange(startDate, endDate),
    buildDailyBookForRange(previous.start, previous.end),
  ]);

  return {
    periodStart: startDate,
    periodEnd: endDate,
    ...current,
    comparisonSummary: prior.summary,
  };
}