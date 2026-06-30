import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@punchless/types/database.types";
import { getBillReference } from "@/lib/queries/party-bill.queries";
import {
  buildAgainstBillRemark,
  type SettlementType,
} from "@/lib/validations/settlement.schema";

type Supabase = SupabaseClient<Database>;

export async function resolveSettlementRemark(options: {
  settlementType: SettlementType;
  billIds?: string[];
  partySide: "client" | "supplier";
  remark?: string;
}): Promise<{ remark: string; billIds: string[] }> {
  const ids = options.billIds?.filter(Boolean) ?? [];
  if (options.settlementType !== "against_bill" || ids.length === 0) {
    return { remark: options.remark?.trim() || "", billIds: [] };
  }

  const references = await Promise.all(
    ids.map((id) => getBillReference(id, options.partySide))
  );
  const invoiceNumbers = references
    .map((ref) => ref?.invoiceNumber)
    .filter((no): no is string => Boolean(no));

  return {
    remark: buildAgainstBillRemark(options.remark, invoiceNumbers),
    billIds: ids,
  };
}

export async function applyClientBillSettlement(
  supabase: Supabase,
  options: {
    billIds: string[];
    amount: number;
  }
) {
  let remaining = options.amount;

  for (const billId of options.billIds) {
    if (remaining <= 0.01) break;

    const { data: invoice } = await supabase
      .from("invoices")
      .select("credit_amount")
      .eq("id", billId)
      .maybeSingle();

    if (!invoice) continue;

    const currentCredit = Number(invoice.credit_amount) || 0;
    if (currentCredit <= 0.01) continue;

    const applied = Math.min(remaining, currentCredit);
    const nextCredit = Math.max(
      0,
      Math.round((currentCredit - applied) * 100) / 100
    );

    await supabase
      .from("invoices")
      .update({ credit_amount: nextCredit } as never)
      .eq("id", billId);

    remaining = Math.round((remaining - applied) * 100) / 100;
  }
}