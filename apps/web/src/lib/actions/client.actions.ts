"use server";

import { revalidatePath } from "next/cache";
import type { ClientWithDue } from "@/lib/queries/client.queries";
import { protectedAction } from "@/lib/server/protected-action";
import {
  bankModeLabel,
  deleteBankLedgerByReference,
  insertBankLedgerEntry,
  normalizeBankSubMode,
} from "@/lib/utils/bank-ledger";
import { resolveBankIdForPayment } from "@/lib/utils/resolve-bank-id";
import {
  applyClientBillSettlement,
  resolveSettlementRemark,
} from "@/lib/utils/settlement";
import {
  createClientSchema,
  deleteClientPaymentSchema,
  quickCustomerSchema,
  receiveClientPaymentSchema,
  updateClientPaymentSchema,
  updateClientSchema,
} from "@/lib/validations/client.schema";
import { parseBillIdsFromForm } from "@/lib/validations/settlement.schema";
import {
  formatSystemIncomeRemark,
  isReservedPartyName,
  SYSTEM_INCOME_CLIENT_NAME,
} from "@/lib/constants/system-parties";

async function getClientSystemFlags(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  clientId: string
) {
  const { data } = await supabase
    .from("clients")
    .select("name, is_system")
    .eq("id", clientId)
    .maybeSingle();

  if (!data) return null;

  const row = data as { name: string; is_system: boolean | null };
  return {
    isSystemIncome:
      Boolean(row.is_system) || row.name === SYSTEM_INCOME_CLIENT_NAME,
    name: row.name,
  };
}

function revalidateClientPages(clientId?: string, bankId?: string | null) {
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cash-book");
  revalidatePath("/dashboard/bank-book");
  revalidatePath("/dashboard/daily-report");
  revalidatePath("/dashboard/banks");
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
  }
  if (clientId) {
    revalidatePath(`/dashboard/customers/${clientId}/statement`);
  }
}

export const createClient = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_client", entityType: "client" },
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

  if (isReservedPartyName(name)) {
    return { success: false, error: `"${name.trim().toUpperCase()}" is reserved` };
  }

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

/** Create customer from quick bill — name only, returns id for immediate selection. */
export const createQuickCustomer = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_client", entityType: "client" },
})(async (formData, { supabase, me }) => {
  const parsed = quickCustomerSchema.safeParse({
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

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      company_id: me.company_id,
      name,
      alias: null,
      contact: null,
      address: null,
      gst_number: null,
      opening_balance: 0,
    } as never)
    .select(
      "id, name, alias, contact, address, gst_number, opening_balance, is_deleted, deleted_at, company_id, created_at, updated_at"
    )
    .single();

  if (error || !client) {
    return { success: false, error: error?.message || "Failed to create customer" };
  }

  const row = client as Omit<ClientWithDue, "due_amount">;
  revalidateClientPages(row.id);
  return {
    success: true,
    data: { ...row, due_amount: 0 },
  };
});

