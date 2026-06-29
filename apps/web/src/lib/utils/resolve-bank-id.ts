import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@punchless/types/database.types";

/** Use explicit bank id, or auto-pick when the company has exactly one active bank. */
export async function resolveBankIdForPayment(
  supabase: SupabaseClient<Database>,
  paymentMode: string,
  bankId: string | null | undefined
): Promise<string | null> {
  if (paymentMode !== "bank") return null;

  const trimmed = bankId?.trim();
  if (trimmed) return trimmed;

  const { data } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("is_deleted", false);

  const banks = data ?? [];
  if (banks.length === 1) return banks[0].id as string;

  return null;
}