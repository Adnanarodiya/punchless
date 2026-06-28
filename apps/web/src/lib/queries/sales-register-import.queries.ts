import { createClient } from "@/lib/supabase/server";

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

  const { data } = await supabase
    .from("sales_register_imports")
    .select("entry_date, file_name, uploaded_at, invoice_count, total_amount")
    .eq("company_id", companyId)
    .order("entry_date", { ascending: false });

  return ((data ?? []) as Array<{
    entry_date: string;
    file_name: string;
    uploaded_at: string;
    invoice_count: number;
    total_amount: number;
  }>).map((row) => ({
    entryDate: row.entry_date,
    label: formatEntryLabel(row.entry_date),
    fileName: row.file_name,
    uploadedAt: row.uploaded_at,
    invoiceCount: row.invoice_count,
    totalAmount: Number(row.total_amount),
  }));
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

  return {
    entryDate,
    fileName: meta?.file_name ?? null,
    uploadedAt: meta?.uploaded_at ?? null,
    totalBilling: Math.round(totalBilling * 100) / 100,
    invoiceCount: lines.length || meta?.invoice_count || 0,
    lines,
  };
}