export const updateClient = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_client", entityType: "client" },
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

  const systemFlags = await getClientSystemFlags(supabase, clientId);
  if (systemFlags?.isSystemIncome) {
    return { success: false, error: "INCOME cannot be edited" };
  }
  if (isReservedPartyName(name)) {
    return { success: false, error: `"${name.trim().toUpperCase()}" is reserved` };
  }

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
  audit: { action: "soft_delete_client", entityType: "client" },
})(async (formData, { supabase }) => {
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { success: false, error: "Customer ID required" };

  const systemFlags = await getClientSystemFlags(supabase, clientId);
  if (systemFlags?.isSystemIncome) {
    return { success: false, error: "INCOME cannot be deleted" };
  }

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
  audit: { action: "recover_client", entityType: "client" },
})(async (formData, { supabase }) => {
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return { success: false, error: "Customer ID required" };

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
  audit: { action: "receive_client_payment", entityType: "client" },
})(async (formData, { supabase, me }) => {
  const rawPaymentMode = String(formData.get("paymentMode") || "");
  const resolvedBankId = await resolveBankIdForPayment(
    supabase,
    rawPaymentMode,
    String(formData.get("bankId") || "")
  );

  const parsed = receiveClientPaymentSchema.safeParse({
    clientId: formData.get("clientId"),
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
    clientId,
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

  const systemFlags = await getClientSystemFlags(supabase, clientId);
  const isSystemIncome = Boolean(systemFlags?.isSystemIncome);

  if (isSystemIncome) {
    const detail = remark?.trim();
    if (!detail) {
      return { success: false, error: "Enter what this income is for" };
    }
    if (settlementType === "against_bill" || billIds.length > 0) {
      return { success: false, error: "INCOME entries cannot be linked to bills" };
    }
  }

  const settlement = isSystemIncome
    ? { remark: "", billIds: [] as string[] }
    : await resolveSettlementRemark({
        settlementType: settlementType ?? "direct",
        billIds,
        partySide: "client",
        remark,
      });

  const ledgerRemark = isSystemIncome
    ? formatSystemIncomeRemark(remark ?? "")
    : settlement.remark || `Payment received (${modeLabel})`;

  const entryCategory = isSystemIncome ? "indirect_income" : "receipt";

  const { data: payment, error: paymentError } = await supabase
    .from("client_payments")
    .insert({
      company_id: me.company_id,
      client_id: clientId,
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
    entity_type: "client",
    entity_id: clientId,
    entry_type: "credit",
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

  if (!isSystemIncome && settlement.billIds.length > 0) {
    await applyClientBillSettlement(supabase, {
      billIds: settlement.billIds,
      amount,
    });
  }

  if (paymentMode === "bank" && bankId) {
    const { error: bankLedgerError } = await insertBankLedgerEntry(supabase, {
      companyId: me.company_id,
      bankId,
      entryType: "credit",
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

  revalidateClientPages(clientId, bankId);
  return { success: true };
});

export const updateClientPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_client_payment", entityType: "client" },
})(async (formData, { supabase, me }) => {
  const paymentId = String(formData.get("paymentId") || "");

  const { data: existing, error: fetchError } = await supabase
    .from("client_payments")
    .select("id, client_id, bank_id, bank_sub_mode, payment_mode")
    .eq("id", paymentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Payment not found" };
  }

  const paymentMode = String(formData.get("paymentMode") || existing.payment_mode);
  const bankIdInput = String(formData.get("bankId") || "").trim();
  const bankSubModeInput = String(formData.get("bankSubMode") || "");

  const parsed = updateClientPaymentSchema.safeParse({
    paymentId,
    clientId: formData.get("clientId"),
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
    clientId,
    amount,
    paymentDate,
    remark,
    bankId: bankIdRaw,
    bankSubMode,
  } = parsed.data;
  const bankId = paymentMode === "bank" && bankIdRaw?.trim() ? bankIdRaw : null;
  const normalizedBankSubMode = normalizeBankSubMode(bankSubMode);
  const modeLabel = paymentMode === "cash" ? "cash" : bankModeLabel(normalizedBankSubMode);
  const ledgerRemark = remark || `Payment received (${modeLabel})`;

  if (existing.client_id !== clientId) {
    return { success: false, error: "Payment does not belong to this customer" };
  }

  const previousBankId = existing.bank_id as string | null;

  const { error: updateError } = await supabase
    .from("client_payments")
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
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
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
    entity_type: "client",
    entity_id: clientId,
    entry_type: "credit",
    amount,
    payment_mode: paymentMode,
    bank_sub_mode: normalizedBankSubMode,
    bank_id: bankId,
    reference_type: "payment",
    reference_id: paymentId,
    remark: ledgerRemark,
    entry_date: paymentDate,
    entry_category: "receipt",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  if (paymentMode === "bank" && bankId) {
    const { error: bankLedgerError } = await insertBankLedgerEntry(supabase, {
      companyId: me.company_id,
      bankId,
      entryType: "credit",
      amount,
      referenceType: "payment",
      referenceId: paymentId,
      remark: ledgerRemark,
      entryDate: paymentDate,
      entryCategory: "receipt",
      bankSubMode: normalizedBankSubMode,
      createdBy: me.id,
    });

    if (bankLedgerError) {
      return { success: false, error: bankLedgerError.message };
    }
  }

  revalidateClientPages(clientId, bankId ?? previousBankId);
  return { success: true };
});

export const deleteClientPayment = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_client_payment", entityType: "client" },
})(async (formData, { supabase }) => {
  const parsed = deleteClientPaymentSchema.safeParse({
    clientId: formData.get("clientId"),
    paymentId: formData.get("paymentId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { clientId, paymentId } = parsed.data;

  const { data: existing, error: fetchError } = await supabase
    .from("client_payments")
    .select("id, client_id, bank_id")
    .eq("id", paymentId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: "Payment not found" };
  }

  if (existing.client_id !== clientId) {
    return { success: false, error: "Payment does not belong to this customer" };
  }

  const previousBankId = existing.bank_id as string | null;

  const { error: deleteLedgerError } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
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
    .from("client_payments")
    .delete()
    .eq("id", paymentId);

  if (deletePaymentError) {
    return { success: false, error: deletePaymentError.message };
  }

  revalidateClientPages(clientId, previousBankId);
  return { success: true };
});