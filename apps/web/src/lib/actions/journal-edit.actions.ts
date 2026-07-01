"use server";

import { revalidatePath } from "next/cache";

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
  applyPurchaseBillSettlement,
  getClientBillOutstanding,
  getPurchaseBillOutstanding,
  reverseClientBillSettlement,
  reversePurchaseBillSettlement,
} from "@/lib/utils/settlement";
import {
  deleteJournalEntrySchema,
  updateDiscountSettlementSchema,
  updateJournalNoteSchema,
} from "@/lib/validations/journal.schema";

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function revalidateJournalPages(bankId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/daily-report");
  revalidatePath("/dashboard/cash-book");
  revalidatePath("/dashboard/bank-book");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/suppliers");
  revalidatePath("/dashboard/invoices");
  if (bankId) {
    revalidatePath(`/dashboard/banks/${bankId}/statement`);
    revalidatePath("/dashboard/banks");
  }
}

async function deleteLedgerByReference(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  options: {
    entityType: "client" | "supplier";
    entityId: string;
    referenceType: string;
    referenceId: string;
  }
) {
  return supabase
    .from("ledger_entries")
    .delete()
    .eq("entity_type", options.entityType)
    .eq("entity_id", options.entityId)
    .eq("reference_type", options.referenceType)
    .eq("reference_id", options.referenceId);
}

