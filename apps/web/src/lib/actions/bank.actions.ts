"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  bankTransactionSchema,
  bankTransferSchema,
  createBankSchema,
  updateBankSchema,
} from "@/lib/validations/bank.schema";

function revalidateBankPages(bankId?: string) {
  revalidatePath("/dashboard/banks");
  revalidatePath("/dashboard/banks/transactions");
  revalidatePath("/dashboard/banks/transfer");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
  }
}

export const createBank = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_bank", entityType: "bank" },
})(async (formData, { supabase, me }) => {
  const parsed = createBankSchema.safeParse({
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    ifscCode: formData.get("ifscCode"),
    openingBalance: formData.get("openingBalance"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    bankName,
    accountName,
    accountNumber,
    ifscCode,
    openingBalance,
  } = parsed.data;

  const { data: bank, error } = await supabase
    .from("bank_accounts")
    .insert({
      company_id: me.company_id,
      bank_name: bankName,
      account_name: accountName,
      account_number: accountNumber || null,
      ifsc_code: ifscCode || null,
      opening_balance: openingBalance,
    } as never)
    .select("id")
    .single();

  if (error || !bank) {
    return { success: false, error: error?.message || "Failed to create bank" };
  }

  if (openingBalance > 0) {
    const { error: ledgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "bank",
      entity_id: bank.id,
      entry_type: "credit",
      amount: openingBalance,
      payment_mode: "bank",
      bank_id: bank.id,
      reference_type: "opening_balance",
      reference_id: bank.id,
      remark: "Opening balance",
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: me.id,
    } as never);

    if (ledgerError) {
      return { success: false, error: ledgerError.message };
    }
  }

  revalidateBankPages(bank.id);
  return { success: true };
});

export const updateBank = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_bank", entityType: "bank" },
})(async (formData, { supabase }) => {
  const parsed = updateBankSchema.safeParse({
    bankId: formData.get("bankId"),
    bankName: formData.get("bankName"),
    accountName: formData.get("accountName"),
    accountNumber: formData.get("accountNumber"),
    ifscCode: formData.get("ifscCode"),
    openingBalance: formData.get("openingBalance"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { bankId, bankName, accountName, accountNumber, ifscCode } =
    parsed.data;

  const { error } = await supabase
    .from("bank_accounts")
    .update({
      bank_name: bankName,
      account_name: accountName,
      account_number: accountNumber || null,
      ifsc_code: ifscCode || null,
    } as never)
    .eq("id", bankId);

  if (error) return { success: false, error: error.message };

  revalidateBankPages(bankId);
  return { success: true };
});

export const softDeleteBank = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "soft_delete_bank", entityType: "bank" },
})(async (formData, { supabase }) => {
  const bankId = String(formData.get("bankId") || "");
  if (!bankId) return { success: false, error: "Bank ID required" };

  const { error } = await supabase
    .from("bank_accounts")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", bankId);

  if (error) return { success: false, error: error.message };

  revalidateBankPages(bankId);
  return { success: true };
});

export const recoverBank = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "recover_bank", entityType: "bank" },
})(async (formData, { supabase }) => {
  const bankId = String(formData.get("bankId") || "");
  if (!bankId) return { success: false, error: "Bank ID required" };

  const { error } = await supabase
    .from("bank_accounts")
    .update({
      is_deleted: false,
      deleted_at: null,
    } as never)
    .eq("id", bankId);

  if (error) return { success: false, error: error.message };

  revalidateBankPages(bankId);
  return { success: true };
});

export const recordBankTransaction = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "record_bank_transaction", entityType: "bank" },
})(async (formData, { supabase, me }) => {
  const parsed = bankTransactionSchema.safeParse({
    bankId: formData.get("bankId"),
    transactionType: formData.get("transactionType"),
    amount: formData.get("amount"),
    transactionDate: formData.get("transactionDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { bankId, transactionType, amount, transactionDate, remark } =
    parsed.data;

  const { data: transaction, error } = await supabase
    .from("bank_transactions")
    .insert({
      company_id: me.company_id,
      bank_id: bankId,
      transaction_type: transactionType,
      amount,
      transaction_date: transactionDate,
      remark: remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !transaction) {
    return {
      success: false,
      error: error?.message || "Failed to record bank transaction",
    };
  }

  const ledgerRemark =
    remark ||
    (transactionType === "deposit" ? "Bank deposit" : "Bank withdrawal");

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "bank",
    entity_id: bankId,
    entry_type: transactionType === "deposit" ? "credit" : "debit",
    amount,
    payment_mode: "bank",
    bank_id: bankId,
    reference_type: "bank_transaction",
    reference_id: transaction.id,
    remark: ledgerRemark,
    entry_date: transactionDate,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateBankPages(bankId);
  return { success: true };
});

export const recordBankTransfer = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "record_bank_transfer", entityType: "bank" },
})(async (formData, { supabase, me }) => {
  const parsed = bankTransferSchema.safeParse({
    fromBankId: formData.get("fromBankId"),
    toBankId: formData.get("toBankId"),
    amount: formData.get("amount"),
    transferDate: formData.get("transferDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { fromBankId, toBankId, amount, transferDate, remark } = parsed.data;
  const transferRemark = remark || "Bank to bank transfer";

  const { data: transfer, error } = await supabase
    .from("bank_transfers")
    .insert({
      company_id: me.company_id,
      from_bank_id: fromBankId,
      to_bank_id: toBankId,
      amount,
      transfer_date: transferDate,
      remark: remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !transfer) {
    return {
      success: false,
      error: error?.message || "Failed to record bank transfer",
    };
  }

  const { error: withdrawError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "bank",
    entity_id: fromBankId,
    entry_type: "debit",
    amount,
    payment_mode: "bank",
    bank_id: fromBankId,
    reference_type: "transfer",
    reference_id: transfer.id,
    remark: `${transferRemark} — sent`,
    entry_date: transferDate,
    created_by: me.id,
  } as never);

  if (withdrawError) {
    return { success: false, error: withdrawError.message };
  }

  const { error: depositError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "bank",
    entity_id: toBankId,
    entry_type: "credit",
    amount,
    payment_mode: "bank",
    bank_id: toBankId,
    reference_type: "transfer",
    reference_id: transfer.id,
    remark: `${transferRemark} — received`,
    entry_date: transferDate,
    created_by: me.id,
  } as never);

  if (depositError) {
    return { success: false, error: depositError.message };
  }

  revalidateBankPages(fromBankId);
  revalidateBankPages(toBankId);
  return { success: true };
});