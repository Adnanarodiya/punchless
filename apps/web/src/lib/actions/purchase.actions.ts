"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  calculateGstAmount,
  calculatePurchaseTotal,
  createPurchaseInvoiceSchema,
  quickPurchaseBillSchema,
  updatePurchaseInvoiceSchema,
} from "@/lib/validations/purchase.schema";

function revalidatePurchasePages(supplierId?: string) {
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard");
  if (supplierId) {
    revalidatePath(`/dashboard/suppliers/${supplierId}/statement`);
  }
}

async function deletePurchaseLedgerEntries(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  purchaseId: string
) {
  const { error } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("reference_type", "purchase")
    .eq("reference_id", purchaseId);

  return error?.message ?? null;
}

async function writePurchaseLedgerEntry(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  params: {
    companyId: string;
    supplierId: string;
    purchaseId: string;
    invoiceType: "purchase" | "sales";
    invoiceNumber: string | null;
    invoiceDate: string;
    totalAmount: number;
    remark: string | null;
    createdBy: string;
  }
) {
  const ledgerEntryType = params.invoiceType === "purchase" ? "credit" : "debit";
  const ledgerRemark =
    params.remark ||
    `${params.invoiceType === "purchase" ? "Supplier bill" : "Credit note"}${params.invoiceNumber ? ` #${params.invoiceNumber}` : ""}`;

  const { error } = await supabase.from("ledger_entries").insert({
    company_id: params.companyId,
    entity_type: "supplier",
    entity_id: params.supplierId,
    entry_type: ledgerEntryType,
    amount: params.totalAmount,
    reference_type: "purchase",
    reference_id: params.purchaseId,
    remark: ledgerRemark,
    entry_date: params.invoiceDate,
    created_by: params.createdBy,
  } as never);

  return error?.message ?? null;
}

