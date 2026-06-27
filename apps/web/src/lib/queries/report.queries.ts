import { createClient } from "@/lib/supabase/server";

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export type DailyBreakdownRow = {
  date: string;
  income: number;
  expense: number;
  net: number;
};

export type DailyReport = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  invoiceTotal: number;
  purchaseTotal: number;
  clientPayments: number;
  supplierPayments: number;
  staffPayments: number;
  breakdown: DailyBreakdownRow[];
};

export type MonthlySlice = {
  key: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

export type YearlyReport = {
  year: number;
  months: MonthlySlice[];
  totalIncome: number;
  totalExpense: number;
  net: number;
};

export type GstSlabRow = {
  gstPercent: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
  invoiceCount: number;
};

export type GstReport = {
  slabs: GstSlabRow[];
  totalTaxable: number;
  totalGst: number;
  totalAmount: number;
};

export type InvoiceReportRow = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  vehicleNumber: string | null;
  totalAmount: number;
  cashAmount: number;
  bankAmount: number;
  creditAmount: number;
  gstPercent: number;
  gstAmount: number;
};

export type ParticularRow = {
  particular: string;
  income: number;
  expense: number;
  net: number;
  count: number;
};

export type ExpenseReportRow = {
  id: string;
  date: string;
  particular: string;
  amount: number;
  paymentMode: string;
  bankName: string | null;
  remark: string | null;
};

export type RojmelRow = {
  id: string;
  date: string;
  category: string;
  remark: string;
  debit: number;
  credit: number;
  balance: number;
};

export async function getDailyReport(
  startDate: string,
  endDate: string
): Promise<DailyReport> {
  const supabase = await createClient();

  const [
    { data: transactions },
    { data: invoices },
    { data: purchases },
    { data: clientPayments },
    { data: supplierPayments },
    { data: staffPayments },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("amount, transaction_type, transaction_date")
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate),
    supabase
      .from("invoices")
      .select("total_amount, invoice_date")
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate),
    supabase
      .from("purchase_invoices")
      .select("total_amount, invoice_date")
      .eq("is_deleted", false)
      .gte("invoice_date", startDate)
      .lte("invoice_date", endDate),
    supabase
      .from("client_payments")
      .select("amount, payment_date")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
    supabase
      .from("supplier_payments")
      .select("amount, payment_date")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
    supabase
      .from("staff_payments")
      .select("amount, payment_date, payment_type")
      .gte("payment_date", startDate)
      .lte("payment_date", endDate),
  ]);

  const byDate: Record<string, { income: number; expense: number }> = {};
  let totalIncome = 0;
  let totalExpense = 0;

  for (const row of transactions ?? []) {
    const amount = parseAmount(row.amount);
    const key = row.transaction_date;
    if (!byDate[key]) byDate[key] = { income: 0, expense: 0 };
    if (row.transaction_type === "income") {
      byDate[key].income += amount;
      totalIncome += amount;
    } else {
      byDate[key].expense += amount;
      totalExpense += amount;
    }
  }

  const breakdown = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      income: round2(values.income),
      expense: round2(values.expense),
      net: round2(values.income - values.expense),
    }));

  return {
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    net: round2(totalIncome - totalExpense),
    invoiceTotal: round2(
      (invoices ?? []).reduce((s, r) => s + parseAmount(r.total_amount), 0)
    ),
    purchaseTotal: round2(
      (purchases ?? []).reduce((s, r) => s + parseAmount(r.total_amount), 0)
    ),
    clientPayments: round2(
      (clientPayments ?? []).reduce((s, r) => s + parseAmount(r.amount), 0)
    ),
    supplierPayments: round2(
      (supplierPayments ?? []).reduce((s, r) => s + parseAmount(r.amount), 0)
    ),
    staffPayments: round2(
      (staffPayments ?? [])
        .filter((r) => r.payment_type !== "deduction")
        .reduce((s, r) => s + parseAmount(r.amount), 0)
    ),
    breakdown,
  };
}

