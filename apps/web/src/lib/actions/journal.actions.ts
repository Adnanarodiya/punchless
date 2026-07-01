"use server";

import { revalidatePath } from "next/cache";

import { protectedAction } from "@/lib/server/protected-action";
import { insertBankLedgerEntry, bankModeLabel, normalizeBankSubMode } from "@/lib/utils/bank-ledger";
import {
  formatCreditNoteNumber,
  formatDebitNoteNumber,
  parseNoteSequence,
} from "@/lib/utils/journal-number";
import { resolveBankIdForPayment } from "@/lib/utils/resolve-bank-id";
import {
  applyClientBillSettlement,
  applyPurchaseBillSettlement,
  getClientBillOutstanding,
  getPurchaseBillOutstanding,
} from "@/lib/utils/settlement";
import {
  creditNoteSchema,
  debitNoteSchema,
  discountSettlementSchema,
} from "@/lib/validations/journal.schema";

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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function nextCreditNoteNumber(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  companyId: string
) {
  const { data } = await supabase
    .from("credit_notes")
    .select("credit_note_number")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  const maxSeq = (data ?? []).reduce((max, row) => {
    const seq = parseNoteSequence(
      (row as { credit_note_number: string }).credit_note_number,
      "CN"
    );
    return Math.max(max, seq);
  }, 0);

  return formatCreditNoteNumber(maxSeq + 1);
}

async function nextDebitNoteNumber(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  companyId: string
) {
  const { data } = await supabase
    .from("debit_notes")
    .select("debit_note_number")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);

  const maxSeq = (data ?? []).reduce((max, row) => {
    const seq = parseNoteSequence(
      (row as { debit_note_number: string }).debit_note_number,
      "DN"
    );
    return Math.max(max, seq);
  }, 0);

  return formatDebitNoteNumber(maxSeq + 1);
}

