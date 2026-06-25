import { createClient } from "@/lib/supabase/server";

export type SearchResultItem = {
  id: string;
  type: "client" | "employee" | "invoice" | "supplier" | "job";
  label: string;
  subtitle: string;
  href: string;
};

const TYPE_LIMIT = 5;

export async function globalSearch(query: string): Promise<SearchResultItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [clients, employees, invoices, suppliers, jobs] = await Promise.all([
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
      .from("suppliers")
      .select("id, name, alias, contact")
      .eq("is_deleted", false)
      .or(`name.ilike.${pattern},alias.ilike.${pattern},contact.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
    supabase
      .from("jobs")
      .select("id, title, customer_name, status")
      .or(`title.ilike.${pattern},customer_name.ilike.${pattern}`)
      .limit(TYPE_LIMIT),
  ]);

  const results: SearchResultItem[] = [];

  for (const row of clients.data ?? []) {
    const r = row as { id: string; name: string; alias: string | null; contact: string | null };
    const meta = [r.alias, r.contact].filter(Boolean).join(" · ");
    results.push({
      id: r.id,
      type: "client",
      label: r.name,
      subtitle: meta ? `${meta} · Statement` : "Open client statement",
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

  for (const row of invoices.data ?? []) {
    const r = row as {
      id: string;
      invoice_number: string | null;
      total_amount: number | null;
      clients: { name: string } | null;
    };
    results.push({
      id: r.id,
      type: "invoice",
      label: r.invoice_number ? `Invoice ${r.invoice_number}` : "Invoice",
      subtitle: r.clients?.name
        ? `${r.clients.name} · View invoice`
        : "View / print invoice",
      href: `/dashboard/invoices/${r.id}/print`,
    });
  }

  for (const row of suppliers.data ?? []) {
    const r = row as { id: string; name: string; alias: string | null; contact: string | null };
    const meta = [r.alias, r.contact].filter(Boolean).join(" · ");
    results.push({
      id: r.id,
      type: "supplier",
      label: r.name,
      subtitle: meta ? `${meta} · Statement` : "Open supplier statement",
      href: `/dashboard/suppliers/${r.id}/statement`,
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
      href: `/dashboard/jobs?job=${r.id}`,
    });
  }

  return results;
}