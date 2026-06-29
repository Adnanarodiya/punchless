import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@punchless/types/database.types";

type BankSubMode = Database["public"]["Enums"]["bank_sub_mode"];
type EntryCategory = Database["public"]["Enums"]["entry_category"];

export type BankLedgerParams = {
  companyId: string;
  bankId: string;
  entryType: "credit" | "debit";
  amount: number;
  referenceType: string;
  referenceId: string;
  remark: string;
  entryDate: string;
  entryCategory?: EntryCategory | null;
  bankSubMode?: BankSubMode | null;
  createdBy: string;
};

export function normalizeBankSubMode(
  subMode: string | null | undefined
): BankSubMode | null {
  if (subMode === "upi" || subMode === "net_banking") return subMode;
  return null;
}

export function bankModeLabel(subMode: string | null | undefined) {
  if (subMode === "upi") return "UPI";
  if (subMode === "net_banking") return "Net banking";
  return "bank";
}

export async function insertBankLedgerEntry(
  supabase: SupabaseClient<Database>,
  params: BankLedgerParams
) {
  return supabase.from("ledger_entries").insert({
    company_id: params.companyId,
    entity_type: "bank",
    entity_id: params.bankId,
    entry_type: params.entryType,
    amount: params.amount,
    payment_mode: "bank",
    bank_sub_mode: params.bankSubMode ?? null,
    bank_id: params.bankId,
    reference_type: params.referenceType,
    reference_id: params.referenceId,
    remark: params.remark,
    entry_date: params.entryDate,
    entry_category: params.entryCategory ?? null,
    created_by: params.createdBy,
  } as never);
}

export async function deleteBankLedgerByReference(
  supabase: SupabaseClient<Database>,
  referenceId: string,
  referenceType = "payment"
) {
  return supabase
    .from("ledger_entries")
    .delete()
    .eq("entity_type", "bank")
    .eq("reference_type", referenceType)
    .eq("reference_id", referenceId);
}