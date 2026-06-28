"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import { generalEntrySchema } from "@/lib/validations/general-entry.schema";

function revalidateGeneralEntryPages(bankId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/daily-report");
  revalidatePath("/dashboard/cash-book");
  revalidatePath("/dashboard/bank-book");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard/transactions");
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
    revalidatePath("/dashboard/banks");
  }
}

function bankModeLabel(subMode: string | null | undefined) {
  if (subMode === "upi") return "UPI";
  if (subMode === "net_banking") return "Net banking";
  return "bank";
}

export const createGeneralEntry = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_general_entry", entityType: "transaction" },
})(async (formData, { supabase, me }) => {
  const parsed = generalEntrySchema.safeParse({
    direction: formData.get("direction"),
    paymentMode: formData.get("paymentMode"),
    bankSubMode: formData.get("bankSubMode"),
    entryKind: formData.get("entryKind"),
    partySide: formData.get("partySide"),
    partyId: formData.get("partyId"),
    amount: formData.get("amount"),
    entryDate: formData.get("entryDate"),
    remark: formData.get("remark"),
    particular: formData.get("particular"),
    bankId: formData.get("bankId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const bankSubMode =
    data.paymentMode === "bank" && data.bankSubMode ? data.bankSubMode : null;
  const bankId = data.bankId?.trim() ? data.bankId : null;
  const isReceipt = data.direction === "receipt";

  if (data.entryKind === "party" && data.partyId && data.partySide === "client") {
    const entryCategory = "receipt";
    const modeLabel = data.paymentMode === "cash" ? "cash" : bankModeLabel(bankSubMode);
    const ledgerRemark =
      data.remark?.trim() ||
      `Receipt received (${modeLabel})`;

    const { data: payment, error: paymentError } = await supabase
      .from("client_payments")
      .insert({
        company_id: me.company_id,
        client_id: data.partyId,
        amount: data.amount,
        payment_mode: data.paymentMode,
        bank_sub_mode: bankSubMode,
        bank_id: bankId,
        payment_date: data.entryDate,
        remark: ledgerRemark,
        entry_category: entryCategory,
        created_by: me.id,
      } as never)
      .select("id")
      .single();

    if (paymentError || !payment) {
      return { success: false, error: paymentError?.message || "Failed to record receipt" };
    }

    const { error: ledgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "client",
      entity_id: data.partyId,
      entry_type: "credit",
      amount: data.amount,
      payment_mode: data.paymentMode,
      bank_sub_mode: bankSubMode,
      bank_id: bankId,
      reference_type: "payment",
      reference_id: payment.id,
      remark: ledgerRemark,
      entry_date: data.entryDate,
      entry_category: entryCategory,
      created_by: me.id,
    } as never);

    if (ledgerError) return { success: false, error: ledgerError.message };

    if (data.paymentMode === "bank" && bankId) {
      const { error: bankLedgerError } = await supabase.from("ledger_entries").insert({
        company_id: me.company_id,
        entity_type: "bank",
        entity_id: bankId,
        entry_type: "credit",
        amount: data.amount,
        payment_mode: "bank",
        bank_sub_mode: bankSubMode,
        bank_id: bankId,
        reference_type: "payment",
        reference_id: payment.id,
        remark: ledgerRemark,
        entry_date: data.entryDate,
        entry_category: entryCategory,
        created_by: me.id,
      } as never);

      if (bankLedgerError) {
        return { success: false, error: bankLedgerError.message };
      }
    }

    revalidateGeneralEntryPages(bankId);
    return { success: true };
  }

  if (data.entryKind === "party" && data.partyId && data.partySide === "supplier") {
    const entryCategory = "payment";
    const modeLabel = data.paymentMode === "cash" ? "cash" : bankModeLabel(bankSubMode);
    const ledgerRemark =
      data.remark?.trim() ||
      `Payment made (${modeLabel})`;

    const { data: payment, error: paymentError } = await supabase
      .from("supplier_payments")
      .insert({
        company_id: me.company_id,
        supplier_id: data.partyId,
        amount: data.amount,
        payment_mode: data.paymentMode,
        bank_sub_mode: bankSubMode,
        bank_id: bankId,
        payment_date: data.entryDate,
        remark: ledgerRemark,
        entry_category: entryCategory,
        created_by: me.id,
      } as never)
      .select("id")
      .single();

    if (paymentError || !payment) {
      return { success: false, error: paymentError?.message || "Failed to record payment" };
    }

    const { error: ledgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "supplier",
      entity_id: data.partyId,
      entry_type: "debit",
      amount: data.amount,
      payment_mode: data.paymentMode,
      bank_sub_mode: bankSubMode,
      bank_id: bankId,
      reference_type: "payment",
      reference_id: payment.id,
      remark: ledgerRemark,
      entry_date: data.entryDate,
      entry_category: entryCategory,
      created_by: me.id,
    } as never);

    if (ledgerError) return { success: false, error: ledgerError.message };

    if (data.paymentMode === "bank" && bankId) {
      const { error: bankLedgerError } = await supabase.from("ledger_entries").insert({
        company_id: me.company_id,
        entity_type: "bank",
        entity_id: bankId,
        entry_type: "debit",
        amount: data.amount,
        payment_mode: "bank",
        bank_sub_mode: bankSubMode,
        bank_id: bankId,
        reference_type: "payment",
        reference_id: payment.id,
        remark: ledgerRemark,
        entry_date: data.entryDate,
        entry_category: entryCategory,
        created_by: me.id,
      } as never);

      if (bankLedgerError) {
        return { success: false, error: bankLedgerError.message };
      }
    }

    revalidateGeneralEntryPages(bankId);
    return { success: true };
  }

  const entryCategory = isReceipt ? "indirect_income" : "indirect_expense";
  const transactionType = isReceipt ? "income" : "expense";
  const particular = data.particular!.trim();
  const modeLabel = data.paymentMode === "cash" ? "cash" : bankModeLabel(bankSubMode);
  const ledgerRemark = data.remark?.trim() || `${particular} (${modeLabel})`;

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      company_id: me.company_id,
      particular,
      amount: data.amount,
      transaction_type: transactionType,
      payment_mode: data.paymentMode,
      bank_sub_mode: bankSubMode,
      bank_id: bankId,
      transaction_date: data.entryDate,
      remark: ledgerRemark,
      entry_category: entryCategory,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !transaction) {
    return { success: false, error: error?.message || "Failed to record entry" };
  }

  const expenseEntryType = isReceipt ? "credit" : "debit";
  const bankEntryType = isReceipt ? "credit" : "debit";

  const { error: expenseLedgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "expense",
    entity_id: transaction.id,
    entry_type: expenseEntryType,
    amount: data.amount,
    payment_mode: data.paymentMode,
    bank_sub_mode: bankSubMode,
    bank_id: bankId,
    reference_type: "expense",
    reference_id: transaction.id,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: entryCategory,
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
      bank_sub_mode: bankSubMode,
      bank_id: bankId,
      reference_type: "expense",
      reference_id: transaction.id,
      remark: ledgerRemark,
      entry_date: data.entryDate,
      entry_category: entryCategory,
      created_by: me.id,
    } as never);

    if (bankLedgerError) {
      return { success: false, error: bankLedgerError.message };
    }
  }

  revalidateGeneralEntryPages(bankId);
  return { success: true };
});