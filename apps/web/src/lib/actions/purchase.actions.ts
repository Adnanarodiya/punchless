"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  calculateGstAmount,
  calculatePurchaseTotal,
  createPurchaseInvoiceSchema,
  updatePurchaseInvoiceSchema,
} from "@/lib/validations/purchase.schema";

function revalidatePurchasePages() {
  revalidatePath("/dashboard/purchases");
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard");
}

export const createPurchaseInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
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
    `${invoiceType === "purchase" ? "Purchase" : "Sales"} invoice${invoiceNumber ? ` #${invoiceNumber}` : ""}`;

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

  revalidatePurchasePages();
  return { success: true };
});

export const updatePurchaseInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
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

  revalidatePurchasePages();
  return { success: true };
});

export const softDeletePurchaseInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const purchaseId = String(formData.get("purchaseId") || "");
  if (!purchaseId) return { success: false, error: "Purchase ID required" };

  const { error } = await supabase
    .from("purchase_invoices")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", purchaseId);

  if (error) return { success: false, error: error.message };

  revalidatePurchasePages();
  return { success: true };
});