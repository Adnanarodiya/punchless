"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import {
  bankModeLabel,
  deleteBankLedgerByReference,
  insertBankLedgerEntry,
  normalizeBankSubMode,
} from "@/lib/utils/bank-ledger";
import { resolveBankIdForPayment } from "@/lib/utils/resolve-bank-id";
import { resolveSettlementRemark } from "@/lib/utils/settlement";
import {
  createSupplierSchema,
  deleteSupplierPaymentSchema,
  paySupplierSchema,
  quickSupplierSchema,
  updateSupplierPaymentSchema,
  updateSupplierSchema,
} from "@/lib/validations/supplier.schema";
import { parseBillIdsFromForm } from "@/lib/validations/settlement.schema";
import {
  formatSystemExpenseRemark,
  isReservedPartyName,
  SYSTEM_EXPENSE_SUPPLIER_NAME,
} from "@/lib/constants/system-parties";

async function getSupplierSystemFlags(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  supplierId: string
) {
  const { data } = await supabase
    .from("suppliers")
    .select("name, is_system")
    .eq("id", supplierId)
    .maybeSingle();

  if (!data) return null;

  const row = data as { name: string; is_system: boolean | null };
  return {
    isSystemExpense:
      Boolean(row.is_system) || row.name === SYSTEM_EXPENSE_SUPPLIER_NAME,
    name: row.name,
  };
}

function revalidateSupplierPages(supplierId?: string, bankId?: string | null) {
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cash-book");
  revalidatePath("/dashboard/bank-book");
  revalidatePath("/dashboard/daily-report");
  revalidatePath("/dashboard/banks");
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
  }
  if (supplierId) {
    revalidatePath(`/dashboard/suppliers/${supplierId}/statement`);
  }
}

export const createSupplier = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_supplier", entityType: "supplier" },
})(async (formData, { supabase, me }) => {
  const parsed = createSupplierSchema.safeParse({
    name: formData.get("name"),
    alias: formData.get("alias"),
    contact: formData.get("contact"),
    address: formData.get("address"),
    gstNumber: formData.get("gstNumber"),
    openingBalance: formData.get("openingBalance"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { name, alias, contact, address, gstNumber, openingBalance } =
    parsed.data;

  if (isReservedPartyName(name)) {
    return { success: false, error: `"${name.trim().toUpperCase()}" is reserved` };
  }

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .insert({
      company_id: me.company_id,
      name,
      alias: alias || null,
      contact: contact || null,
      address: address || null,
      gst_number: gstNumber || null,
      opening_balance: openingBalance,
    } as never)
    .select("id")
    .single();

  if (error || !supplier) {
    return { success: false, error: error?.message || "Failed to create supplier" };
  }

  if (openingBalance > 0) {
    const { error: ledgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "supplier",
      entity_id: supplier.id,
      entry_type: "credit",
      amount: openingBalance,
      reference_type: "opening_balance",
      reference_id: supplier.id,
      remark: "Opening balance",
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: me.id,
    } as never);

    if (ledgerError) {
      return { success: false, error: ledgerError.message };
    }
  }

  revalidateSupplierPages(supplier.id);
  return { success: true };
});

/** Create supplier from home pay modal — name only, returns id for immediate selection. */
export const createQuickSupplier = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_supplier", entityType: "supplier" },
})(async (formData, { supabase, me }) => {
  const parsed = quickSupplierSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { name } = parsed.data;

  if (isReservedPartyName(name)) {
    return { success: false, error: `"${name.trim().toUpperCase()}" is reserved` };
  }

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .insert({
      company_id: me.company_id,
      name,
      alias: null,
      contact: null,
      address: null,
      gst_number: null,
      opening_balance: 0,
    } as never)
    .select("id, name, alias, contact, address, gst_number, opening_balance, is_deleted, deleted_at, company_id, created_at, updated_at")
    .single();

  if (error || !supplier) {
    return { success: false, error: error?.message || "Failed to create supplier" };
  }

  const row = supplier as Omit<SupplierWithPayable, "payable_amount">;
  revalidateSupplierPages(row.id);
  return {
    success: true,
    data: { ...row, payable_amount: 0 },
  };
});