export const createDiscountSettlement = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_discount_settlement", entityType: "transaction" },
})(async (formData, { supabase, me }) => {
  const paymentMode = String(formData.get("paymentMode") || "");
  const resolvedBankId = await resolveBankIdForPayment(
    supabase,
    paymentMode,
    String(formData.get("bankId") || "")
  );

  const parsed = discountSettlementSchema.safeParse({
    settlementKind: formData.get("settlementKind"),
    partySide: formData.get("partySide"),
    partyId: formData.get("partyId"),
    billId: formData.get("billId"),
    billAmount: formData.get("billAmount"),
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
  const paymentAmount = roundMoney(data.billAmount - data.discountAmount);
  const bankSubMode =
    data.paymentMode === "bank" && data.bankSubMode ? data.bankSubMode : null;
  const bankId = data.bankId?.trim() ? data.bankId : null;
  const modeLabel = data.paymentMode === "cash" ? "cash" : bankModeLabel(bankSubMode);

  const liveOutstanding =
    data.partySide === "client"
      ? await getClientBillOutstanding(supabase, data.billId)
      : await getPurchaseBillOutstanding(supabase, data.billId);

  if (Math.abs(liveOutstanding - data.billAmount) > 0.02) {
    return {
      success: false,
      error: `Bill due is ${liveOutstanding}. Refresh and try again.`,
    };
  }

  const { data: billRef } = await supabase
    .from(data.partySide === "client" ? "invoices" : "purchase_invoices")
    .select("invoice_number")
    .eq("id", data.billId)
    .maybeSingle();

  const invoiceNumber = (billRef as { invoice_number: string | null } | null)?.invoice_number;
  const billLabel = invoiceNumber ? `#${invoiceNumber}` : "bill";

  const { data: settlement, error: settlementError } = await supabase
    .from("discount_settlements")
    .insert({
      company_id: me.company_id,
      settlement_kind: data.settlementKind,
      party_side: data.partySide,
      party_id: data.partyId,
      bill_id: data.billId,
      bill_side: data.partySide,
      invoice_number: invoiceNumber,
      bill_amount: data.billAmount,
      discount_amount: data.discountAmount,
      payment_amount: paymentAmount,
      payment_mode: data.paymentMode,
      bank_sub_mode: bankSubMode,
      bank_id: bankId,
      entry_date: data.entryDate,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (settlementError || !settlement) {
    return { success: false, error: settlementError?.message || "Failed to save discount" };
  }

  const settlementId = settlement.id;
  const discountRemark =
    data.remark?.trim() ||
    (data.settlementKind === "given"
      ? `Discount given — ${billLabel}`
      : `Discount received — ${billLabel}`);
  const paymentRemark =
    data.settlementKind === "given"
      ? `Payment received (${modeLabel}) — ${billLabel}`
      : `Payment made (${modeLabel}) — ${billLabel}`;

  let paymentReferenceId: string | null = null;

  if (data.partySide === "client") {
    if (paymentAmount > 0.01) {
      const { data: payment, error: paymentError } = await supabase
        .from("client_payments")
        .insert({
          company_id: me.company_id,
          client_id: data.partyId,
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
        entity_id: data.partyId,
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
      entity_id: data.partyId,
      entry_type: "credit",
      amount: data.discountAmount,
      payment_mode: null,
      bank_sub_mode: null,
      bank_id: null,
      reference_type: "discount_settlement",
      reference_id: settlementId,
      remark: discountRemark,
      entry_date: data.entryDate,
      entry_category: "discount_given",
      created_by: me.id,
    } as never);

    if (discountLedgerError) {
      return { success: false, error: discountLedgerError.message };
    }

    await applyClientBillSettlement(supabase, {
      billIds: [data.billId],
      amount: data.billAmount,
    });
  } else {
    if (paymentAmount > 0.01) {
      const { data: payment, error: paymentError } = await supabase
        .from("supplier_payments")
        .insert({
          company_id: me.company_id,
          supplier_id: data.partyId,
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
        entity_id: data.partyId,
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
      entity_id: data.partyId,
      entry_type: "debit",
      amount: data.discountAmount,
      payment_mode: null,
      bank_sub_mode: null,
      bank_id: null,
      reference_type: "discount_settlement",
      reference_id: settlementId,
      remark: discountRemark,
      entry_date: data.entryDate,
      entry_category: "discount_received",
      created_by: me.id,
    } as never);

    if (discountLedgerError) {
      return { success: false, error: discountLedgerError.message };
    }

    await applyPurchaseBillSettlement(supabase, {
      billIds: [data.billId],
      amount: data.billAmount,
    });
  }

  if (paymentReferenceId) {
    await supabase
      .from("discount_settlements")
      .update({ payment_reference_id: paymentReferenceId } as never)
      .eq("id", settlementId);
  }

  revalidateJournalPages(bankId);
  return { success: true };
});

export const createCreditNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_credit_note", entityType: "invoice" },
})(async (formData, { supabase, me }) => {
  const parsed = creditNoteSchema.safeParse({
    clientId: formData.get("clientId"),
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    entryDate: formData.get("entryDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;
  const outstanding = await getClientBillOutstanding(supabase, data.invoiceId);

  if (data.amount > outstanding + 0.02) {
    return {
      success: false,
      error: `Credit amount cannot exceed bill due of ${outstanding}`,
    };
  }

  const { data: invoice } = await supabase
    .from("invoices")
    .select("client_id, invoice_number, is_deleted")
    .eq("id", data.invoiceId)
    .maybeSingle();

  if (!invoice || invoice.is_deleted) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.client_id !== data.clientId) {
    return { success: false, error: "Invoice does not belong to this customer" };
  }

  const noteNumber = await nextCreditNoteNumber(supabase, me.company_id);
  const billLabel = invoice.invoice_number ? `#${invoice.invoice_number}` : "bill";
  const ledgerRemark = data.remark?.trim() || `Credit note ${noteNumber} — ${billLabel}`;

  const { data: note, error: noteError } = await supabase
    .from("credit_notes")
    .insert({
      company_id: me.company_id,
      credit_note_number: noteNumber,
      invoice_id: data.invoiceId,
      client_id: data.clientId,
      issue_date: data.entryDate,
      amount: data.amount,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (noteError || !note) {
    return { success: false, error: noteError?.message || "Failed to create credit note" };
  }

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "client",
    entity_id: data.clientId,
    entry_type: "credit",
    amount: data.amount,
    reference_type: "credit_note",
    reference_id: note.id,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: "credit_note",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  await applyClientBillSettlement(supabase, {
    billIds: [data.invoiceId],
    amount: data.amount,
  });

  revalidateJournalPages();
  return { success: true, data: { creditNoteNumber: noteNumber } };
});

export const createDebitNote = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_debit_note", entityType: "invoice" },
})(async (formData, { supabase, me }) => {
  const parsed = debitNoteSchema.safeParse({
    clientId: formData.get("clientId"),
    invoiceId: formData.get("invoiceId"),
    amount: formData.get("amount"),
    entryDate: formData.get("entryDate"),
    remark: formData.get("remark"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const data = parsed.data;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("client_id, invoice_number, credit_amount, is_deleted")
    .eq("id", data.invoiceId)
    .maybeSingle();

  if (!invoice || invoice.is_deleted) {
    return { success: false, error: "Invoice not found" };
  }

  if (invoice.client_id !== data.clientId) {
    return { success: false, error: "Invoice does not belong to this customer" };
  }

  const noteNumber = await nextDebitNoteNumber(supabase, me.company_id);
  const billLabel = invoice.invoice_number ? `#${invoice.invoice_number}` : "bill";
  const ledgerRemark = data.remark?.trim() || `Debit note ${noteNumber} — ${billLabel}`;

  const { data: note, error: noteError } = await supabase
    .from("debit_notes")
    .insert({
      company_id: me.company_id,
      debit_note_number: noteNumber,
      invoice_id: data.invoiceId,
      client_id: data.clientId,
      issue_date: data.entryDate,
      amount: data.amount,
      remark: data.remark || null,
      created_by: me.id,
    } as never)
    .select("id")
    .single();

  if (noteError || !note) {
    return { success: false, error: noteError?.message || "Failed to create debit note" };
  }

  const nextCredit =
    roundMoney(Number(invoice.credit_amount) + data.amount);

  const { error: invoiceError } = await supabase
    .from("invoices")
    .update({ credit_amount: nextCredit } as never)
    .eq("id", data.invoiceId);

  if (invoiceError) {
    return { success: false, error: invoiceError.message };
  }

  const { error: ledgerError } = await supabase.from("ledger_entries").insert({
    company_id: me.company_id,
    entity_type: "client",
    entity_id: data.clientId,
    entry_type: "debit",
    amount: data.amount,
    reference_type: "debit_note",
    reference_id: note.id,
    remark: ledgerRemark,
    entry_date: data.entryDate,
    entry_category: "debit_note",
    created_by: me.id,
  } as never);

  if (ledgerError) {
    return { success: false, error: ledgerError.message };
  }

  revalidateJournalPages();
  return { success: true, data: { debitNoteNumber: noteNumber } };
});