export const createQuickPurchaseBill = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_quick_purchase_bill", entityType: "purchase" },
})(async (formData, { supabase, me }) => {
  const parsed = quickPurchaseBillSchema.safeParse({
    supplierId: formData.get("supplierId"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    amount: formData.get("amount"),
    gstNumber: formData.get("gstNumber"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;

  if (data.gstNumber?.trim()) {
    await supabase
      .from("suppliers")
      .update({ gst_number: data.gstNumber.trim() } as never)
      .eq("id", data.supplierId);
  }

  const gstPercent = 0;
  const totalAmount = data.amount;

  const { data: purchase, error } = await supabase
    .from("purchase_invoices")
    .insert({
      company_id: me.company_id,
      supplier_id: data.supplierId,
      invoice_type: "purchase",
      invoice_number: data.invoiceNumber,
      invoice_date: data.invoiceDate,
      taxable_amount: totalAmount,
      gst_percent: gstPercent,
      gst_amount: 0,
      total_amount: totalAmount,
      remark: data.remark || null,
      entry_category: "purchase_bill",
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !purchase) {
    return { success: false, error: error?.message || "Failed to create purchase bill" };
  }

  const ledgerError = await writePurchaseLedgerEntry(supabase, {
    companyId: me.company_id,
    supplierId: data.supplierId,
    purchaseId: purchase.id,
    invoiceType: "purchase",
    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    totalAmount,
    remark: data.remark || `Purchase bill #${data.invoiceNumber}`,
    createdBy: me.id,
  });

  if (ledgerError) {
    return { success: false, error: ledgerError };
  }

  revalidatePurchasePages(data.supplierId);
  revalidatePath("/dashboard/cash-book");
  revalidatePath("/dashboard/bank-book");
  return { success: true, data: { purchaseId: purchase.id } };
});

export const createPurchaseInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_purchase_invoice", entityType: "purchase" },
})(async (formData, { supabase, me }) => {
  const parsed = createPurchaseInvoiceSchema.safeParse({
    supplierId: formData.get("supplierId"),
    invoiceType: formData.get("invoiceType"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    taxableAmount: formData.get("taxableAmount"),
    gstPercent: formData.get("gstPercent"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    supplierId,
    invoiceType,
    invoiceNumber,
    invoiceDate,
    taxableAmount,
    gstPercent,
    remark,
  } = parsed.data;

  const gstAmount = calculateGstAmount(taxableAmount, gstPercent);
  const totalAmount = calculatePurchaseTotal(taxableAmount, gstPercent);

  const { data: purchase, error } = await supabase
    .from("purchase_invoices")
    .insert({
      company_id: me.company_id,
      supplier_id: supplierId,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber || null,
      invoice_date: invoiceDate,
      taxable_amount: taxableAmount,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      remark: remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !purchase) {
    return { success: false, error: error?.message || "Failed to create invoice" };
  }

  const ledgerEntryType = invoiceType === "purchase" ? "credit" : "debit";
  const ledgerRemark =
    remark ||
    `${invoiceType === "purchase" ? "Supplier bill" : "Credit note"}${invoiceNumber ? ` #${invoiceNumber}` : ""}`;

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "supplier",
    entity_id: supplierId,
    entry_type: ledgerEntryType,
    amount: totalAmount,
    reference_type: "purchase",
    reference_id: purchase.id,
    remark: ledgerRemark,
    entry_date: invoiceDate,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidatePurchasePages(supplierId);
  return { success: true };
});

export const updatePurchaseInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_purchase_invoice", entityType: "purchase" },
})(async (formData, { supabase, me }) => {
  const parsed = updatePurchaseInvoiceSchema.safeParse({
    purchaseId: formData.get("purchaseId"),
    supplierId: formData.get("supplierId"),
    invoiceType: formData.get("invoiceType"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    taxableAmount: formData.get("taxableAmount"),
    gstPercent: formData.get("gstPercent"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const {
    purchaseId,
    supplierId,
    invoiceType,
    invoiceNumber,
    invoiceDate,
    taxableAmount,
    gstPercent,
    remark,
  } = parsed.data;

  const gstAmount = calculateGstAmount(taxableAmount, gstPercent);
  const totalAmount = calculatePurchaseTotal(taxableAmount, gstPercent);

  const { data: existing, error: fetchError } = await supabase
    .from("purchase_invoices")
    .select("id, is_deleted")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Supplier bill not found" };
  }

  if (existing.is_deleted) {
    return { success: false, error: "This supplier bill was deleted" };
  }

  const { error } = await supabase
    .from("purchase_invoices")
    .update({
      supplier_id: supplierId,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber || null,
      invoice_date: invoiceDate,
      taxable_amount: taxableAmount,
      gst_percent: gstPercent,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      remark: remark || null,
    } as never)
    .eq("id", purchaseId);

  if (error) return { success: false, error: error.message };

  const deleteError = await deletePurchaseLedgerEntries(supabase, purchaseId);
  if (deleteError) {
    return { success: false, error: deleteError };
  }

  const ledgerError = await writePurchaseLedgerEntry(supabase, {
    companyId: me.company_id,
    supplierId,
    purchaseId,
    invoiceType,
    invoiceNumber: invoiceNumber || null,
    invoiceDate,
    totalAmount,
    remark: remark || null,
    createdBy: me.id,
  });

  if (ledgerError) {
    return { success: false, error: ledgerError };
  }

  revalidatePurchasePages(supplierId);
  return { success: true };
});

export const softDeletePurchaseInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "soft_delete_purchase_invoice", entityType: "purchase" },
})(async (formData, { supabase }) => {
  const purchaseId = String(formData.get("purchaseId") || "");
  if (!purchaseId) return { success: false, error: "Purchase ID required" };

  const { data: existing, error: fetchError } = await supabase
    .from("purchase_invoices")
    .select("id, supplier_id")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Supplier bill not found" };
  }

  const { error } = await supabase
    .from("purchase_invoices")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", purchaseId);

  if (error) return { success: false, error: error.message };

  const ledgerError = await deletePurchaseLedgerEntries(supabase, purchaseId);
  if (ledgerError) {
    return { success: false, error: ledgerError };
  }

  revalidatePurchasePages(existing.supplier_id);
  return { success: true };
});