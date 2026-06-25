"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { createTransactionSchema } from "@/lib/validations/transaction.schema";

function revalidateTransactionPages(bankId?: string | null) {
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
  }
  revalidatePath("/dashboard/banks");
}

export const createTransaction = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_transaction", entityType: "transaction" },
})(async (formData, { supabase, me }) => {
  const parsed = createTransactionSchema.safeParse({
    particular: formData.get("particular"),
    amount: formData.get("amount"),
    transactionType: formData.get("transactionType"),
    paymentMode: formData.get("paymentMode"),
    bankId: formData.get("bankId"),
    transactionDate: formData.get("transactionDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const bankId = data.bankId?.trim() ? data.bankId : null;

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      company_id: me.company_id,
      particular: data.particular,
      amount: data.amount,
      transaction_type: data.transactionType,
      payment_mode: data.paymentMode,
      bank_id: bankId,
      transaction_date: data.transactionDate,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !transaction) {
    return {
      success: false,
      error: error?.message || "Failed to record transaction",
    };
  }

  const isIncome = data.transactionType === "income";
  const expenseEntryType = isIncome ? "credit" : "debit";
  const bankEntryType = isIncome ? "credit" : "debit";
  const ledgerRemark =
    data.remark ||
    `${isIncome ? "Income" : "Expense"}: ${data.particular} (${data.paymentMode})`;

  const { error: expenseLedgerError } = await supabase
    .from("ledger_entries")
    .insert({
      company_id: me.company_id,
      entity_type: "expense",
      entity_id: transaction.id,
      entry_type: expenseEntryType,
      amount: data.amount,
      payment_mode: data.paymentMode,
      bank_id: bankId,
      reference_type: "expense",
      reference_id: transaction.id,
      remark: ledgerRemark,
      entry_date: data.transactionDate,
      created_by: me.id,
    } as never);

  if (expenseLedgerError) {
    return { success: false, error: expenseLedgerError.message };
  }

  if (data.paymentMode === "bank" && bankId) {
    const { error: bankLedgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "bank",
      entity_id: bankId,
      entry_type: bankEntryType,
      amount: data.amount,
      payment_mode: "bank",
      bank_id: bankId,
      reference_type: "expense",
      reference_id: transaction.id,
      remark: ledgerRemark,
      entry_date: data.transactionDate,
      created_by: me.id,
    } as never);

    if (bankLedgerError) {
      return { success: false, error: bankLedgerError.message };
    }
  }

  revalidateTransactionPages(bankId);
  return { success: true };
});

export const deleteTransaction = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_transaction", entityType: "transaction" },
})(async (formData, { supabase }) => {
  const transactionId = String(formData.get("transactionId") || "");
  if (!transactionId) {
    return { success: false, error: "Transaction ID required" };
  }

  const { data: existing } = await supabase
    .from("transactions")
    .select("bank_id")
    .eq("id", transactionId)
    .single();

  const { error: ledgerError } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("reference_id", transactionId)
    .eq("reference_type", "expense");

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId);

  if (error) return { success: false, error: error.message };

  revalidateTransactionPages(existing?.bank_id ?? null);
  return { success: true };
});