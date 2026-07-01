import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { OutstandingBill, PartySearchResult } from "@/lib/types/party-bill.types";
import { entityDisplayLabel } from "@/lib/utils/entity-picker";

export type { OutstandingBill, PartySearchResult } from "@/lib/types/party-bill.types";

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function billOutstanding(
  total: number,
  cash: number,
  bank: number,
  credit: number
): number {
  const pending = credit > 0.01 ? credit : Math.max(0, total - cash - bank);
  return Math.round(pending * 100) / 100;
}

function billSearchLabel(
  invoiceNumber: string,
  partyName: string,
  partyAlias: string | null
) {
  const party = partyAlias ? `${partyName} (${partyAlias})` : partyName;
  return `${invoiceNumber} · ${party}`;
}

function isDigitOnlyQuery(query: string) {
  return /^\d+$/.test(query);
}

function invoiceNumberEndsWith(invoiceNumber: string, digits: string) {
  return invoiceNumber.endsWith(digits);
}

export async function searchPartiesAndBills(
  query: string,
  side: "client" | "supplier"
): Promise<PartySearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const namePattern = `%${q}%`;
  const digitQuery = isDigitOnlyQuery(q);
  const billPattern = digitQuery ? `%${q}` : null;
  const limit = 8;
  const results: PartySearchResult[] = [];
  const seenPartyIds = new Set<string>();
  const seenBillIds = new Set<string>();

  if (side === "client") {
    const { data: parties } = await supabase
      .from("clients")
      .select("id, name, alias")
      .eq("is_deleted", false)
      .or(`name.ilike.${namePattern},alias.ilike.${namePattern}`)
      .limit(limit);

    for (const row of parties ?? []) {
      seenPartyIds.add(row.id);
      results.push({
        type: "party",
        partyId: row.id,
        name: row.name,
        alias: row.alias,
        label: entityDisplayLabel(row),
      });
    }

    if (billPattern) {
      const { data: bills } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, total_amount, cash_amount, bank_amount, credit_amount, clients(id, name, alias)"
        )
        .eq("is_deleted", false)
        .not("invoice_number", "is", null)
        .ilike("invoice_number", billPattern)
        .limit(limit * 2);

      for (const row of bills ?? []) {
        if (!row.invoice_number || seenBillIds.has(row.id)) continue;
        if (!invoiceNumberEndsWith(row.invoice_number, q)) continue;

        const client = row.clients as { id: string; name: string; alias: string | null } | null;
        if (!client) continue;

        const totalAmount = parseAmount(row.total_amount);
        const outstanding = billOutstanding(
          totalAmount,
          parseAmount(row.cash_amount),
          parseAmount(row.bank_amount),
          parseAmount(row.credit_amount)
        );

        seenBillIds.add(row.id);
        results.push({
          type: "bill",
          billId: row.id,
          invoiceNumber: row.invoice_number,
          partyId: client.id,
          partyName: client.name,
          partyAlias: client.alias,
          totalAmount,
          outstanding,
          label: billSearchLabel(row.invoice_number, client.name, client.alias),
        });
      }
    }
  } else {
    const { data: parties } = await supabase
      .from("suppliers")
      .select("id, name, alias")
      .eq("is_deleted", false)
      .or(`name.ilike.${namePattern},alias.ilike.${namePattern}`)
      .limit(limit);

    for (const row of parties ?? []) {
      seenPartyIds.add(row.id);
      results.push({
        type: "party",
        partyId: row.id,
        name: row.name,
        alias: row.alias,
        label: entityDisplayLabel(row),
      });
    }

    if (billPattern) {
      const { data: bills } = await supabase
        .from("purchase_invoices")
        .select(
          "id, invoice_number, total_amount, invoice_type, suppliers(id, name, alias)"
        )
        .eq("is_deleted", false)
        .eq("invoice_type", "purchase")
        .not("invoice_number", "is", null)
        .ilike("invoice_number", billPattern)
        .limit(limit * 2);

      for (const row of bills ?? []) {
        if (!row.invoice_number || seenBillIds.has(row.id)) continue;
        if (!invoiceNumberEndsWith(row.invoice_number, q)) continue;

        const supplier = row.suppliers as { id: string; name: string; alias: string | null } | null;
        if (!supplier) continue;

        const totalAmount = parseAmount(row.total_amount);

        seenBillIds.add(row.id);
        results.push({
          type: "bill",
          billId: row.id,
          invoiceNumber: row.invoice_number,
          partyId: supplier.id,
          partyName: supplier.name,
          partyAlias: supplier.alias,
          totalAmount,
          outstanding: totalAmount,
          label: billSearchLabel(row.invoice_number, supplier.name, supplier.alias),
        });
      }
    }
  }

  return results.slice(0, limit);
}

export async function getOutstandingBillsForParty(
  partyId: string,
  side: "client" | "supplier"
): Promise<OutstandingBill[]> {
  const supabase = await createClient();

  if (side === "client") {
    const { data } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, invoice_date, total_amount, cash_amount, bank_amount, credit_amount"
      )
      .eq("client_id", partyId)
      .eq("is_deleted", false)
      .order("invoice_date", { ascending: false });

    return (data ?? [])
      .map((row) => {
        const outstanding = billOutstanding(
          parseAmount(row.total_amount),
          parseAmount(row.cash_amount),
          parseAmount(row.bank_amount),
          parseAmount(row.credit_amount)
        );
        return {
          id: row.id,
          invoiceNumber: row.invoice_number,
          invoiceDate: row.invoice_date,
          totalAmount: parseAmount(row.total_amount),
          outstanding,
        };
      })
      .filter((bill) => bill.outstanding > 0.01);
  }

  const { data } = await supabase
    .from("purchase_invoices")
    .select("id, invoice_number, invoice_date, total_amount, invoice_type")
    .eq("supplier_id", partyId)
    .eq("is_deleted", false)
    .eq("invoice_type", "purchase")
    .order("invoice_date", { ascending: false });

  return (data ?? []).map((row) => ({
    id: row.id,
    invoiceNumber: row.invoice_number,
    invoiceDate: row.invoice_date,
    totalAmount: parseAmount(row.total_amount),
    outstanding: parseAmount(row.total_amount),
  }));
}

export async function getBillReference(
  billId: string,
  side: "client" | "supplier"
): Promise<{ invoiceNumber: string; partyId: string } | null> {
  const supabase = await createClient();

  if (side === "client") {
    const { data } = await supabase
      .from("invoices")
      .select("invoice_number, client_id")
      .eq("id", billId)
      .eq("is_deleted", false)
      .maybeSingle();

    if (!data?.invoice_number) return null;
    return { invoiceNumber: data.invoice_number, partyId: data.client_id };
  }

  const { data } = await supabase
    .from("purchase_invoices")
    .select("invoice_number, supplier_id")
    .eq("id", billId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!data?.invoice_number) return null;
  return { invoiceNumber: data.invoice_number, partyId: data.supplier_id };
}