export const updateDiscountSettlement = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_discount_settlement", entityType: "transaction" },
})(async (formData, { supabase, me }) => {
  const paymentMode = String(formData.get("paymentMode") || "");
  const resolvedBankId = await resolveBankIdForPayment(
    supabase,
    paymentMode,
    String(formData.get("bankId") || "")
  );

  const parsed = updateDiscountSettlementSchema.safeParse({
    settlementId: formData.get("settlementId"),
    discountAmount: formData.get("discountAmount"),
    paymentMode,
    bankSubMode: formData.get("bankSubMode"),
    bankId: resolvedBankId ?? formData.get("bankId"),
    entryDate: formData.get("entryDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const { data: settlement } = await supabase
    .from("discount_settlements")
    .select("*")
    .eq("id", data.settlementId)
    .maybeSingle();

  if (!settlement) {
    return { success: false, error: "Discount settlement not found" };
  }

  const row = settlement as {
    id: string;
    party_side: "client" | "supplier";
    party_id: string;
    bill_id: string;
    bill_amount: number;
    discount_amount: number;
    payment_reference_id: string | null;
    invoice_number: string | null;
    settlement_kind: "given" | "received";
    bank_id: string | null;
  };

  const billAmount = roundMoney(Number(row.bill_amount));
  if (data.discountAmount >= billAmount) {
    return {
      success: false,
      error: "Discount must be less than the bill due amount",
    };
  }

  const paymentAmount = roundMoney(billAmount - data.discountAmount);
  const bankSubMode =
    data.paymentMode === "bank" && data.bankSubMode ? data.bankSubMode : null;
  const bankId = data.bankId?.trim() ? data.bankId : null;
  const modeLabel = data.paymentMode === "cash" ? "cash" : bankModeLabel(bankSubMode);
  const billLabel = row.invoice_number ? `#${row.invoice_number}` : "bill";

  if (row.party_side === "client") {
    await reverseClientBillSettlement(supabase, {
      billIds: [row.bill_id],
      amount: billAmount,
    });
  } else {
    await reversePurchaseBillSettlement(supabase, {
      billIds: [row.bill_id],
      amount: billAmount,
    });
  }

  if (row.payment_reference_id) {
    await deleteLedgerByReference(supabase, {
      entityType: row.party_side,
      entityId: row.party_id,
      referenceType: "payment",
      referenceId: row.payment_reference_id,
    });
    await deleteBankLedgerByReference(supabase, row.payment_reference_id);
    await supabase
      .from(row.party_side === "client" ? "client_payments" : "supplier_payments")
      .delete()
      .eq("id", row.payment_reference_id);
  }

  await deleteLedgerByReference(supabase, {
    entityType: row.party_side,
    entityId: row.party_id,
    referenceType: "discount_settlement",
    referenceId: row.id,
  });

  const discountRemark =
    data.remark?.trim() ||
    (row.settlement_kind === "given"
      ? `Discount given — ${billLabel}`
      : `Discount received — ${billLabel}`);
  const paymentRemark =
    row.settlement_kind === "given"
      ? `Payment received (${modeLabel}) — ${billLabel}`
      : `Payment made (${modeLabel}) — ${billLabel}`;

  let paymentReferenceId: string | null = null;

  if (row.party_side === "client") {
    if (paymentAmount > 0.01) {
      const { data: payment, error: paymentError } = await supabase
        .from("client_payments")
        .insert({
          company_id: me.company_id,
          client_id: row.party_id,
          amount: paymentAmount,
          payment_mode: data.paymentMode,
          bank_sub_mode: bankSubMode,
          bank_id: bankId,
          payment_date: data.entryDate,
          remark: paymentRemark,
          entry_category: "receipt",
          created_by: me.id,
        } as never)
        .select("id")
        .single();

      if (paymentError || !payment) {
        return { success: false, error: paymentError?.message || "Failed to record payment" };
      }

      paymentReferenceId = payment.id;

      const { error: paymentLedgerError } = await supabase.from("ledger_entries").insert({
        company_id: me.company_id,
        entity_type: "client",
        entity_id: row.party_id,
        entry_type: "credit",
        amount: paymentAmount,
        payment_mode: data.paymentMode,
        bank_sub_mode: bankSubMode,
        bank_id: bankId,
        reference_type: "payment",
        reference_id: payment.id,
        remark: paymentRemark,
        entry_date: data.entryDate,
        entry_category: "receipt",
        created_by: me.id,
      } as never);

      if (paymentLedgerError) {
        return { success: false, error: paymentLedgerError.message };
      }

      if (data.paymentMode === "bank" && bankId) {
        const { error: bankLedgerError } = await insertBankLedgerEntry(supabase, {
          companyId: me.company_id,
          bankId,
          entryType: "credit",
          amount: paymentAmount,
          referenceType: "payment",
          referenceId: payment.id,
          remark: paymentRemark,
          entryDate: data.entryDate,
          entryCategory: "receipt",
          bankSubMode: bankSubMode,
          createdBy: me.id,
        });
        if (bankLedgerError) {
          return { success: false, error: bankLedgerError.message };
        }
      }
    }

    const { error: discountLedgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "client",
      entity_id: row.party_id,
      entry_type: "credit",
      amount: data.discountAmount,
      reference_type: "discount_settlement",
      reference_id: row.id,
      remark: discountRemark,
      entry_date: data.entryDate,
      entry_category: "discount_given",
      created_by: me.id,
    } as never);

    if (discountLedgerError) {
      return { success: false, error: discountLedgerError.message };
    }

    await applyClientBillSettlement(supabase, {
      billIds: [row.bill_id],
      amount: billAmount,
    });
  } else {
    if (paymentAmount > 0.01) {
      const { data: payment, error: paymentError } = await supabase
        .from("supplier_payments")
        .insert({
          company_id: me.company_id,
          supplier_id: row.party_id,
          amount: paymentAmount,
          payment_mode: data.paymentMode,
          bank_sub_mode: bankSubMode,
          bank_id: bankId,
          payment_date: data.entryDate,
          remark: paymentRemark,
          entry_category: "payment",
          created_by: me.id,
        } as never)
        .select("id")
        .single();

      if (paymentError || !payment) {
        return { success: false, error: paymentError?.message || "Failed to record payment" };
      }

      paymentReferenceId = payment.id;

      const { error: paymentLedgerError } = await supabase.from("ledger_entries").insert({
        company_id: me.company_id,
        entity_type: "supplier",
        entity_id: row.party_id,
        entry_type: "debit",
        amount: paymentAmount,
        payment_mode: data.paymentMode,
        bank_sub_mode: bankSubMode,
        bank_id: bankId,
        reference_type: "payment",
        reference_id: payment.id,
        remark: paymentRemark,
        entry_date: data.entryDate,
        entry_category: "payment",
        created_by: me.id,
      } as never);

      if (paymentLedgerError) {
        return { success: false, error: paymentLedgerError.message };
      }

      if (data.paymentMode === "bank" && bankId) {
        const { error: bankLedgerError } = await insertBankLedgerEntry(supabase, {
          companyId: me.company_id,
          bankId,
          entryType: "debit",
          amount: paymentAmount,
          referenceType: "payment",
          referenceId: payment.id,
          remark: paymentRemark,
          entryDate: data.entryDate,
          entryCategory: "payment",
          bankSubMode: bankSubMode,
          createdBy: me.id,
        });
        if (bankLedgerError) {
          return { success: false, error: bankLedgerError.message };
        }
      }
    }

    const { error: discountLedgerError } = await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "supplier",
      entity_id: row.party_id,
      entry_type: "debit",
      amount: data.discountAmount,
      reference_type: "discount_settlement",
      reference_id: row.id,
      remark: discountRemark,
      entry_date: data.entryDate,
      entry_category: "discount_received",
      created_by: me.id,
    } as never);

    if (discountLedgerError) {
      return { success: false, error: discountLedgerError.message };
    }

    await applyPurchaseBillSettlement(supabase, {
      billIds: [row.bill_id],
      amount: billAmount,
    });
  }

  await supabase
    .from("discount_settlements")
    .update({
      discount_amount: data.discountAmount,
      payment_amount: paymentAmount,
      payment_mode: data.paymentMode,
      bank_sub_mode: bankSubMode,
      bank_id: bankId,
      entry_date: data.entryDate,
      remark: data.remark || null,
      payment_reference_id: paymentReferenceId,
    } as never)
    .eq("id", row.id);

  revalidateJournalPages(bankId ?? row.bank_id);
  return { success: true };
});

