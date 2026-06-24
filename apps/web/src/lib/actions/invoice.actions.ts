"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  calculateGstAmount,
  createInvoiceSchema,
  resolvePaymentBreakdown,
  updateInvoiceSchema,
} from "@/lib/validations/invoice.schema";

function revalidateInvoicePages(invoiceId?: string) {
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  if (invoiceId) {
    revalidatePath(`/dashboard/invoices/${invoiceId}/print`);
  }
}

async function deleteInvoiceLedgerEntries(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  invoiceId: string
) {
  const { error, count } = await supabase
    .from("ledger_entries")
    .delete({ count: "exact" })
    .eq("reference_id", invoiceId);

  if (error) return error;

  // RLS may block deletes — surface as error so ledger is not duplicated
  if (count === 0) {
    const { data: existing } = await supabase
      .from("ledger_entries")
      .select("id")
      .eq("reference_id", invoiceId)
      .limit(1);

    if ((existing ?? []).length > 0) {
      return {
        message:
          "Could not resync client ledger for this invoice. Please contact the account owner.",
        details: "",
        hint: "",
        code: "LEDGER_DELETE_BLOCKED",
      };
    }
  }

  return null;
}

async function writeInvoiceLedgerEntries(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  params: {
    companyId: string;
    clientId: string;
    invoiceId: string;
    invoiceDate: string;
    invoiceNumber: string | null;
    totalAmount: number;
    cashAmount: number;
    bankAmount: number;
    createdBy: string;
  }
) {
  const remarkBase = params.invoiceNumber
    ? `Tax invoice #${params.invoiceNumber}`
    : "Tax invoice";

  // Shahin-style net posting: only the unpaid (credit) portion increases client due.
  // Cash/bank received is credited immediately — full cash invoice = credit only (reduces due).
  const unpaidAmount = Math.max(
    0,
    Math.round(
      (params.totalAmount - params.cashAmount - params.bankAmount) * 100
    ) / 100
  );

  if (unpaidAmount > 0) {
    const { error: debitError } = await supabase.from("ledger_entries").insert({
      company_id: params.companyId,
      entity_type: "client",
      entity_id: params.clientId,
      entry_type: "debit",
      amount: unpaidAmount,
      reference_type: "invoice",
      reference_id: params.invoiceId,
      remark: remarkBase,
      entry_date: params.invoiceDate,
      created_by: params.createdBy,
    } as never);

    if (debitError) return debitError;
  }

  if (params.cashAmount > 0) {
    const { error } = await supabase.from("ledger_entries").insert({
      company_id: params.companyId,
      entity_type: "client",
      entity_id: params.clientId,
      entry_type: "credit",
      amount: params.cashAmount,
      payment_mode: "cash",
      reference_type: "payment",
      reference_id: params.invoiceId,
      remark: `${remarkBase} — cash`,
      entry_date: params.invoiceDate,
      created_by: params.createdBy,
    } as never);
    if (error) return error;
  }

  if (params.bankAmount > 0) {
    const { error } = await supabase.from("ledger_entries").insert({
      company_id: params.companyId,
      entity_type: "client",
      entity_id: params.clientId,
      entry_type: "credit",
      amount: params.bankAmount,
      payment_mode: "bank",
      reference_type: "payment",
      reference_id: params.invoiceId,
      remark: `${remarkBase} — bank`,
      entry_date: params.invoiceDate,
      created_by: params.createdBy,
    } as never);
    if (error) return error;
  }

  return null;
}