export const updateSupplier = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_supplier", entityType: "supplier" },
})(async (formData, { supabase }) => {
  const parsed = updateSupplierSchema.safeParse({
    supplierId: formData.get("supplierId"),
    name: formData.get("name"),
    alias: formData.get("alias"),
    contact: formData.get("contact"),
    address: formData.get("address"),
    gstNumber: formData.get("gstNumber"),
    openingBalance: formData.get("openingBalance"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { supplierId, name, alias, contact, address, gstNumber } = parsed.data;

  const systemFlags = await getSupplierSystemFlags(supabase, supplierId);
  if (systemFlags?.isSystemExpense) {
    return { success: false, error: "EXPENSE cannot be edited" };
  }
  if (isReservedPartyName(name)) {
    return { success: false, error: `"${name.trim().toUpperCase()}" is reserved` };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      alias: alias || null,
      contact: contact || null,
      address: address || null,
      gst_number: gstNumber || null,
    } as never)
    .eq("id", supplierId);

  if (error) return { success: false, error: error.message };

  revalidateSupplierPages(supplierId);
  return { success: true };
});

export const softDeleteSupplier = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "soft_delete_supplier", entityType: "supplier" },
})(async (formData, { supabase }) => {
  const supplierId = String(formData.get("supplierId") || "");
  if (!supplierId) return { success: false, error: "Supplier ID required" };

  const systemFlags = await getSupplierSystemFlags(supabase, supplierId);
  if (systemFlags?.isSystemExpense) {
    return { success: false, error: "EXPENSE cannot be deleted" };
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", supplierId);

  if (error) return { success: false, error: error.message };

  revalidateSupplierPages(supplierId);
  return { success: true };
});

export const recoverSupplier = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "recover_supplier", entityType: "supplier" },
})(async (formData, { supabase }) => {
  const supplierId = String(formData.get("supplierId") || "");
  if (!supplierId) return { success: false, error: "Supplier ID required" };

  const { error } = await supabase
    .from("suppliers")
    .update({
      is_deleted: false,
      deleted_at: null,
    } as never)
    .eq("id", supplierId);

  if (error) return { success: false, error: error.message };

  revalidateSupplierPages(supplierId);
  return { success: true };
});