export const deleteDiscountSettlement = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_discount_settlement", entityType: "transaction" },
})(async (formData, { supabase }) => {
  const parsed = deleteJournalEntrySchema.safeParse({
    entryId: formData.get("entryId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { data: settlement } = await supabase
    .from("discount_settlements")
    .select("*")
    .eq("id", parsed.data.entryId)
    .maybeSingle();

  if (!settlement) {
    return { success: false, error: "Discount settlement not found" };
  }

  const row = settlement as {
    id: string;
    party_side: "client" | "supplier";
    party_id: string;
    bill_id: string;
    bill_amount: number;
    payment_reference_id: string | null;
    bank_id: string | null;
  };

  const billAmount = roundMoney(Number(row.bill_amount));

  if (row.party_side === "client") {
    await reverseClientBillSettlement(supabase, {
      billIds: [row.bill_id],
      amount: billAmount,
    });
  } else {
    await reversePurchaseBillSettlement(supabase, {
      billIds: [row.bill_id],
      amount: billAmount,
    });
  }

  if (row.payment_reference_id) {
    await deleteLedgerByReference(supabase, {
      entityType: row.party_side,
      entityId: row.party_id,
      referenceType: "payment",
      referenceId: row.payment_reference_id,
    });
    await deleteBankLedgerByReference(supabase, row.payment_reference_id);
    await supabase
      .from(row.party_side === "client" ? "client_payments" : "supplier_payments")
      .delete()
      .eq("id", row.payment_reference_id);
  }

  await deleteLedgerByReference(supabase, {
    entityType: row.party_side,
    entityId: row.party_id,
    referenceType: "discount_settlement",
    referenceId: row.id,
  });

  await supabase.from("discount_settlements").delete().eq("id", row.id);

  revalidateJournalPages(row.bank_id);
  return { success: true };
});

async function updateClientCreditNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  me: { id: string; company_id: string },
  data: { noteId: string; amount: number; entryDate: string; remark?: string }
) {
  const { data: note } = await supabase
    .from("credit_notes")
    .select("id, client_id, invoice_id, amount, credit_note_number, is_deleted")
    .eq("id", data.noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Credit note not found" };
  }

  const oldAmount = roundMoney(Number(note.amount));
  const outstanding = await getClientBillOutstanding(supabase, note.invoice_id);
  const maxAmount = roundMoney(outstanding + oldAmount);

  if (data.amount > maxAmount + 0.02) {
    return {
      success: false,
      error: `Credit amount cannot exceed bill due of ${maxAmount}`,
    };
  }

  await reverseClientBillSettlement(supabase, {
    billIds: [note.invoice_id],
    amount: oldAmount,
  });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number")
    .eq("id", note.invoice_id)
    .maybeSingle();

  const billLabel = invoice?.invoice_number ? `#${invoice.invoice_number}` : "bill";
  const ledgerRemark =
    data.remark?.trim() || `Credit note ${note.credit_note_number} — ${billLabel}`;

  await supabase
    .from("credit_notes")
    .update({
      amount: data.amount,
      issue_date: data.entryDate,
      remark: data.remark || null,
    } as never)
    .eq("id", data.noteId);

  await deleteLedgerByReference(supabase, {
    entityType: "client",
    entityId: note.client_id,
    referenceType: "credit_note",
    referenceId: data.noteId,
  });

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "client",
    entity_id: note.client_id,
    entry_type: "credit",
    amount: data.amount,
    reference_type: "credit_note",
    reference_id: data.noteId,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: "credit_note",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  await applyClientBillSettlement(supabase, {
    billIds: [note.invoice_id],
    amount: data.amount,
  });

  return { success: true };
}

async function deleteClientCreditNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  noteId: string
) {
  const { data: note } = await supabase
    .from("credit_notes")
    .select("id, client_id, invoice_id, amount, is_deleted")
    .eq("id", noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Credit note not found" };
  }

  await reverseClientBillSettlement(supabase, {
    billIds: [note.invoice_id],
    amount: roundMoney(Number(note.amount)),
  });

  await deleteLedgerByReference(supabase, {
    entityType: "client",
    entityId: note.client_id,
    referenceType: "credit_note",
    referenceId: noteId,
  });

  await supabase
    .from("credit_notes")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() } as never)
    .eq("id", noteId);

  return { success: true };
}

