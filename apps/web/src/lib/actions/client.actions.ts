"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  createClientSchema,
  receiveClientPaymentSchema,
  updateClientSchema,
} from "@/lib/validations/client.schema";

function revalidateClientPages(clientId?: string) {
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard");
  if (clientId) {
    revalidatePath(`/dashboard/clients/${clientId}/statement`);
  }
}

export const createClient = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase, me }) => {
  const parsed = createClientSchema.safeParse({
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

  const { data: client, error } = await supabase
    .from("clients")
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

  if (error || !client) {
    return { success: false, error: error?.message || "Failed to create client" };
  }

  if (openingBalance > 0) {
    const { error: ledgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "client",
      entity_id: client.id,
      entry_type: "debit",
      amount: openingBalance,
      reference_type: "opening_balance",
      reference_id: client.id,
      remark: "Opening balance",
      entry_date: new Date().toISOString().slice(0, 10),
      created_by: me.id,
    } as never);

    if (ledgerError) {
      return { success: false, error: ledgerError.message };
    }
  }

  revalidateClientPages(client.id);
  return { success: true };
});

export const updateClient = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const parsed = updateClientSchema.safeParse({
    clientId: formData.get("clientId"),
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

  const { clientId, name, alias, contact, address, gstNumber } = parsed.data;

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      alias: alias || null,
      contact: contact || null,
      address: address || null,
      gst_number: gstNumber || null,
    } as never)
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidateClientPages(clientId);
  return { success: true };
});

export const softDeleteClient = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { success: false, error: "Client ID required" };

  const { error } = await supabase
    .from("clients")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    } as never)
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidateClientPages(clientId);
  return { success: true };
});

export const recoverClient = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase }) => {
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { success: false, error: "Client ID required" };

  const { error } = await supabase
    .from("clients")
    .update({
      is_deleted: false,
      deleted_at: null,
    } as never)
    .eq("id", clientId);

  if (error) return { success: false, error: error.message };

  revalidateClientPages(clientId);
  return { success: true };
});

export const receiveClientPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
})(async (formData, { supabase, me }) => {
  const parsed = receiveClientPaymentSchema.safeParse({
    clientId: formData.get("clientId"),
    amount: formData.get("amount"),
    paymentMode: formData.get("paymentMode"),
    paymentDate: formData.get("paymentDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { clientId, amount, paymentMode, paymentDate, remark } = parsed.data;

  const { data: payment, error: paymentError } = await supabase
    .from("client_payments")
    .insert({
      company_id: me.company_id,
      client_id: clientId,
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
    entity_type: "client",
    entity_id: clientId,
    entry_type: "credit",
    amount,
    payment_mode: paymentMode,
    reference_type: "payment",
    reference_id: payment.id,
    remark: remark || `Payment received (${paymentMode})`,
    entry_date: paymentDate,
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateClientPages(clientId);
  return { success: true };
});