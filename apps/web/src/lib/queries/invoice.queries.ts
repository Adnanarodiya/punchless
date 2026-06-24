import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type LineItemRow = Database["public"]["Tables"]["invoice_line_items"]["Row"];

export type InvoiceWithDetails = InvoiceRow & {
  client_name: string;
  client_alias: string | null;
  client_address: string | null;
  client_gst_number: string | null;
  job_title: string | null;
  line_items: LineItemRow[];
};

export async function getInvoices(
  options: { includeDeleted?: boolean } = {}
): Promise<InvoiceWithDetails[]> {
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("*, clients(name, alias, address, gst_number), jobs(title)")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!options.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data } = await query;

  type RawRow = InvoiceRow & {
    clients: {
      name: string;
      alias: string | null;
      address: string | null;
      gst_number: string | null;
    } | null;
    jobs: { title: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];
  const invoiceIds = rows.map((row) => row.id);

  const lineItemsByInvoice: Record<string, LineItemRow[]> = {};
  if (invoiceIds.length > 0) {
    const { data: lineItems } = await supabase
      .from("invoice_line_items")
      .select("*")
      .in("invoice_id", invoiceIds)
      .order("sort_order", { ascending: true });

    for (const item of (lineItems as LineItemRow[]) ?? []) {
      if (!lineItemsByInvoice[item.invoice_id]) {
        lineItemsByInvoice[item.invoice_id] = [];
      }
      lineItemsByInvoice[item.invoice_id].push(item);
    }
  }

  return rows.map((row) => ({
    ...row,
    client_name: row.clients?.name ?? "Unknown",
    client_alias: row.clients?.alias ?? null,
    client_address: row.clients?.address ?? null,
    client_gst_number: row.clients?.gst_number ?? null,
    job_title: row.jobs?.title ?? null,
    line_items: lineItemsByInvoice[row.id] ?? [],
  }));
}

export async function getInvoiceById(
  invoiceId: string
): Promise<InvoiceWithDetails | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name, alias, address, gst_number), jobs(title)")
    .eq("id", invoiceId)
    .single();

  if (!data) return null;

  const { data: lineItems } = await supabase
    .from("invoice_line_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });

  type RawRow = InvoiceRow & {
    clients: {
      name: string;
      alias: string | null;
      address: string | null;
      gst_number: string | null;
    } | null;
    jobs: { title: string } | null;
  };

  const invoice = data as unknown as RawRow;

  return {
    ...invoice,
    client_name: invoice.clients?.name ?? "Unknown",
    client_alias: invoice.clients?.alias ?? null,
    client_address: invoice.clients?.address ?? null,
    client_gst_number: invoice.clients?.gst_number ?? null,
    job_title: invoice.jobs?.title ?? null,
    line_items: (lineItems as LineItemRow[]) ?? [],
  };
}

export async function getNextInvoiceNumber(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true });

  const seq = (count ?? 0) + 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}