export async function getMonthlyReport(
  startDate: string,
  endDate: string
): Promise<DailyReport> {
  return getDailyReport(startDate, endDate);
}

export async function getYearlyReport(year: number): Promise<YearlyReport> {
  const supabase = await createClient();
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, transaction_type, transaction_date")
    .gte("transaction_date", start)
    .lte("transaction_date", end);

  const byMonth: Record<string, { income: number; expense: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, "0")}`;
    byMonth[key] = { income: 0, expense: 0 };
  }

  for (const row of transactions ?? []) {
    const key = row.transaction_date.slice(0, 7);
    if (!byMonth[key]) continue;
    const amount = parseAmount(row.amount);
    if (row.transaction_type === "income") byMonth[key].income += amount;
    else byMonth[key].expense += amount;
  }

  const months = Object.entries(byMonth).map(([key, values]) => {
    const d = new Date(`${key}-01`);
    return {
      key,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      income: round2(values.income),
      expense: round2(values.expense),
      net: round2(values.income - values.expense),
    };
  });

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpense = months.reduce((s, m) => s + m.expense, 0);

  return {
    year,
    months,
    totalIncome: round2(totalIncome),
    totalExpense: round2(totalExpense),
    net: round2(totalIncome - totalExpense),
  };
}

export async function getGstReport(
  startDate: string,
  endDate: string
): Promise<GstReport> {
  const supabase = await createClient();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("gst_percent, taxable_amount, gst_amount, total_amount")
    .eq("is_deleted", false)
    .gte("invoice_date", startDate)
    .lte("invoice_date", endDate);

  const slabMap: Record<number, GstSlabRow> = {};

  for (const inv of invoices ?? []) {
    const pct = parseAmount(inv.gst_percent);
    if (!slabMap[pct]) {
      slabMap[pct] = {
        gstPercent: pct,
        taxableAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
        invoiceCount: 0,
      };
    }
    slabMap[pct].taxableAmount += parseAmount(inv.taxable_amount);
    slabMap[pct].gstAmount += parseAmount(inv.gst_amount);
    slabMap[pct].totalAmount += parseAmount(inv.total_amount);
    slabMap[pct].invoiceCount += 1;
  }

  const slabs = Object.values(slabMap)
    .map((s) => ({
      ...s,
      taxableAmount: round2(s.taxableAmount),
      gstAmount: round2(s.gstAmount),
      totalAmount: round2(s.totalAmount),
    }))
    .sort((a, b) => a.gstPercent - b.gstPercent);

  return {
    slabs,
    totalTaxable: round2(slabs.reduce((s, r) => s + r.taxableAmount, 0)),
    totalGst: round2(slabs.reduce((s, r) => s + r.gstAmount, 0)),
    totalAmount: round2(slabs.reduce((s, r) => s + r.totalAmount, 0)),
  };
}

export async function getInvoiceReport(
  startDate: string,
  endDate: string
): Promise<InvoiceReportRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, invoice_date, vehicle_number, total_amount, cash_amount, bank_amount, credit_amount, gst_percent, gst_amount, clients(name)"
    )
    .eq("is_deleted", false)
    .gte("invoice_date", startDate)
    .lte("invoice_date", endDate)
    .order("invoice_date", { ascending: false });

  type Raw = {
    id: string;
    invoice_number: string;
    invoice_date: string;
    vehicle_number: string | null;
    total_amount: number;
    cash_amount: number;
    bank_amount: number;
    credit_amount: number;
    gst_percent: number;
    gst_amount: number;
    clients: { name: string } | null;
  };

  return ((data as unknown as Raw[]) ?? []).map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    clientName: row.clients?.name ?? "Unknown",
    vehicleNumber: row.vehicle_number,
    totalAmount: parseAmount(row.total_amount),
    cashAmount: parseAmount(row.cash_amount),
    bankAmount: parseAmount(row.bank_amount),
    creditAmount: parseAmount(row.credit_amount),
    gstPercent: parseAmount(row.gst_percent),
    gstAmount: parseAmount(row.gst_amount),
  }));
}

export async function getIncomeExpenseReport(
  startDate: string,
  endDate: string
): Promise<ParticularRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transactions")
    .select("particular, amount, transaction_type")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate);

  const map: Record<string, { income: number; expense: number; count: number }> =
    {};

  for (const row of data ?? []) {
    const key = row.particular?.trim() || "Unnamed";
    if (!map[key]) map[key] = { income: 0, expense: 0, count: 0 };
    const amount = parseAmount(row.amount);
    map[key].count += 1;
    if (row.transaction_type === "income") map[key].income += amount;
    else map[key].expense += amount;
  }

  return Object.entries(map)
    .map(([particular, values]) => ({
      particular,
      income: round2(values.income),
      expense: round2(values.expense),
      net: round2(values.income - values.expense),
      count: values.count,
    }))
    .sort((a, b) => b.expense + b.income - (a.expense + a.income));
}

export async function getExpenseReport(
  startDate: string,
  endDate: string
): Promise<ExpenseReportRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transactions")
    .select("id, particular, amount, payment_mode, transaction_date, remark, bank_accounts(bank_name)")
    .eq("transaction_type", "expense")
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: false });

  type Raw = {
    id: string;
    particular: string;
    amount: number;
    payment_mode: string;
    transaction_date: string;
    remark: string | null;
    bank_accounts: { bank_name: string } | null;
  };

  return ((data as unknown as Raw[]) ?? []).map((row) => ({
    id: row.id,
    date: row.transaction_date,
    particular: row.particular,
    amount: parseAmount(row.amount),
    paymentMode: row.payment_mode,
    bankName: row.bank_accounts?.bank_name ?? null,
    remark: row.remark,
  }));
}

const ROJMEL_CATEGORY: Record<string, string> = {
  client: "Customer",
  supplier: "Supplier",
  staff: "Staff",
  bank: "Bank",
  expense: "Income/Expense",
};

const ROJMEL_REF: Record<string, string> = {
  invoice: "Invoice",
  payment: "Payment",
  advance: "Advance",
  salary: "Salary",
  expense: "Expense",
  opening_balance: "Opening",
  purchase: "Supplier bill",
  transfer: "Transfer",
  bank_transaction: "Bank Tx",
  salary_deposit: "Salary deposit",
  staff_payment: "Staff payment",
};

export async function getRojmelReport(
  startDate: string,
  endDate: string
): Promise<RojmelRow[]> {
  const supabase = await createClient();

  const { data: openingRows } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount")
    .lt("entry_date", startDate);

  let opening = 0;
  for (const row of openingRows ?? []) {
    const amount = parseAmount(row.amount);
    if (row.entry_type === "credit") opening += amount;
    else opening -= amount;
  }
  opening = round2(opening);

  const { data } = await supabase
    .from("ledger_entries")
    .select("*")
    .gte("entry_date", startDate)
    .lte("entry_date", endDate)
    .order("entry_date", { ascending: true })
    .order("created_at", { ascending: true });

  let balance = opening;
  const lines: RojmelRow[] = [];

  if (opening !== 0) {
    lines.push({
      id: "opening",
      date: startDate,
      category: "Opening",
      remark: "Balance before period",
      debit: opening < 0 ? Math.abs(opening) : 0,
      credit: opening > 0 ? opening : 0,
      balance: opening,
    });
  }

  for (const row of data ?? []) {
    const amount = parseAmount(row.amount);
    const debit = row.entry_type === "debit" ? amount : 0;
    const credit = row.entry_type === "credit" ? amount : 0;
    balance = round2(balance + credit - debit);

    const category =
      ROJMEL_CATEGORY[row.entity_type] ?? row.entity_type;
    const ref = row.reference_type
      ? ROJMEL_REF[row.reference_type] ?? row.reference_type
      : "";
    const remark = row.remark || ref || category;

    lines.push({
      id: row.id,
      date: row.entry_date,
      category: ref ? `${category} · ${ref}` : category,
      remark,
      debit,
      credit,
      balance,
    });
  }

  return lines;
}