async function updateClientDebitNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  me: { id: string; company_id: string },
  data: { noteId: string; amount: number; entryDate: string; remark?: string }
) {
  const { data: note } = await supabase
    .from("debit_notes")
    .select("id, client_id, invoice_id, amount, debit_note_number, is_deleted")
    .eq("id", data.noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Debit note not found" };
  }

  const oldAmount = roundMoney(Number(note.amount));
  const delta = roundMoney(data.amount - oldAmount);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, credit_amount")
    .eq("id", note.invoice_id)
    .maybeSingle();

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }

  const nextCredit = roundMoney(Number(invoice.credit_amount) + delta);
  if (nextCredit < -0.02) {
    return { success: false, error: "Debit note amount is too low" };
  }

  const billLabel = invoice.invoice_number ? `#${invoice.invoice_number}` : "bill";
  const ledgerRemark =
    data.remark?.trim() || `Debit note ${note.debit_note_number} — ${billLabel}`;

  await supabase
    .from("debit_notes")
    .update({
      amount: data.amount,
      issue_date: data.entryDate,
      remark: data.remark || null,
    } as never)
    .eq("id", data.noteId);

  await supabase
    .from("invoices")
    .update({ credit_amount: Math.max(0, nextCredit) } as never)
    .eq("id", note.invoice_id);

  await deleteLedgerByReference(supabase, {
    entityType: "client",
    entityId: note.client_id,
    referenceType: "debit_note",
    referenceId: data.noteId,
  });

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "client",
    entity_id: note.client_id,
    entry_type: "debit",
    amount: data.amount,
    reference_type: "debit_note",
    reference_id: data.noteId,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: "debit_note",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  return { success: true };
}

async function deleteClientDebitNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  noteId: string
) {
  const { data: note } = await supabase
    .from("debit_notes")
    .select("id, client_id, invoice_id, amount, is_deleted")
    .eq("id", noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Debit note not found" };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("credit_amount")
    .eq("id", note.invoice_id)
    .maybeSingle();

  if (invoice) {
    const nextCredit = roundMoney(
      Math.max(0, Number(invoice.credit_amount) - Number(note.amount))
    );
    await supabase
      .from("invoices")
      .update({ credit_amount: nextCredit } as never)
      .eq("id", note.invoice_id);
  }

  await deleteLedgerByReference(supabase, {
    entityType: "client",
    entityId: note.client_id,
    referenceType: "debit_note",
    referenceId: noteId,
  });

  await supabase
    .from("debit_notes")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() } as never)
    .eq("id", noteId);

  return { success: true };
}

