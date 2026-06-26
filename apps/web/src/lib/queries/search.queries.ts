import { createClient } from "@/lib/supabase/server";

export type SearchResultItem = {
  id: string;
  type: "client" | "employee" | "invoice" | "supplier" | "job" | "purchase";
  label: string;
  subtitle: string;
  href: string;
};

const TYPE_LIMIT = 5;

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [
    clients,
    employees,
    invoicesByNumber,
    matchingClients,
    suppliers,
    matchingSuppliers,
    purchasesByNumber,
    jobs,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, alias, contact")
      .eq("is_deleted", false)
      .or(`name.ilike.${pattern},alias.ilike.${pattern},contact.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
    supabase
      .from("users")
      .select("id, full_name, email, phone")
      .eq("role", "employee")
      .eq("is_active", true)
      .or(`full_name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
    supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, clients(name)")
      .eq("is_deleted", false)
      .ilike("invoice_number", pattern)
      .limit(TYPE_LIMIT),
    supabase
      .from("clients")
      .select("id, name")
      .eq("is_deleted", false)
      .or(`name.ilike.${pattern},alias.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("suppliers")
      .select("id, name, alias, contact")
      .eq("is_deleted", false)
      .or(`name.ilike.${pattern},alias.ilike.${pattern},contact.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
    supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_deleted", false)
      .or(`name.ilike.${pattern},alias.ilike.${pattern}`)
      .limit(10),
    supabase
      .from("purchase_invoices")
      .select("id, invoice_number, total_amount, invoice_type, suppliers(name)")
      .eq("is_deleted", false)
      .or(`invoice_number.ilike.${pattern},remark.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
    supabase
      .from("jobs")
      .select("id, title, customer_name, status")
      .or(`title.ilike.${pattern},customer_name.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
  ]);

  type InvoiceRow = {
    id: string;
    invoice_number: string | null;
    total_amount: number | null;
    clients: { name: string } | null;
  };

  type PurchaseRow = {
    id: string;
    invoice_number: string | null;
    total_amount: number | null;
    invoice_type: string;
    suppliers: { name: string } | null;
  };

  const clientIds = (matchingClients.data ?? []).map((c) => c.id);
  let invoicesByClient: InvoiceRow[] = [];

  if (clientIds.length > 0) {
    const { data } = await supabase
      .from("invoices")
      .select("id, invoice_number, total_amount, clients(name)")
      .eq("is_deleted", false)
      .in("client_id", clientIds)
      .limit(TYPE_LIMIT);
    invoicesByClient = (data ?? []) as InvoiceRow[];
  }

  const supplierIds = (matchingSuppliers.data ?? []).map((s) => s.id);
  let purchasesBySupplier: PurchaseRow[] = [];

  if (supplierIds.length > 0) {
    const { data } = await supabase
      .from("purchase_invoices")
      .select("id, invoice_number, total_amount, invoice_type, suppliers(name)")
      .eq("is_deleted", false)
      .in("supplier_id", supplierIds)
      .limit(TYPE_LIMIT);
    purchasesBySupplier = (data ?? []) as PurchaseRow[];
  }

  const invoiceRows = dedupeById([
    ...((invoicesByNumber.data ?? []) as InvoiceRow[]),
    ...invoicesByClient,
  ]).slice(0, TYPE_LIMIT);

  const purchaseRows = dedupeById([
    ...((purchasesByNumber.data ?? []) as PurchaseRow[]),
    ...purchasesBySupplier,
  ]).slice(0, TYPE_LIMIT);

  const results: SearchResultItem[] = [];

  for (const row of clients.data ?? []) {
    const r = row as { id: string; name: string; alias: string | null; contact: string | null };
    const meta = [r.alias, r.contact].filter(Boolean).join(" · ");
    results.push({
      id: `${r.id}-manage`,
      type: "client",
      label: r.name,
      subtitle: meta ? `${meta} · Clients — pay or invoice` : "Clients — pay or invoice",
      href: `/dashboard/clients?client=${r.id}`,
    });
    results.push({
      id: `${r.id}-statement`,
      type: "client",
      label: r.name,
      subtitle: "Ledger statement",
      href: `/dashboard/clients/${r.id}/statement`,
    });
  }

  for (const row of employees.data ?? []) {
    const r = row as { id: string; full_name: string; email: string; phone: string | null };
    results.push({
      id: r.id,
      type: "employee",
      label: r.full_name,
      subtitle: `${r.email} · Staff statement`,
      href: `/dashboard/employees/${r.id}/statement`,
    });
  }

  for (const row of invoiceRows) {
    results.push({
      id: row.id,
      type: "invoice",
      label: row.invoice_number ? `Invoice ${row.invoice_number}` : "Invoice",
      subtitle: row.clients?.name
        ? `${row.clients.name} · View invoice`
        : "View invoice",
      href: `/dashboard/invoices/${row.id}`,
    });
  }

  for (const row of suppliers.data ?? []) {
    const r = row as { id: string; name: string; alias: string | null; contact: string | null };
    const meta = [r.alias, r.contact].filter(Boolean).join(" · ");
    results.push({
      id: `${r.id}-manage`,
      type: "supplier",
      label: r.name,
      subtitle: meta ? `${meta} · Suppliers — pay or edit` : "Suppliers — pay or edit",
      href: `/dashboard/suppliers?supplier=${r.id}`,
    });
    results.push({
      id: `${r.id}-statement`,
      type: "supplier",
      label: r.name,
      subtitle: "Ledger statement",
      href: `/dashboard/suppliers/${r.id}/statement`,
    });
  }

  for (const row of purchaseRows) {
    const typeLabel = row.invoice_type === "purchase" ? "Purchase" : "Sales";
    results.push({
      id: row.id,
      type: "purchase",
      label: row.invoice_number
        ? `${typeLabel} ${row.invoice_number}`
        : typeLabel,
      subtitle: row.suppliers?.name
        ? `${row.suppliers.name} · Open purchase`
        : "Open purchase invoice",
      href: `/dashboard/purchases?purchase=${row.id}`,
    });
  }

  for (const row of jobs.data ?? []) {
    const r = row as {
      id: string;
      title: string;
      customer_name: string | null;
      status: string | null;
    };
    results.push({
      id: r.id,
      type: "job",
      label: r.title,
      subtitle: [r.customer_name, r.status].filter(Boolean).join(" · ") || "Open job",
      href: `/dashboard/jobs/${r.id}`,
    });
  }

  return results;
}