"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  buildClientMatchCaches,
  registerClientInCaches,
  resolveClientMatch,
} from "@/lib/utils/client-match";
import { parseSalesRegisterFile } from "@/lib/utils/sales-register-parser";

const IMPORT_REMARK = "Imported from Sales Register";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function splitGstFromGross(gross: number, gstin: string | null) {
  const g = round2(gross);
  if (!g) return null;
  if (gstin && gstin.trim()) {
    const taxable = round2(g / 1.18);
    const gstAmount = round2(g - taxable);
    return { taxable, gstPercent: 18, gstAmount, total: g };
  }
  return { taxable: g, gstPercent: 0, gstAmount: 0, total: g };
}

type DateBucket = {
  count: number;
  total: number;
  clientsCreated: number;
  skipped: number;
};

export const uploadSalesRegister = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "upload_sales_register", entityType: "sales_register_import" },
})(async (formData, { supabase, me }) => {
  const file = formData.get("file");
  const forceReplace = formData.get("replace") === "1";

  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a sales register .csv or .xlsx file to upload." };
  }

  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".csv") && !lower.endsWith(".xlsx")) {
    return { success: false, error: "Only .csv or .xlsx sales register exports are supported." };
  }

  let parsedFile;
  try {
    const buffer = await file.arrayBuffer();
    parsedFile = parseSalesRegisterFile(buffer, file.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse sales register file.";
    return { success: false, error: message };
  }

  if (parsedFile.dates.length === 0) {
    return { success: false, error: "No dates found in the sales register file." };
  }

  const { data: existingImports } = await supabase
    .from("sales_register_imports")
    .select("entry_date, file_name, invoice_count, total_amount")
    .eq("company_id", me.company_id)
    .in("entry_date", parsedFile.dates);

  const existingByDate = new Map(
    (existingImports ?? []).map((row) => [
      (row as { entry_date: string }).entry_date,
      row as { entry_date: string; file_name: string; invoice_count: number; total_amount: number },
    ])
  );

  const skippedDays = parsedFile.dates.filter((d) => existingByDate.has(d) && !forceReplace);

  const rowsToImport = parsedFile.rows.filter(
    (row) => forceReplace || !existingByDate.has(row.date)
  );

  if (rowsToImport.length === 0) {
    revalidatePath("/dashboard/todays-entry");
    const lastDate = parsedFile.dates.at(-1)!;
    return {
      success: true,
      data: {
        entryDate: lastDate,
        alreadyExists: true,
        allDatesSaved: true,
        daysInFile: parsedFile.dates.length,
        skippedDays: skippedDays.length,
        dates: parsedFile.dates,
      },
    };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, gst_number")
    .eq("company_id", me.company_id)
    .eq("is_deleted", false);

  const caches = buildClientMatchCaches(
    ((clients ?? []) as Array<{ id: string; name: string; gst_number: string | null }>).map(
      (row) => ({
        id: row.id,
        name: row.name,
        gst_number: row.gst_number,
      })
    )
  );

  const invoiceNumbers = [
    ...new Set(rowsToImport.map((row) => row.invoiceNo).filter(Boolean) as string[]),
  ];
  const existingInvoiceNos = new Set<string>();

  if (invoiceNumbers.length > 0) {
    const { data: existingInvoices } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("company_id", me.company_id)
      .eq("is_deleted", false)
      .in("invoice_number", invoiceNumbers);

    for (const row of existingInvoices ?? []) {
      const no = (row as { invoice_number: string | null }).invoice_number;
      if (no) existingInvoiceNos.add(no);
    }
  }

  const stats = {
    imported: 0,
    skippedInvoices: 0,
    clientsCreated: 0,
    matchedByName: 0,
    matchedByGst: 0,
    totalAmount: 0,
    byDate: new Map<string, DateBucket>(),
  };

  function touchDate(date: string): DateBucket {
    const bucket = stats.byDate.get(date) ?? {
      count: 0,
      total: 0,
      clientsCreated: 0,
      skipped: 0,
    };
    stats.byDate.set(date, bucket);
    return bucket;
  }

  for (const row of rowsToImport) {
    const bucket = touchDate(row.date);

    if (row.invoiceNo && existingInvoiceNos.has(row.invoiceNo)) {
      stats.skippedInvoices += 1;
      bucket.skipped += 1;
      continue;
    }

    const match = resolveClientMatch(caches, row.particular, row.gstin);
    let clientId = match.clientId;

    if (!clientId) {
      const { data: createdClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_id: me.company_id,
          name: match.name,
          gst_number: match.gst,
          opening_balance: 0,
        } as never)
        .select("id")
        .single();

      if (clientError || !createdClient) {
        return {
          success: false,
          error: clientError?.message ?? `Could not create customer "${match.name}".`,
        };
      }

      clientId = (createdClient as { id: string }).id;
      registerClientInCaches(caches, clientId, match.name, match.gst);
      stats.clientsCreated += 1;
      bucket.clientsCreated += 1;
    } else if (match.matchedBy === "name") {
      stats.matchedByName += 1;
    } else if (match.matchedBy === "gst") {
      stats.matchedByGst += 1;
    }

    const gst = splitGstFromGross(row.grossAmount, match.gst ?? row.gstin);
    if (!gst) continue;

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        company_id: me.company_id,
        client_id: clientId,
        invoice_number: row.invoiceNo,
        invoice_date: row.date,
        taxable_amount: gst.taxable,
        gst_percent: gst.gstPercent,
        gst_amount: gst.gstAmount,
        total_amount: gst.total,
        payment_mode: "credit",
        cash_amount: 0,
        bank_amount: 0,
        credit_amount: gst.total,
        remark: IMPORT_REMARK,
        created_by: me.id,
      } as never)
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      stats.skippedInvoices += 1;
      bucket.skipped += 1;
      continue;
    }

    const invoiceId = (invoice as { id: string }).id;

    await supabase.from("invoice_line_items").insert({
      invoice_id: invoiceId,
      description: "Workshop services",
      quantity: 1,
      unit_price: gst.taxable,
      gst_percent: gst.gstPercent,
      amount: gst.taxable,
      sort_order: 0,
    } as never);

    await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "client",
      entity_id: clientId,
      entry_type: "debit",
      amount: gst.total,
      reference_type: "invoice",
      reference_id: invoiceId,
      remark: row.invoiceNo ? `Tax invoice #${row.invoiceNo}` : "Tax invoice",
      entry_date: row.date,
      created_by: me.id,
    } as never);

    if (row.invoiceNo) existingInvoiceNos.add(row.invoiceNo);

    stats.imported += 1;
    stats.totalAmount = round2(stats.totalAmount + gst.total);
    bucket.count += 1;
    bucket.total = round2(bucket.total + gst.total);
  }

  for (const [date, bucket] of stats.byDate) {
    if (bucket.count === 0 && bucket.skipped === 0) continue;

    if (forceReplace && existingByDate.has(date)) {
      await supabase
        .from("sales_register_imports")
        .delete()
        .eq("company_id", me.company_id)
        .eq("entry_date", date);
    }

    if (bucket.count > 0) {
      await supabase.from("sales_register_imports").insert({
        company_id: me.company_id,
        entry_date: date,
        file_name: file.name,
        invoice_count: bucket.count,
        total_amount: bucket.total,
        clients_created: bucket.clientsCreated,
        skipped_existing: bucket.skipped,
        uploaded_by: me.id,
      } as never);
    }
  }

  revalidatePath("/dashboard/todays-entry");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/daily-report");

  const datesImported = [...stats.byDate.entries()]
    .filter(([, b]) => b.count > 0)
    .map(([d]) => d)
    .sort();
  const primaryDate = datesImported.at(-1) ?? parsedFile.dates.at(-1)!;

  return {
    success: true,
    data: {
      entryDate: primaryDate,
      alreadyExists: false,
      imported: stats.imported,
      skippedInvoices: stats.skippedInvoices,
      skippedDays: skippedDays.length,
      daysImported: datesImported.length,
      clientsCreated: stats.clientsCreated,
      matchedByName: stats.matchedByName,
      matchedByGst: stats.matchedByGst,
      totalAmount: stats.totalAmount,
      datesImported,
      fileDateRange: {
        from: parsedFile.dates[0],
        to: parsedFile.dates.at(-1)!,
      },
    },
  };
});