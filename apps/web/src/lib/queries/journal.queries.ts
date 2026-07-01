import { createClient } from "@/lib/supabase/server";

export type DiscountSettlementDetail = {
  id: string;
  settlement_kind: "given" | "received";
  party_side: "client" | "supplier";
  party_id: string;
  bill_id: string;
  invoice_number: string | null;
  bill_amount: number;
  discount_amount: number;
  payment_amount: number;
  payment_mode: "cash" | "bank";
  bank_sub_mode: "upi" | "net_banking" | null;
  bank_id: string | null;
  entry_date: string;
  remark: string | null;
  payment_reference_id: string | null;
};

export async function getDiscountSettlementById(
  settlementId: string
): Promise<DiscountSettlementDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discount_settlements")
    .select(
      "id, settlement_kind, party_side, party_id, bill_id, invoice_number, bill_amount, discount_amount, payment_amount, payment_mode, bank_sub_mode, bank_id, entry_date, remark, payment_reference_id"
    )
    .eq("id", settlementId)
    .maybeSingle();

  if (!data) return null;

  const row = data as DiscountSettlementDetail;
  return {
    ...row,
    bill_amount: Number(row.bill_amount),
    discount_amount: Number(row.discount_amount),
    payment_amount: Number(row.payment_amount),
  };
}

export async function getDiscountSettlementIdsByPaymentIds(
  paymentIds: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (paymentIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("discount_settlements")
    .select("id, payment_reference_id")
    .in("payment_reference_id", paymentIds);

  for (const row of data ?? []) {
    const paymentId = (row as { payment_reference_id: string | null })
      .payment_reference_id;
    if (paymentId) {
      map.set(paymentId, (row as { id: string }).id);
    }
  }

  return map;
}