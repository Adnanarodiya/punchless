import { createClient } from "@/lib/supabase/server";
import {
  SYSTEM_EXPENSE_SUPPLIER_NAME,
  SYSTEM_INCOME_CLIENT_NAME,
} from "@/lib/constants/system-parties";

export type SystemLedgerNavLink = {
  label: string;
  href: string;
};

export async function getSystemLedgerNavLinks(): Promise<SystemLedgerNavLink[]> {
  const supabase = await createClient();

  const [{ data: income }, { data: expense }] = await Promise.all([
    supabase
      .from("clients")
      .select("id")
      .eq("name", SYSTEM_INCOME_CLIENT_NAME)
      .eq("is_deleted", false)
      .maybeSingle(),
    supabase
      .from("suppliers")
      .select("id")
      .eq("name", SYSTEM_EXPENSE_SUPPLIER_NAME)
      .eq("is_deleted", false)
      .maybeSingle(),
  ]);

  const links: SystemLedgerNavLink[] = [];

  if (income?.id) {
    links.push({
      label: "INCOME statement",
      href: `/dashboard/customers/${income.id}/statement`,
    });
  }

  if (expense?.id) {
    links.push({
      label: "EXPENSE statement",
      href: `/dashboard/suppliers/${expense.id}/statement`,
    });
  }

  return links;
}