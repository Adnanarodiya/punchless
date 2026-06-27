/**
 * Import Shahin Motors data from full data.xlsx
 *
 * Sheets:
 * - CLOSING BALANCE 31-03-2026 → customer opening B/F on 2026-04-01 (FY 2026-27)
 * - Sales Register → credit invoices (Apr–Jun 2026)
 * - BANK / CASH → Kotak opening + receipts/payments
 *
 * Usage:
 *   node scripts/import-full-data.mjs --dry-run
 *   node scripts/import-full-data.mjs --confirm
 *   node scripts/import-full-data.mjs --confirm --file="full data.xlsx"
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const KEEPER_EMAIL = "aiarodiya07@gmail.com";
const FY_OPEN_DATE = "2026-04-01";
const CLOSING_BALANCE_REMARK = "Closing balance B/F (FY 2025-26 as on 31-Mar-2026)";

function loadEnv() {
  const text = readFileSync(resolve(root, ".env"), "utf8");
  const vars = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--confirm");
  const fileArg = args.find((a) => a.startsWith("--file="));
  const file = fileArg ? fileArg.slice(7) : "full data.xlsx";
  return { dryRun, file: resolve(root, file) };
}

function excelDate(serial) {
  if (typeof serial !== "number" || !Number.isFinite(serial)) return null;
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d.toISOString().slice(0, 10);
}

function normName(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseNameGst(raw) {
  const text = String(raw || "").replace(/\r/g, "").trim();
  const m = text.match(/^(.+?)\s*\(([0-9A-Z]{15})\)\s*$/i);
  if (m) return { name: m[1].trim(), gst: m[2].toUpperCase() };
  return { name: text, gst: null };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function splitGstFromGross(gross, gstin) {
  const g = round2(parseFloat(gross) || 0);
  if (!g) return null;
  if (gstin && String(gstin).trim()) {
    const taxable = round2(g / 1.18);
    const gstAmount = round2(g - taxable);
    return { taxable, gstPercent: 18, gstAmount, total: g };
  }
  return { taxable: g, gstPercent: 0, gstAmount: 0, total: g };
}

function findClientId(map, particular) {
  const key = normName(particular);
  if (map.has(key)) return map.get(key);
  for (const [k, id] of map) {
    if (key.includes(k) || k.includes(key)) return id;
  }
  return null;
}

async function ensureClient(admin, ctx, row) {
  const { name, gst } = parseNameGst(row.name);
  const key = normName(name);
  if (ctx.clientMap.has(key)) return ctx.clientMap.get(key);

  if (ctx.dryRun) {
    const fakeId = `dry-${key.slice(0, 8)}`;
    ctx.clientMap.set(key, fakeId);
    return fakeId;
  }

  const { data, error } = await admin
    .from("clients")
    .insert({
      company_id: ctx.companyId,
      name,
      gst_number: gst,
      opening_balance: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Client insert failed (${name}): ${error.message}`);
  ctx.clientMap.set(key, data.id);
  ctx.stats.clientsCreated += 1;
  return data.id;
}

async function addClientOpening(admin, ctx, clientId, netDue, name) {
  if (netDue <= 0) {
    if (netDue < 0 && !ctx.dryRun) {
      await admin.from("ledger_entries").insert({
        company_id: ctx.companyId,
        entity_type: "client",
        entity_id: clientId,
        entry_type: "credit",
        amount: Math.abs(netDue),
        reference_type: "opening_balance",
        reference_id: clientId,
        remark: `${CLOSING_BALANCE_REMARK} (advance)`,
        entry_date: FY_OPEN_DATE,
        created_by: ctx.userId,
      });
      ctx.stats.clientAdvances += 1;
    }
    return;
  }

  if (ctx.dryRun) {
    ctx.stats.clientOpening += netDue;
    return;
  }

  await admin.from("clients").update({ opening_balance: netDue }).eq("id", clientId);
  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "client",
    entity_id: clientId,
    entry_type: "debit",
    amount: netDue,
    reference_type: "opening_balance",
    reference_id: clientId,
    remark: CLOSING_BALANCE_REMARK,
    entry_date: FY_OPEN_DATE,
    created_by: ctx.userId,
  });
  ctx.stats.clientOpening += netDue;
}

async function importClosingBalance(admin, ctx, rows) {
  console.log("\n1) Closing balance → customer opening B/F on", FY_OPEN_DATE);
  for (const row of rows) {
    const clientId = await ensureClient(admin, ctx, row);
    await addClientOpening(admin, ctx, clientId, row.net, row.name);
  }
  console.log(`   ${rows.length} customers, opening due ₹${round2(ctx.stats.clientOpening)}`);
}

async function importInvoices(admin, ctx, rows) {
  console.log("\n2) Sales register → invoices (credit / udhar)");
  for (const row of rows) {
    let clientId = findClientId(ctx.clientMap, row.particular);
    if (!clientId) {
      clientId = await ensureClient(admin, ctx, { name: row.particular, gst: row.gstin });
    }

    const gst = splitGstFromGross(row.amount, row.gstin);
    if (!gst) continue;

    if (ctx.dryRun) {
      ctx.stats.invoices += 1;
      continue;
    }

    const { data: invoice, error } = await admin
      .from("invoices")
      .insert({
        company_id: ctx.companyId,
        client_id: clientId,
        invoice_number: row.invoiceNo || null,
        invoice_date: row.date,
        taxable_amount: gst.taxable,
        gst_percent: gst.gstPercent,
        gst_amount: gst.gstAmount,
        total_amount: gst.total,
        payment_mode: "credit",
        cash_amount: 0,
        bank_amount: 0,
        credit_amount: gst.total,
        remark: "Imported from Sales Register",
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (error) {
      ctx.stats.invoiceErrors += 1;
      continue;
    }

    await admin.from("invoice_line_items").insert({
      invoice_id: invoice.id,
      description: "Workshop services",
      quantity: 1,
      unit_price: gst.taxable,
      gst_percent: gst.gstPercent,
      amount: gst.taxable,
      sort_order: 0,
    });

    await admin.from("ledger_entries").insert({
      company_id: ctx.companyId,
      entity_type: "client",
      entity_id: clientId,
      entry_type: "debit",
      amount: gst.total,
      reference_type: "invoice",
      reference_id: invoice.id,
      remark: row.invoiceNo ? `Tax invoice #${row.invoiceNo}` : "Tax invoice",
      entry_date: row.date,
      created_by: ctx.userId,
    });

    ctx.stats.invoices += 1;
    if (ctx.stats.invoices % 100 === 0) {
      console.log(`   … ${ctx.stats.invoices} invoices`);
    }
  }
  console.log(`   ${ctx.stats.invoices} invoices (${ctx.stats.invoiceErrors} skipped)`);
}

async function ensureBank(admin, ctx, openingBalance) {
  if (ctx.bankId) return ctx.bankId;
  if (ctx.dryRun) {
    ctx.bankId = "dry-bank";
    return ctx.bankId;
  }

  const { data, error } = await admin
    .from("bank_accounts")
    .insert({
      company_id: ctx.companyId,
      bank_name: "Kotak Mahindra Bank",
      account_name: "Kotak 4112748249",
      account_number: "4112748249",
      opening_balance: openingBalance,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Bank insert failed: ${error.message}`);

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "bank",
    entity_id: data.id,
    entry_type: "credit",
    amount: openingBalance,
    payment_mode: "bank",
    bank_id: data.id,
    reference_type: "opening_balance",
    reference_id: data.id,
    remark: "Opening balance (imported from BANK sheet)",
    entry_date: FY_OPEN_DATE,
    created_by: ctx.userId,
  });

  ctx.bankId = data.id;
  return data.id;
}

async function recordClientPayment(admin, ctx, { clientId, amount, mode, date, remark, bankId }) {
  if (ctx.dryRun) {
    ctx.stats.clientPayments += 1;
    return;
  }

  const { data: payment, error } = await admin
    .from("client_payments")
    .insert({
      company_id: ctx.companyId,
      client_id: clientId,
      amount,
      payment_mode: mode,
      payment_date: date,
      remark,
      bank_id: bankId ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return;

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "client",
    entity_id: clientId,
    entry_type: "credit",
    amount,
    payment_mode: mode,
    bank_id: bankId ?? null,
    reference_type: "payment",
    reference_id: payment.id,
    remark: remark || `Payment received (${mode})`,
    entry_date: date,
    created_by: ctx.userId,
  });

  if (mode === "bank" && bankId) {
    await admin.from("bank_transactions").insert({
      company_id: ctx.companyId,
      bank_id: bankId,
      transaction_type: "deposit",
      amount,
      transaction_date: date,
      remark,
      created_by: ctx.userId,
    });
    await admin.from("ledger_entries").insert({
      company_id: ctx.companyId,
      entity_type: "bank",
      entity_id: bankId,
      entry_type: "credit",
      amount,
      payment_mode: "bank",
      bank_id: bankId,
      reference_type: "bank_transaction",
      reference_id: payment.id,
      remark,
      entry_date: date,
      created_by: ctx.userId,
    });
  }

  ctx.stats.clientPayments += 1;
}

async function recordExpense(admin, ctx, { particular, amount, mode, date, bankId }) {
  if (ctx.dryRun) {
    ctx.stats.expenses += 1;
    return;
  }

  const { data: tx, error } = await admin
    .from("transactions")
    .insert({
      company_id: ctx.companyId,
      particular,
      amount,
      transaction_type: "expense",
      payment_mode: mode,
      bank_id: bankId ?? null,
      transaction_date: date,
      remark: "Imported from cash/bank book",
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return;

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "expense",
    entity_id: tx.id,
    entry_type: "debit",
    amount,
    payment_mode: mode,
    bank_id: bankId ?? null,
    reference_type: "expense",
    reference_id: tx.id,
    remark: `Expense: ${particular} (${mode})`,
    entry_date: date,
    created_by: ctx.userId,
  });

  if (mode === "bank" && bankId) {
    await admin.from("bank_transactions").insert({
      company_id: ctx.companyId,
      bank_id: bankId,
      transaction_type: "withdrawal",
      amount,
      transaction_date: date,
      remark: particular,
      created_by: ctx.userId,
    });
    await admin.from("ledger_entries").insert({
      company_id: ctx.companyId,
      entity_type: "bank",
      entity_id: bankId,
      entry_type: "debit",
      amount,
      payment_mode: "bank",
      bank_id: bankId,
      reference_type: "bank_transaction",
      reference_id: tx.id,
      remark: particular,
      entry_date: date,
      created_by: ctx.userId,
    });
  }

  ctx.stats.expenses += 1;
}

async function importCashBankBook(admin, ctx, rows, mode) {
  const label = mode === "bank" ? "BANK" : "CASH";
  console.log(`\n3) ${label} book → receipts & payments`);

  let bankOpening = 0;
  for (const row of rows) {
    if (row.type === "opening") {
      if (mode === "bank") bankOpening = row.amount;
      continue;
    }
    if (row.type === "total" || row.type === "closing") continue;

    const clientId = findClientId(ctx.clientMap, row.particular);
    if (row.direction === "receipt" && clientId) {
      await recordClientPayment(admin, ctx, {
        clientId,
        amount: row.amount,
        mode,
        date: row.date,
        remark: `Imported ${label} receipt`,
        bankId: mode === "bank" ? await ensureBank(admin, ctx, bankOpening) : null,
      });
    } else if (row.direction === "payment") {
      const bankId =
        mode === "bank" ? await ensureBank(admin, ctx, bankOpening) : null;
      await recordExpense(admin, ctx, {
        particular: row.particular,
        amount: row.amount,
        mode,
        date: row.date,
        bankId,
      });
    } else {
      ctx.stats.unmatched += 1;
    }
  }

  if (mode === "bank" && bankOpening > 0) {
    await ensureBank(admin, ctx, bankOpening);
    console.log(`   Kotak opening balance ₹${bankOpening}`);
  }

  console.log(
    `   client payments ${ctx.stats.clientPayments}, expenses ${ctx.stats.expenses}, unmatched ${ctx.stats.unmatched}`
  );
}

function parseClosingSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 8; i < rows.length; i++) {
    const name = String(rows[i][0] || "").trim();
    if (!name || name === "Grand Total") continue;
    const dr = parseFloat(rows[i][1]) || 0;
    const cr = parseFloat(rows[i][2]) || 0;
    out.push({ name, net: round2(dr - cr) });
  }
  return out;
}

function parseSalesSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 8; i < rows.length; i++) {
    const date = excelDate(rows[i][0]);
    const particular = String(rows[i][1] || "").trim();
    const invoiceNo = String(rows[i][2] || "").trim();
    const gstin = String(rows[i][3] || "").trim();
    const amount = parseFloat(rows[i][4]);
    if (!date || !particular || !amount) continue;
    out.push({ date, particular, invoiceNo, gstin, amount });
  }
  return out;
}

function parseLedgerSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 2; i < rows.length; i++) {
    const dateSerial = rows[i][0];
    const drCr = String(rows[i][1] || "").trim();
    const particular = String(rows[i][2] || "").replace(/\r/g, "").trim();
    const vch = String(rows[i][3] || "").trim();
    const col4 = parseFloat(rows[i][4]) || 0;
    const col5 = parseFloat(rows[i][5]) || 0;

    if (!particular && !dateSerial) continue;

    if (particular === "Opening Balance" && drCr) {
      out.push({ type: "opening", amount: col4 || col5, date: excelDate(dateSerial) });
      continue;
    }
    if (particular === "Closing Balance") {
      out.push({ type: "closing", amount: col4 || col5 });
      continue;
    }
    if (!dateSerial || typeof dateSerial !== "number") {
      if (col4 > 0 && col5 > 0) out.push({ type: "total" });
      continue;
    }

    const date = excelDate(dateSerial);
    if (vch === "Receipt" || (drCr === "Cr" && vch !== "Payment")) {
      const amount = col4 || col5;
      if (amount > 0) out.push({ type: "row", direction: "receipt", date, particular, amount });
    } else if (vch === "Payment" || drCr === "Dr") {
      const amount = col5 || col4;
      if (amount > 0) out.push({ type: "row", direction: "payment", date, particular, amount });
    }
  }
  return out;
}

async function main() {
  const { dryRun, file } = parseArgs();
  const env = loadEnv();
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(dryRun ? "\n=== DRY RUN ===" : "\n=== LIVE IMPORT ===");
  console.log("File:", file);

  const wb = XLSX.readFile(file);
  const closingRows = parseClosingSheet(wb.Sheets["CLOSING BALANCE 31-03-2026"]);
  const salesRows = parseSalesSheet(wb.Sheets["Sales Register"]);
  const bankRows = parseLedgerSheet(wb.Sheets.BANK);
  const cashRows = parseLedgerSheet(wb.Sheets.CASH);

  const { data: keeper } = await admin
    .from("users")
    .select("id, company_id, companies(name)")
    .ilike("email", KEEPER_EMAIL)
    .single();

  if (!keeper) throw new Error(`Keeper not found: ${KEEPER_EMAIL}`);

  const ctx = {
    dryRun,
    companyId: keeper.company_id,
    userId: keeper.id,
    clientMap: new Map(),
    bankId: null,
    stats: {
      clientsCreated: 0,
      clientOpening: 0,
      clientAdvances: 0,
      invoices: 0,
      invoiceErrors: 0,
      clientPayments: 0,
      expenses: 0,
      unmatched: 0,
    },
  };

  console.log("Company:", keeper.companies?.name);

  const { count: existingClients } = await admin
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("company_id", ctx.companyId);

  if ((existingClients ?? 0) > 0 && !dryRun) {
    console.error(
      "\nCompany already has clients. Run db:reset-company-data:confirm first, or use a fresh company.\n"
    );
    process.exit(1);
  }

  await importClosingBalance(admin, ctx, closingRows);
  await importInvoices(admin, ctx, salesRows);

  const bankStatsBefore = { ...ctx.stats };
  await importCashBankBook(admin, ctx, bankRows, "bank");

  const cashPaymentsBefore = ctx.stats.clientPayments;
  const cashExpensesBefore = ctx.stats.expenses;
  const cashUnmatchedBefore = ctx.stats.unmatched;
  await importCashBankBook(admin, ctx, cashRows, "cash");
  console.log(
    `   CASH added: payments ${ctx.stats.clientPayments - cashPaymentsBefore}, expenses ${ctx.stats.expenses - cashExpensesBefore}, unmatched ${ctx.stats.unmatched - cashUnmatchedBefore}`
  );

  console.log("\n--- Summary ---");
  console.log("Customers created:", ctx.stats.clientsCreated);
  console.log("Opening due B/F:", `₹${round2(ctx.stats.clientOpening)}`);
  console.log("Invoices:", ctx.stats.invoices);
  console.log("Client payments:", ctx.stats.clientPayments);
  console.log("Expense entries:", ctx.stats.expenses);
  console.log("Unmatched book lines:", ctx.stats.unmatched);

  if (dryRun) {
    console.log("\nDry run done. Re-run with --confirm to import.\n");
  } else {
    console.log("\nImport complete. Refresh dashboard and check customer dues.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});