import { createClient } from "@/lib/supabase/server";

const IMPORT_REMARK = "Imported from Sales Register";

export type SalesRegisterImportSummary = {
  entryDate: string;
  label: string;
  fileName: string;
  uploadedAt: string;
  invoiceCount: number;
  totalAmount: number;
};

export type TodaysEntryLine = {
  id: string;
  invoiceNumber: string | null;
  clientName: string;
  gstNumber: string | null;
  totalAmount: number;
  creditAmount: number;
  gstPercent: number;
};

export type TodaysEntryReport = {
  entryDate: string;
  fileName: string | null;
  uploadedAt: string | null;
  totalBilling: number;
  invoiceCount: number;
  lines: TodaysEntryLine[];
};

function formatEntryLabel(entryDate: string) {
  const [year, month, day] = entryDate.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function getCompanyId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, companyId: null as string | null };

  const { data: profile } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", user.id)
    .single();

  return {
    supabase,
    companyId: (profile as { company_id: string } | null)?.company_id ?? null,
  };
}

export async function getSalesRegisterImportDays(): Promise<SalesRegisterImportSummary[]> {
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) return [];

  const [{ data: invoices }, { data: imports }] = await Promise.all([
    supabase
      .from("invoices")
      .select("invoice_date, total_amount")
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .eq("remark", IMPORT_REMARK),
    supabase
      .from("sales_register_imports")
      .select("entry_date, file_name, uploaded_at, invoice_count, total_amount")
      .eq("company_id", companyId)
      .order("entry_date", { ascending: false }),
  ]);

  const byDate = new Map<string, { count: number; total: number }>();
  for (const row of (invoices ?? []) as Array<{
    invoice_date: string;
    total_amount: number;
  }>) {
    const bucket = byDate.get(row.invoice_date) ?? { count: 0, total: 0 };
    bucket.count += 1;
    bucket.total += Number(row.total_amount);
    byDate.set(row.invoice_date, bucket);
  }

  const importDates = new Set(
    ((imports ?? []) as Array<{ entry_date: string }>).map((row) => row.entry_date)
  );
  const orphanDates = [...importDates].filter((date) => !byDate.has(date));
  if (orphanDates.length > 0) {
    await supabase
      .from("sales_register_imports")
      .delete()
      .eq("company_id", companyId)
      .in("entry_date", orphanDates);
  }

  const metaByDate = new Map(
    ((imports ?? []) as Array<{
      entry_date: string;
      file_name: string;
      uploaded_at: string;
    }>).map((row) => [row.entry_date, row])
  );

  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([entryDate, stats]) => {
      const meta = metaByDate.get(entryDate);
      return {
        entryDate,
        label: formatEntryLabel(entryDate),
        fileName: meta?.file_name ?? "",
        uploadedAt: meta?.uploaded_at ?? "",
        invoiceCount: stats.count,
        totalAmount: Math.round(stats.total * 100) / 100,
      };
    });
}

export async function getTodaysEntryReport(entryDate: string): Promise<TodaysEntryReport> {
  const { supabase, companyId } = await getCompanyId();
  if (!companyId) {
    return {
      entryDate,
      fileName: null,
      uploadedAt: null,
      totalBilling: 0,
      invoiceCount: 0,
      lines: [],
    };
  }

  const [{ data: importMeta }, { data: invoices }] = await Promise.all([
    supabase
      .from("sales_register_imports")
      .select("file_name, uploaded_at, invoice_count, total_amount")
      .eq("company_id", companyId)
      .eq("entry_date", entryDate)
      .maybeSingle(),
    supabase
      .from("invoices")
      .select(
        "id, invoice_number, total_amount, credit_amount, gst_percent, clients(name, gst_number)"
      )
      .eq("company_id", companyId)
      .eq("is_deleted", false)
      .eq("invoice_date", entryDate)
      .eq("remark", "Imported from Sales Register")
      .order("invoice_number", { ascending: true }),
  ]);

  const meta = importMeta as {
    file_name: string;
    uploaded_at: string;
    invoice_count: number;
    total_amount: number;
  } | null;

  const lines: TodaysEntryLine[] = ((invoices ?? []) as Array<{
    id: string;
    invoice_number: string | null;
    total_amount: number;
    credit_amount: number;
    gst_percent: number;
    clients: { name: string; gst_number: string | null } | null;
  }>).map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientName: row.clients?.name ?? "Customer",
    gstNumber: row.clients?.gst_number ?? null,
    totalAmount: Number(row.total_amount),
    creditAmount: Number(row.credit_amount),
    gstPercent: Number(row.gst_percent),
  }));

  const totalBilling = lines.reduce((sum, line) => sum + line.totalAmount, 0);

  if (meta && lines.length === 0) {
    await supabase
      .from("sales_register_imports")
      .delete()
      .eq("company_id", companyId)
      .eq("entry_date", entryDate);
  }

  return {
    entryDate,
    fileName: lines.length > 0 ? (meta?.file_name ?? null) : null,
    uploadedAt: lines.length > 0 ? (meta?.uploaded_at ?? null) : null,
    totalBilling: Math.round(totalBilling * 100) / 100,
    invoiceCount: lines.length,
    lines,
  };
}