async function updateSupplierCreditNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  me: { id: string; company_id: string },
  data: { noteId: string; amount: number; entryDate: string; remark?: string }
) {
  const { data: note } = await supabase
    .from("supplier_credit_notes")
    .select("id, supplier_id, purchase_invoice_id, amount, credit_note_number, is_deleted")
    .eq("id", data.noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Credit note not found" };
  }

  const oldAmount = roundMoney(Number(note.amount));
  const outstanding = await getPurchaseBillOutstanding(
    supabase,
    note.purchase_invoice_id
  );
  const maxAmount = roundMoney(outstanding + oldAmount);

  if (data.amount > maxAmount + 0.02) {
    return {
      success: false,
      error: `Credit amount cannot exceed bill due of ${maxAmount}`,
    };
  }

  await reversePurchaseBillSettlement(supabase, {
    billIds: [note.purchase_invoice_id],
    amount: oldAmount,
  });

  const { data: purchase } = await supabase
    .from("purchase_invoices")
    .select("invoice_number")
    .eq("id", note.purchase_invoice_id)
    .maybeSingle();

  const billLabel = purchase?.invoice_number ? `#${purchase.invoice_number}` : "bill";
  const ledgerRemark =
    data.remark?.trim() || `Credit note ${note.credit_note_number} — ${billLabel}`;

  await supabase
    .from("supplier_credit_notes")
    .update({
      amount: data.amount,
      issue_date: data.entryDate,
      remark: data.remark || null,
    } as never)
    .eq("id", data.noteId);

  await deleteLedgerByReference(supabase, {
    entityType: "supplier",
    entityId: note.supplier_id,
    referenceType: "supplier_credit_note",
    referenceId: data.noteId,
  });

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "supplier",
    entity_id: note.supplier_id,
    entry_type: "debit",
    amount: data.amount,
    reference_type: "supplier_credit_note",
    reference_id: data.noteId,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: "credit_note",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  await applyPurchaseBillSettlement(supabase, {
    billIds: [note.purchase_invoice_id],
    amount: data.amount,
  });

  return { success: true };
}

async function deleteSupplierCreditNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  noteId: string
) {
  const { data: note } = await supabase
    .from("supplier_credit_notes")
    .select("id, supplier_id, purchase_invoice_id, amount, is_deleted")
    .eq("id", noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Credit note not found" };
  }

  await reversePurchaseBillSettlement(supabase, {
    billIds: [note.purchase_invoice_id],
    amount: roundMoney(Number(note.amount)),
  });

  await deleteLedgerByReference(supabase, {
    entityType: "supplier",
    entityId: note.supplier_id,
    referenceType: "supplier_credit_note",
    referenceId: noteId,
  });

  await supabase
    .from("supplier_credit_notes")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() } as never)
    .eq("id", noteId);

  return { success: true };
}

async function updateSupplierDebitNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  me: { id: string; company_id: string },
  data: { noteId: string; amount: number; entryDate: string; remark?: string }
) {
  const { data: note } = await supabase
    .from("supplier_debit_notes")
    .select("id, supplier_id, purchase_invoice_id, amount, debit_note_number, is_deleted")
    .eq("id", data.noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Debit note not found" };
  }

  const oldAmount = roundMoney(Number(note.amount));
  const delta = roundMoney(data.amount - oldAmount);

  const { data: purchase } = await supabase
    .from("purchase_invoices")
    .select("invoice_number, credit_amount, total_amount")
    .eq("id", note.purchase_invoice_id)
    .maybeSingle();

  if (!purchase) {
    return { success: false, error: "Purchase bill not found" };
  }

  const nextCredit = roundMoney(Number(purchase.credit_amount) + delta);

  const billLabel = purchase.invoice_number ? `#${purchase.invoice_number}` : "bill";
  const ledgerRemark =
    data.remark?.trim() || `Debit note ${note.debit_note_number} — ${billLabel}`;

  await supabase
    .from("supplier_debit_notes")
    .update({
      amount: data.amount,
      issue_date: data.entryDate,
      remark: data.remark || null,
    } as never)
    .eq("id", data.noteId);

  await supabase
    .from("purchase_invoices")
    .update({ credit_amount: Math.max(0, nextCredit) } as never)
    .eq("id", note.purchase_invoice_id);

  await deleteLedgerByReference(supabase, {
    entityType: "supplier",
    entityId: note.supplier_id,
    referenceType: "supplier_debit_note",
    referenceId: data.noteId,
  });

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "supplier",
    entity_id: note.supplier_id,
    entry_type: "credit",
    amount: data.amount,
    reference_type: "supplier_debit_note",
    reference_id: data.noteId,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: "debit_note",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  return { success: true };
}