export const createInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase, me }) => {
  const parsed = createInvoiceSchema.safeParse({
    clientId: formData.get("clientId"),
    jobId: formData.get("jobId"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    vehicleNumber: formData.get("vehicleNumber"),
    description: formData.get("description"),
    taxableAmount: formData.get("taxableAmount"),
    gstPercent: formData.get("gstPercent"),
    paymentMode: formData.get("paymentMode"),
    cashAmount: formData.get("cashAmount"),
    bankAmount: formData.get("bankAmount"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const gstAmount = calculateGstAmount(data.taxableAmount, data.gstPercent);
  const payment = resolvePaymentBreakdown(
    data.paymentMode,
    data.taxableAmount,
    data.gstPercent,
    data.cashAmount,
    data.bankAmount
  );

  const jobId = data.jobId?.trim() ? data.jobId : null;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      company_id: me.company_id,
      client_id: data.clientId,
      job_id: jobId,
      invoice_number: data.invoiceNumber || null,
      invoice_date: data.invoiceDate,
      vehicle_number: data.vehicleNumber || null,
      taxable_amount: data.taxableAmount,
      gst_percent: data.gstPercent,
      gst_amount: gstAmount,
      total_amount: payment.totalAmount,
      payment_mode: data.paymentMode,
      cash_amount: payment.cashAmount,
      bank_amount: payment.bankAmount,
      credit_amount: payment.creditAmount,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (error || !invoice) {
    return { success: false, error: error?.message || "Failed to create invoice" };
  }

  const { error: lineError } = await supabase.from("invoice_line_items").insert({
    invoice_id: invoice.id,
    description: data.description,
    quantity: 1,
    unit_price: data.taxableAmount,
    gst_percent: data.gstPercent,
    amount: data.taxableAmount,
    sort_order: 0,
  } as never);

  if (lineError) {
    return { success: false, error: lineError.message };
  }

  const ledgerError = await writeInvoiceLedgerEntries(supabase, {
    companyId: me.company_id,
    clientId: data.clientId,
    invoiceId: invoice.id,
    invoiceDate: data.invoiceDate,
    invoiceNumber: data.invoiceNumber || null,
    totalAmount: payment.totalAmount,
    cashAmount: payment.cashAmount,
    bankAmount: payment.bankAmount,
    createdBy: me.id,
  });

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateInvoicePages(invoice.id);
  return { success: true };
});

export const updateInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase, me }) => {
  const parsed = updateInvoiceSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    clientId: formData.get("clientId"),
    jobId: formData.get("jobId"),
    invoiceNumber: formData.get("invoiceNumber"),
    invoiceDate: formData.get("invoiceDate"),
    vehicleNumber: formData.get("vehicleNumber"),
    description: formData.get("description"),
    taxableAmount: formData.get("taxableAmount"),
    gstPercent: formData.get("gstPercent"),
    paymentMode: formData.get("paymentMode"),
    cashAmount: formData.get("cashAmount"),
    bankAmount: formData.get("bankAmount"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const gstAmount = calculateGstAmount(data.taxableAmount, data.gstPercent);
  const payment = resolvePaymentBreakdown(
    data.paymentMode,
    data.taxableAmount,
    data.gstPercent,
    data.cashAmount,
    data.bankAmount
  );

  const jobId = data.jobId?.trim() ? data.jobId : null;

  const { error } = await supabase
    .from("invoices")
    .update({
      client_id: data.clientId,
      job_id: jobId,
      invoice_number: data.invoiceNumber || null,
      invoice_date: data.invoiceDate,
      vehicle_number: data.vehicleNumber || null,
      taxable_amount: data.taxableAmount,
      gst_percent: data.gstPercent,
      gst_amount: gstAmount,
      total_amount: payment.totalAmount,
      payment_mode: data.paymentMode,
      cash_amount: payment.cashAmount,
      bank_amount: payment.bankAmount,
      credit_amount: payment.creditAmount,
      remark: data.remark || null,
    } as never)
    .eq("id", data.invoiceId);

  if (error) return { success: false, error: error.message };

  await supabase
    .from("invoice_line_items")
    .delete()
    .eq("invoice_id", data.invoiceId);

  const { error: lineError } = await supabase.from("invoice_line_items").insert({
    invoice_id: data.invoiceId,
    description: data.description,
    quantity: 1,
    unit_price: data.taxableAmount,
    gst_percent: data.gstPercent,
    amount: data.taxableAmount,
    sort_order: 0,
  } as never);

  if (lineError) {
    return { success: false, error: lineError.message };
  }

  const deleteError = await deleteInvoiceLedgerEntries(supabase, data.invoiceId);
  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  const ledgerError = await writeInvoiceLedgerEntries(supabase, {
    companyId: me.company_id,
    clientId: data.clientId,
    invoiceId: data.invoiceId,
    invoiceDate: data.invoiceDate,
    invoiceNumber: data.invoiceNumber || null,
    totalAmount: payment.totalAmount,
    cashAmount: payment.cashAmount,
    bankAmount: payment.bankAmount,
    createdBy: me.id,
  });

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateInvoicePages(data.invoiceId);
  return { success: true };
});

export const softDeleteInvoice = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const invoiceId = String(formData.get("invoiceId") || "");
  if (!invoiceId) return { success: false, error: "Invoice ID required" };

  const { error } = await supabase
    .from("invoices")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", invoiceId);

  if (error) return { success: false, error: error.message };

  const ledgerError = await deleteInvoiceLedgerEntries(supabase, invoiceId);
  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateInvoicePages(invoiceId);
  return { success: true };
});