"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import type { SupplierWithPayable } from "@/lib/queries/supplier.queries";
import {
  createSupplierSchema,
  deleteSupplierPaymentSchema,
  paySupplierSchema,
  quickSupplierSchema,
  updateSupplierPaymentSchema,
  updateSupplierSchema,
} from "@/lib/validations/supplier.schema";

function revalidateSupplierPages(supplierId?: string) {
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard");
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
  const parsed = paySupplierSchema.safeParse({
    supplierId: formData.get("supplierId"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    paymentDate: formData.get("paymentDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { supplierId, amount, paymentMode, paymentDate, remark } = parsed.data;

  const { data: payment, error: paymentError } = await supabase
    .from("supplier_payments")
    .insert({
      company_id: me.company_id,
      supplier_id: supplierId,
      amount,
      payment_mode: paymentMode,
      payment_date: paymentDate,
      remark: remark || null,
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
    reference_type: "payment",
    reference_id: payment.id,
    remark: remark || `Payment made (${paymentMode})`,
    entry_date: paymentDate,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateSupplierPages(supplierId);
  return { success: true };
});

export const updateSupplierPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_supplier_payment", entityType: "supplier" },
})(async (formData, { supabase, me }) => {
  const parsed = updateSupplierPaymentSchema.safeParse({
    paymentId: formData.get("paymentId"),
    supplierId: formData.get("supplierId"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    paymentDate: formData.get("paymentDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { paymentId, supplierId, amount, paymentMode, paymentDate, remark } =
    parsed.data;

  const { data: existing, error: fetchError } = await supabase
    .from("supplier_payments")
    .select("id, supplier_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Payment not found" };
  }

  if (existing.supplier_id !== supplierId) {
    return { success: false, error: "Payment does not belong to this supplier" };
  }

  const { error: updateError } = await supabase
    .from("supplier_payments")
    .update({
      amount,
      payment_mode: paymentMode,
      payment_date: paymentDate,
      remark: remark || null,
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

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "supplier",
    entity_id: supplierId,
    entry_type: "debit",
    amount,
    payment_mode: paymentMode,
    reference_type: "payment",
    reference_id: paymentId,
    remark: remark || `Payment made (${paymentMode})`,
    entry_date: paymentDate,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateSupplierPages(supplierId);
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
    .select("id, supplier_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Payment not found" };
  }

  if (existing.supplier_id !== supplierId) {
    return { success: false, error: "Payment does not belong to this supplier" };
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

  const { error: deletePaymentError } = await supabase
    .from("supplier_payments")
    .delete()
    .eq("id", paymentId);

  if (deletePaymentError) {
    return { success: false, error: deletePaymentError.message };
  }

  revalidateSupplierPages(supplierId);
  return { success: true };
});