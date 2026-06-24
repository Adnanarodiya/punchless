import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type PurchaseRow = Database["public"]["Tables"]["purchase_invoices"]["Row"];

export type PurchaseWithSupplier = PurchaseRow & {
  supplier_name: string;
  supplier_alias: string | null;
};

export async function getPurchaseInvoices(
  options: { includeDeleted?: boolean } = {}
): Promise<PurchaseWithSupplier[]> {
  const supabase = await createClient();

  let query = supabase
    .from("purchase_invoices")
    .select("*, suppliers(name, alias)")
    .order("invoice_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (!options.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data } = await query;

  type RawRow = PurchaseRow & {
    suppliers: { name: string; alias: string | null } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((row) => ({
    ...row,
    supplier_name: row.suppliers?.name ?? "Unknown",
    supplier_alias: row.suppliers?.alias ?? null,
  }));
}