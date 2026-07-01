import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@punchless/types/database.types";

type Supabase = SupabaseClient<Database>;

export const DISCOUNT_LINKED_PAYMENT_MESSAGE =
  "This payment is part of a discount settlement. Edit or delete it from the journal entry on the statement.";

export async function getDiscountSettlementByPaymentId(
  supabase: Supabase,
  paymentId: string
) {
  const { data } = await supabase
    .from("discount_settlements")
    .select("id")
    .eq("payment_reference_id", paymentId)
    .maybeSingle();

  return data as { id: string } | null;
}

export async function assertPaymentNotDiscountLinked(
  supabase: Supabase,
  paymentId: string
): Promise<string | null> {
  const linked = await getDiscountSettlementByPaymentId(supabase, paymentId);
  if (linked) return DISCOUNT_LINKED_PAYMENT_MESSAGE;
  return null;
}