export const paySupplier = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "pay_supplier", entityType: "supplier" },
})(async (formData, { supabase, me }) => {
  const rawPaymentMode = String(formData.get("paymentMode") || "");
  const resolvedBankId = await resolveBankIdForPayment(
    supabase,
    rawPaymentMode,
    String(formData.get("bankId") || "")
  );

  const parsed = paySupplierSchema.safeParse({
    supplierId: formData.get("supplierId"),
    amount: formData.get("amount"),
    paymentMode: rawPaymentMode,
    bankSubMode: formData.get("bankSubMode"),
    bankId: resolvedBankId ?? formData.get("bankId"),
    paymentDate: formData.get("paymentDate"),
    remark: formData.get("remark"),
    settlementType: formData.get("settlementType") || "direct",
    billIds: parseBillIdsFromForm(formData),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    supplierId,
    amount,
    paymentMode,
    paymentDate,
    remark,
    bankId: bankIdRaw,
    bankSubMode,
    settlementType,
    billIds,
  } = parsed.data;
  const bankId = paymentMode === "bank" && bankIdRaw?.trim() ? bankIdRaw : null;
  const normalizedBankSubMode = normalizeBankSubMode(bankSubMode);
  const modeLabel = paymentMode === "cash" ? "cash" : bankModeLabel(normalizedBankSubMode);

  const systemFlags = await getSupplierSystemFlags(supabase, supplierId);
  const isSystemExpense = Boolean(systemFlags?.isSystemExpense);

  if (isSystemExpense) {
    const detail = remark?.trim();
    if (!detail) {
      return { success: false, error: "Enter what this expense is for" };
    }
    if (settlementType === "against_bill" || billIds.length > 0) {
      return { success: false, error: "EXPENSE entries cannot be linked to bills" };
    }
  }

  const settlement = isSystemExpense
    ? { remark: "", billIds: [] as string[] }
    : await resolveSettlementRemark({
        settlementType: settlementType ?? "direct",
        billIds,
        partySide: "supplier",
        remark,
      });

  const ledgerRemark = isSystemExpense
    ? formatSystemExpenseRemark(remark ?? "")
    : settlement.remark || `Payment made (${modeLabel})`;

  const entryCategory = isSystemExpense ? "indirect_expense" : "payment";

  const { data: payment, error: paymentError } = await supabase
    .from("supplier_payments")
    .insert({
      company_id: me.company_id,
      supplier_id: supplierId,
      amount,
      payment_mode: paymentMode,
      bank_sub_mode: normalizedBankSubMode,
      bank_id: bankId,
      payment_date: paymentDate,
      remark: ledgerRemark,
      entry_category: entryCategory,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (paymentError || !payment) {
    return {
      success: false,
      error: paymentError?.message || "Failed to record payment",
    };
  }

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "supplier",
    entity_id: supplierId,
    entry_type: "debit",
    amount,
    payment_mode: paymentMode,
    bank_sub_mode: normalizedBankSubMode,
    bank_id: bankId,
    reference_type: "payment",
    reference_id: payment.id,
    remark: ledgerRemark,
    entry_date: paymentDate,
    entry_category: entryCategory,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  if (paymentMode === "bank" && bankId) {
    const { error: bankLedgerError } = await insertBankLedgerEntry(supabase, {
      companyId: me.company_id,
      bankId,
      entryType: "debit",
      amount,
      referenceType: "payment",
      referenceId: payment.id,
      remark: ledgerRemark,
      entryDate: paymentDate,
      entryCategory,
      bankSubMode: normalizedBankSubMode,
      createdBy: me.id,
    });

    if (bankLedgerError) {
      return { success: false, error: bankLedgerError.message };
    }
  }

  revalidateSupplierPages(supplierId, bankId);
  return { success: true };
});

export const updateSupplierPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_supplier_payment", entityType: "supplier" },
})(async (formData, { supabase, me }) => {
  const paymentId = String(formData.get("paymentId") || "");

  const { data: existing, error: fetchError } = await supabase
    .from("supplier_payments")
    .select("id, supplier_id, bank_id, bank_sub_mode, payment_mode")
    .eq("id", paymentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Payment not found" };
  }

  const paymentMode = String(formData.get("paymentMode") || existing.payment_mode);
  const bankIdInput = String(formData.get("bankId") || "").trim();
  const bankSubModeInput = String(formData.get("bankSubMode") || "");

  const parsed = updateSupplierPaymentSchema.safeParse({
    paymentId,
    supplierId: formData.get("supplierId"),
    amount: formData.get("amount"),
    paymentMode,
    bankSubMode:
      bankSubModeInput ||
      (existing.bank_sub_mode as string | null) ||
      undefined,
    bankId:
      bankIdInput ||
      (paymentMode === "bank" ? (existing.bank_id as string | null) : null) ||
      undefined,
    paymentDate: formData.get("paymentDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    supplierId,
    amount,
    paymentDate,
    remark,
    bankId: bankIdRaw,
    bankSubMode,
  } = parsed.data;
  const bankId = paymentMode === "bank" && bankIdRaw?.trim() ? bankIdRaw : null;
  const normalizedBankSubMode = normalizeBankSubMode(bankSubMode);
  const modeLabel = paymentMode === "cash" ? "cash" : bankModeLabel(normalizedBankSubMode);
  const ledgerRemark = remark || `Payment made (${modeLabel})`;

  if (existing.supplier_id !== supplierId) {
    return { success: false, error: "Payment does not belong to this supplier" };
  }

  const { assertPaymentNotDiscountLinked } = await import(
    "@/lib/utils/journal-guard"
  );
  const discountGuard = await assertPaymentNotDiscountLinked(supabase, paymentId);
  if (discountGuard) {
    return { success: false, error: discountGuard };
  }

  const previousBankId = existing.bank_id as string | null;

  const { error: updateError } = await supabase
    .from("supplier_payments")
    .update({
      amount,
      payment_mode: paymentMode,
      bank_sub_mode: normalizedBankSubMode,
      bank_id: bankId,
      payment_date: paymentDate,
      remark: ledgerRemark,
    } as never)
    .eq("id", paymentId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { error: deleteLedgerError } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("entity_type", "supplier")
    .eq("entity_id", supplierId)
    .eq("reference_type", "payment")
    .eq("reference_id", paymentId);

  if (deleteLedgerError) {
    return { success: false, error: deleteLedgerError.message };
  }

  const { error: deleteBankLedgerError } = await deleteBankLedgerByReference(
    supabase,
    paymentId
  );

  if (deleteBankLedgerError) {
    return { success: false, error: deleteBankLedgerError.message };
  }

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "supplier",
    entity_id: supplierId,
    entry_type: "debit",
    amount,
    payment_mode: paymentMode,
    bank_sub_mode: normalizedBankSubMode,
    bank_id: bankId,
    reference_type: "payment",
    reference_id: paymentId,
    remark: ledgerRemark,
    entry_date: paymentDate,
    entry_category: "payment",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  if (paymentMode === "bank" && bankId) {
    const { error: bankLedgerError } = await insertBankLedgerEntry(supabase, {
      companyId: me.company_id,
      bankId,
      entryType: "debit",
      amount,
      referenceType: "payment",
      referenceId: paymentId,
      remark: ledgerRemark,
      entryDate: paymentDate,
      entryCategory: "payment",
      bankSubMode: normalizedBankSubMode,
      createdBy: me.id,
    });

    if (bankLedgerError) {
      return { success: false, error: bankLedgerError.message };
    }
  }

  revalidateSupplierPages(supplierId, bankId ?? previousBankId);
  return { success: true };
});

export const deleteSupplierPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_supplier_payment", entityType: "supplier" },
})(async (formData, { supabase }) => {
  const parsed = deleteSupplierPaymentSchema.safeParse({
    supplierId: formData.get("supplierId"),
    paymentId: formData.get("paymentId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { supplierId, paymentId } = parsed.data;

  const { data: existing, error: fetchError } = await supabase
    .from("supplier_payments")
    .select("id, supplier_id, bank_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Payment not found" };
  }

  if (existing.supplier_id !== supplierId) {
    return { success: false, error: "Payment does not belong to this supplier" };
  }

  const { assertPaymentNotDiscountLinked } = await import(
    "@/lib/utils/journal-guard"
  );
  const discountGuard = await assertPaymentNotDiscountLinked(supabase, paymentId);
  if (discountGuard) {
    return { success: false, error: discountGuard };
  }

  const previousBankId = existing.bank_id as string | null;

  const { error: deleteLedgerError } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("entity_type", "supplier")
    .eq("entity_id", supplierId)
    .eq("reference_type", "payment")
    .eq("reference_id", paymentId);

  if (deleteLedgerError) {
    return { success: false, error: deleteLedgerError.message };
  }

  const { error: deleteBankLedgerError } = await deleteBankLedgerByReference(
    supabase,
    paymentId
  );

  if (deleteBankLedgerError) {
    return { success: false, error: deleteBankLedgerError.message };
  }

  const { error: deletePaymentError } = await supabase
    .from("supplier_payments")
    .delete()
    .eq("id", paymentId);

  if (deletePaymentError) {
    return { success: false, error: deletePaymentError.message };
  }

  revalidateSupplierPages(supplierId, previousBankId);
  return { success: true };
});