async function deleteSupplierDebitNote(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  noteId: string
) {
  const { data: note } = await supabase
    .from("supplier_debit_notes")
    .select("id, supplier_id, purchase_invoice_id, amount, is_deleted")
    .eq("id", noteId)
    .maybeSingle();

  if (!note || note.is_deleted) {
    return { success: false, error: "Debit note not found" };
  }

  const { data: purchase } = await supabase
    .from("purchase_invoices")
    .select("credit_amount")
    .eq("id", note.purchase_invoice_id)
    .maybeSingle();

  if (purchase) {
    const nextCredit = roundMoney(
      Math.max(0, Number(purchase.credit_amount) - Number(note.amount))
    );
    await supabase
      .from("purchase_invoices")
      .update({ credit_amount: nextCredit } as never)
      .eq("id", note.purchase_invoice_id);
  }

  await deleteLedgerByReference(supabase, {
    entityType: "supplier",
    entityId: note.supplier_id,
    referenceType: "supplier_debit_note",
    referenceId: noteId,
  });

  await supabase
    .from("supplier_debit_notes")
    .update({ is_deleted: true, deleted_at: new Date().toISOString() } as never)
    .eq("id", noteId);

  return { success: true };
}

export const updateJournalNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "update_journal_note", entityType: "transaction" },
})(async (formData, { supabase, me }) => {
  const parsed = updateJournalNoteSchema.safeParse({
    noteId: formData.get("noteId"),
    amount: formData.get("amount"),
    entryDate: formData.get("entryDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const noteType = String(formData.get("noteType") || "");
  const data = parsed.data;

  let result: { success: boolean; error?: string };
  switch (noteType) {
    case "credit_note":
      result = await updateClientCreditNote(supabase, me, data);
      break;
    case "debit_note":
      result = await updateClientDebitNote(supabase, me, data);
      break;
    case "supplier_credit_note":
      result = await updateSupplierCreditNote(supabase, me, data);
      break;
    case "supplier_debit_note":
      result = await updateSupplierDebitNote(supabase, me, data);
      break;
    default:
      return { success: false, error: "Unknown note type" };
  }

  if (!result.success) return result;
  revalidateJournalPages();
  return { success: true };
});

export const loadDiscountSettlementDetail = protectedAction<string>({
  roles: ["owner", "admin"],
})(async (settlementId, { supabase }) => {
  const { data } = await supabase
    .from("discount_settlements")
    .select(
      "id, settlement_kind, party_side, party_id, bill_id, invoice_number, bill_amount, discount_amount, payment_amount, payment_mode, bank_sub_mode, bank_id, entry_date, remark, payment_reference_id"
    )
    .eq("id", settlementId)
    .maybeSingle();

  if (!data) return { success: false, error: "Discount settlement not found" };

  const row = data as {
    bill_amount: number;
    discount_amount: number;
    payment_amount: number;
    payment_mode: "cash" | "bank";
    bank_sub_mode: "upi" | "net_banking" | null;
    bank_id: string | null;
    entry_date: string;
    remark: string | null;
  };

  return {
    success: true,
    data: {
      billAmount: roundMoney(Number(row.bill_amount)),
      discountAmount: roundMoney(Number(row.discount_amount)),
      paymentAmount: roundMoney(Number(row.payment_amount)),
      paymentMode: row.payment_mode,
      bankSubMode: row.bank_sub_mode,
      bankId: row.bank_id,
      entryDate: row.entry_date,
      remark: row.remark,
    },
  };
});

export const deleteJournalNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_journal_note", entityType: "transaction" },
})(async (formData, { supabase }) => {
  const parsed = deleteJournalEntrySchema.safeParse({
    entryId: formData.get("entryId"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const noteType = String(formData.get("noteType") || "");
  const noteId = parsed.data.entryId;

  let result: { success: boolean; error?: string };
  switch (noteType) {
    case "credit_note":
      result = await deleteClientCreditNote(supabase, noteId);
      break;
    case "debit_note":
      result = await deleteClientDebitNote(supabase, noteId);
      break;
    case "supplier_credit_note":
      result = await deleteSupplierCreditNote(supabase, noteId);
      break;
    case "supplier_debit_note":
      result = await deleteSupplierDebitNote(supabase, noteId);
      break;
    default:
      return { success: false, error: "Unknown note type" };
  }

  if (!result.success) return result;
  revalidateJournalPages();
  return { success: true };
});