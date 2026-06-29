/**
 * Import Shahin Motors bookkeeping data from shahin data.xlsx
 *
 * Sheets:
 * - sale invoice    → sales bills (credit / udhar)
 * - purchase bill   → supplier purchase bills
 * - cash recived    → cash receipts from customers
 * - bank            → Kotak opening + bank receipts & payments
 *
 * Usage:
 *   node scripts/import-shahin-data.mjs --dry-run
 *   node scripts/import-shahin-data.mjs --confirm
 *   node scripts/import-shahin-data.mjs --confirm --file="shahin data.xlsx"
 *   node scripts/import-shahin-data.mjs --confirm --force   (skip empty-company check)
 *
 * Recommended before live import:
 *   pnpm db:reset-company-data:confirm
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const KEEPER_EMAIL = "aiarodiya07@gmail.com";
const IMPORT_REMARK = "Imported from shahin data.xlsx";
const BANK_RECEIPT_REMARK = "Imported bank receipt";
const BANK_NAME = "Kotak Bank";
const BANK_ACCOUNT = "0000000001";

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
  const force = args.includes("--force");
  const fileArg = args.find((a) => a.startsWith("--file="));
  const file = fileArg ? fileArg.slice(7) : "shahin data.xlsx";
  return { dryRun, force, file: resolve(root, file) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/_x000D_/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normName(value) {
  return cleanText(value).toUpperCase();
}

function parseNameGst(raw) {
  const text = cleanText(raw);
  const m = text.match(/^(.+?)\s+Ok\s*\(([0-9A-Z]{15})\)\s*$/i)
    || text.match(/^(.+?)\s*\(([0-9A-Z]{15})\)\s*$/i);
  if (m) return { name: cleanPartyName(m[1]), gst: m[2].toUpperCase() };
  return { name: cleanPartyName(text), gst: null };
}

function cleanPartyName(name) {
  return cleanText(name).replace(/\s+Ok$/i, "").trim();
}

function excelDate(serial) {
  if (typeof serial === "number" && Number.isFinite(serial)) {
    const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  const text = cleanText(serial);
  const iso = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  return null;
}

function parseAmount(raw) {
  const value = parseFloat(String(raw ?? "").replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? round2(value) : null;
}

function findPartyId(map, particular) {
  const key = normName(particular);
  if (map.has(key)) return map.get(key);
  for (const [k, id] of map) {
    if (key.includes(k) || k.includes(key)) return id;
  }
  return null;
}

function parseSaleInvoiceSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const invoiceNo = cleanText(rows[i][0]);
    const date = excelDate(rows[i][1]);
    const account = cleanText(rows[i][2]);
    const amount = parseAmount(rows[i][3]);
    const vehicle = cleanText(rows[i][4]) || null;
    if (!invoiceNo || !date || !account || amount == null) continue;
    const { name, gst } = parseNameGst(account);
    out.push({ invoiceNo, date, name, gst, amount, vehicle });
  }
  return out;
}

function parsePurchaseSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const date = excelDate(rows[i][0]);
    const supplier = cleanText(rows[i][1]);
    const invoiceNo = cleanText(rows[i][3]);
    const amount = parseAmount(rows[i][4]);
    if (!date || !supplier || amount == null) continue;
    const { name, gst } = parseNameGst(supplier);
    out.push({ date, name, gst, invoiceNo: invoiceNo || null, amount });
  }
  return out;
}

function parseCashReceivedSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const date = excelDate(rows[i][0]);
    const particular = cleanText(rows[i][1]);
    const amount = parseAmount(rows[i][2]);
    if (!date || !particular || amount == null) continue;
    const { name, gst } = parseNameGst(particular);
    out.push({ date, name, gst, amount });
  }
  return out;
}

function parseBankSheet(sheet) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const dateSerial = rows[i][0];
    const drCr = cleanText(rows[i][1]);
    const particular = cleanText(rows[i][2]);
    const vch = cleanText(rows[i][3]);
    const debit = parseAmount(rows[i][4]);
    const credit = parseAmount(rows[i][5]);

    if (!particular && !dateSerial) continue;

    if (particular === "Opening Balance") {
      out.push({
        type: "opening",
        amount: debit ?? credit ?? 0,
        date: excelDate(dateSerial),
      });
      continue;
    }
    if (particular === "Closing Balance") {
      out.push({ type: "closing", amount: debit ?? credit ?? 0 });
      continue;
    }

    const date = excelDate(dateSerial);
    if (!date) continue;

    if (vch === "Receipt" || (drCr === "Cr" && vch !== "Payment")) {
      const amount = debit ?? credit;
      if (amount != null) {
        out.push({ type: "row", direction: "receipt", date, particular, amount });
      }
    } else if (vch === "Payment" || drCr === "Dr") {
      const amount = credit ?? debit;
      if (amount != null) {
        out.push({ type: "row", direction: "payment", date, particular, amount });
      }
    }
  }
  return out;
}

async function ensureClient(admin, ctx, row) {
  const name = cleanPartyName(row.name);
  const key = normName(name);
  if (ctx.clientMap.has(key)) return ctx.clientMap.get(key);

  if (ctx.dryRun) {
    const fakeId = `dry-client-${ctx.clientMap.size}`;
    ctx.clientMap.set(key, fakeId);
    ctx.stats.clientsCreated += 1;
    return fakeId;
  }

  const { data, error } = await admin
    .from("clients")
    .insert({
      company_id: ctx.companyId,
      name,
      gst_number: row.gst ?? null,
      opening_balance: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Client insert failed (${name}): ${error.message}`);
  ctx.clientMap.set(key, data.id);
  ctx.stats.clientsCreated += 1;
  return data.id;
}

async function ensureSupplier(admin, ctx, row) {
  const name = cleanPartyName(row.name);
  const key = normName(name);
  if (ctx.supplierMap.has(key)) return ctx.supplierMap.get(key);

  if (ctx.dryRun) {
    const fakeId = `dry-supplier-${ctx.supplierMap.size}`;
    ctx.supplierMap.set(key, fakeId);
    ctx.stats.suppliersCreated += 1;
    return fakeId;
  }

  const { data, error } = await admin
    .from("suppliers")
    .insert({
      company_id: ctx.companyId,
      name,
      gst_number: row.gst ?? null,
      opening_balance: 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Supplier insert failed (${name}): ${error.message}`);
  ctx.supplierMap.set(key, data.id);
  ctx.stats.suppliersCreated += 1;
  return data.id;
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
      bank_name: BANK_NAME,
      account_name: `Kotak ${BANK_ACCOUNT}`,
      account_number: BANK_ACCOUNT,
      opening_balance: openingBalance,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Bank insert failed: ${error.message}`);

  if (openingBalance > 0) {
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
      remark: "Opening balance (imported from bank sheet)",
      entry_date: openingBalance > 0 ? "2026-06-01" : null,
      created_by: ctx.userId,
    });
  }

  ctx.bankId = data.id;
  return data.id;
}

async function importSalesBills(admin, ctx, rows) {
  console.log("\n1) Sales invoices → sales bills (credit)");
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.invoiceNo.localeCompare(b.invoiceNo));

  for (const row of rows) {
    const clientId = await ensureClient(admin, ctx, row);

    if (ctx.dryRun) {
      ctx.stats.salesBills += 1;
      continue;
    }

    const { data: invoice, error } = await admin
      .from("invoices")
      .insert({
        company_id: ctx.companyId,
        client_id: clientId,
        invoice_number: row.invoiceNo,
        invoice_date: row.date,
        vehicle_number: row.vehicle,
        taxable_amount: row.amount,
        gst_percent: 0,
        gst_amount: 0,
        total_amount: row.amount,
        payment_mode: "credit",
        cash_amount: 0,
        bank_amount: 0,
        credit_amount: row.amount,
        remark: IMPORT_REMARK,
        entry_category: "sales_bill",
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (error) {
      ctx.stats.salesBillErrors += 1;
      continue;
    }

    await admin.from("invoice_line_items").insert({
      invoice_id: invoice.id,
      description: `Sales bill ${row.invoiceNo}`,
      quantity: 1,
      unit_price: row.amount,
      gst_percent: 0,
      amount: row.amount,
      sort_order: 0,
    });

    await admin.from("ledger_entries").insert({
      company_id: ctx.companyId,
      entity_type: "client",
      entity_id: clientId,
      entry_type: "debit",
      amount: row.amount,
      reference_type: "invoice",
      reference_id: invoice.id,
      remark: `Sales bill #${row.invoiceNo}`,
      entry_date: row.date,
      entry_category: "sales_bill",
      created_by: ctx.userId,
    });

    ctx.stats.salesBills += 1;
    if (ctx.stats.salesBills % 200 === 0) {
      console.log(`   … ${ctx.stats.salesBills} sales bills`);
    }
  }

  console.log(
    `   ${ctx.stats.salesBills} sales bills (${ctx.stats.salesBillErrors} skipped)`
  );
}

async function importPurchaseBills(admin, ctx, rows) {
  console.log("\n2) Purchase bills → supplier ledger");
  rows.sort((a, b) => a.date.localeCompare(b.date));

  for (const row of rows) {
    const supplierId = await ensureSupplier(admin, ctx, row);

    if (ctx.dryRun) {
      ctx.stats.purchaseBills += 1;
      continue;
    }

    const { data: purchase, error } = await admin
      .from("purchase_invoices")
      .insert({
        company_id: ctx.companyId,
        supplier_id: supplierId,
        invoice_type: "purchase",
        invoice_number: row.invoiceNo,
        invoice_date: row.date,
        taxable_amount: row.amount,
        gst_percent: 0,
        gst_amount: 0,
        total_amount: row.amount,
        remark: IMPORT_REMARK,
        entry_category: "purchase_bill",
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (error) {
      ctx.stats.purchaseBillErrors += 1;
      continue;
    }

    await admin.from("ledger_entries").insert({
      company_id: ctx.companyId,
      entity_type: "supplier",
      entity_id: supplierId,
      entry_type: "credit",
      amount: row.amount,
      reference_type: "purchase",
      reference_id: purchase.id,
      remark: row.invoiceNo ? `Purchase bill #${row.invoiceNo}` : "Purchase bill",
      entry_date: row.date,
      entry_category: "purchase_bill",
      created_by: ctx.userId,
    });

    ctx.stats.purchaseBills += 1;
  }

  console.log(
    `   ${ctx.stats.purchaseBills} purchase bills (${ctx.stats.purchaseBillErrors} skipped)`
  );
}

async function recordClientReceipt(admin, ctx, { clientId, partyName, amount, mode, date, bankId }) {
  if (ctx.dryRun) {
    ctx.stats.clientReceipts += 1;
    return;
  }

  const remark =
    mode === "bank"
      ? BANK_RECEIPT_REMARK
      : partyName
        ? `Receipt — ${cleanPartyName(partyName)} (${mode})`
        : `Receipt (${mode})`;

  const { data: payment, error } = await admin
    .from("client_payments")
    .insert({
      company_id: ctx.companyId,
      client_id: clientId,
      amount,
      payment_mode: mode,
      bank_id: bankId ?? null,
      payment_date: date,
      remark,
      entry_category: "receipt",
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
    remark,
    entry_date: date,
    entry_category: "receipt",
    created_by: ctx.userId,
  });

  if (mode === "bank" && bankId) {
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
      entry_category: "receipt",
      created_by: ctx.userId,
    });
  }

  ctx.stats.clientReceipts += 1;
}

async function recordSupplierPayment(admin, ctx, { supplierId, partyName, amount, mode, date, bankId }) {
  if (ctx.dryRun) {
    ctx.stats.supplierPayments += 1;
    return;
  }

  const remark = partyName
    ? `Payment — ${cleanPartyName(partyName)} (${mode})`
    : `Payment (${mode})`;

  const { data: payment, error } = await admin
    .from("supplier_payments")
    .insert({
      company_id: ctx.companyId,
      supplier_id: supplierId,
      amount,
      payment_mode: mode,
      bank_id: bankId ?? null,
      payment_date: date,
      remark,
      entry_category: "payment",
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (error) return;

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "supplier",
    entity_id: supplierId,
    entry_type: "debit",
    amount,
    payment_mode: mode,
    bank_id: bankId ?? null,
    reference_type: "payment",
    reference_id: payment.id,
    remark,
    entry_date: date,
    entry_category: "payment",
    created_by: ctx.userId,
  });

  if (mode === "bank" && bankId) {
    await admin.from("bank_transactions").insert({
      company_id: ctx.companyId,
      bank_id: bankId,
      transaction_type: "withdrawal",
      amount,
      transaction_date: date,
      remark,
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
      reference_id: payment.id,
      remark,
      entry_date: date,
      entry_category: "payment",
      created_by: ctx.userId,
    });
  }

  ctx.stats.supplierPayments += 1;
}

async function recordIndirectExpense(admin, ctx, { particular, amount, mode, date, bankId }) {
  if (ctx.dryRun) {
    ctx.stats.indirectExpenses += 1;
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
      remark: IMPORT_REMARK,
      entry_category: "indirect_expense",
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
    remark: `${particular} (${mode})`,
    entry_date: date,
    entry_category: "indirect_expense",
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
      entry_category: "indirect_expense",
      created_by: ctx.userId,
    });
  }

  ctx.stats.indirectExpenses += 1;
}

async function importCashReceipts(admin, ctx, rows) {
  console.log("\n3) Cash received → client receipts");
  rows.sort((a, b) => a.date.localeCompare(b.date));

  for (const row of rows) {
    let clientId = findPartyId(ctx.clientMap, row.name);
    if (!clientId) clientId = await ensureClient(admin, ctx, row);

    await recordClientReceipt(admin, ctx, {
      clientId,
      partyName: row.name,
      amount: row.amount,
      mode: "cash",
      date: row.date,
      bankId: null,
    });
  }

  console.log(`   ${ctx.stats.clientReceipts} cash receipts`);
}

async function importBankBook(admin, ctx, rows) {
  console.log("\n4) Bank book → opening + receipts & payments");

  let bankOpening = 0;
  const transactions = [];

  for (const row of rows) {
    if (row.type === "opening") {
      bankOpening = row.amount ?? 0;
      continue;
    }
    if (row.type === "closing" || row.type === "total") continue;
    transactions.push(row);
  }

  transactions.sort((a, b) => a.date.localeCompare(b.date));
  const bankId = await ensureBank(admin, ctx, bankOpening);
  if (bankOpening > 0) {
    console.log(`   Kotak opening balance ₹${round2(bankOpening)}`);
  }

  for (const row of transactions) {
    const { name, gst } = parseNameGst(row.particular);

    if (row.direction === "receipt") {
      let clientId = findPartyId(ctx.clientMap, name);
      if (!clientId) clientId = await ensureClient(admin, ctx, { name, gst });
      await recordClientReceipt(admin, ctx, {
        clientId,
        partyName: name,
        amount: row.amount,
        mode: "bank",
        date: row.date,
        bankId,
      });
      continue;
    }

    const supplierId = findPartyId(ctx.supplierMap, name);
    if (supplierId) {
      await recordSupplierPayment(admin, ctx, {
        supplierId,
        partyName: name,
        amount: row.amount,
        mode: "bank",
        date: row.date,
        bankId,
      });
    } else {
      await recordIndirectExpense(admin, ctx, {
        particular: name,
        amount: row.amount,
        mode: "bank",
        date: row.date,
        bankId,
      });
    }
  }

  console.log(
    `   bank receipts/payments recorded (total client receipts now ${ctx.stats.clientReceipts}, supplier payments ${ctx.stats.supplierPayments}, indirect expenses ${ctx.stats.indirectExpenses})`
  );
}

async function main() {
  const { dryRun, force, file } = parseArgs();
  const env = loadEnv();
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(dryRun ? "\n=== DRY RUN ===" : "\n=== LIVE IMPORT ===");
  console.log("File:", file);

  const wb = XLSX.readFile(file);
  const salesRows = parseSaleInvoiceSheet(wb.Sheets["sale invoice"]);
  const purchaseRows = parsePurchaseSheet(wb.Sheets["purchase bill"]);
  const cashRows = parseCashReceivedSheet(wb.Sheets["cash recived"]);
  const bankSheet = wb.Sheets["bank "] ?? wb.Sheets.bank;
  const bankRows = parseBankSheet(bankSheet);

  console.log("Parsed rows:");
  console.log(`  sales bills: ${salesRows.length}`);
  console.log(`  purchase bills: ${purchaseRows.length}`);
  console.log(`  cash receipts: ${cashRows.length}`);
  console.log(`  bank lines: ${bankRows.length}`);

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
    supplierMap: new Map(),
    bankId: null,
    stats: {
      clientsCreated: 0,
      suppliersCreated: 0,
      salesBills: 0,
      salesBillErrors: 0,
      purchaseBills: 0,
      purchaseBillErrors: 0,
      clientReceipts: 0,
      supplierPayments: 0,
      indirectExpenses: 0,
    },
  };

  console.log("Company:", keeper.companies?.name);

  const { count: existingClients } = await admin
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("company_id", ctx.companyId);

  if ((existingClients ?? 0) > 0 && !dryRun && !force) {
    console.error(
      "\nCompany already has data. Run first:\n  pnpm db:reset-company-data:confirm\nOr pass --force to import anyway.\n"
    );
    process.exit(1);
  }

  await importSalesBills(admin, ctx, salesRows);
  await importPurchaseBills(admin, ctx, purchaseRows);
  await importCashReceipts(admin, ctx, cashRows);
  await importBankBook(admin, ctx, bankRows);

  console.log("\n--- Summary ---");
  console.log("Customers created:", ctx.stats.clientsCreated);
  console.log("Suppliers created:", ctx.stats.suppliersCreated);
  console.log("Sales bills:", ctx.stats.salesBills);
  console.log("Purchase bills:", ctx.stats.purchaseBills);
  console.log("Client receipts (cash + bank):", ctx.stats.clientReceipts);
  console.log("Supplier payments:", ctx.stats.supplierPayments);
  console.log("Indirect expenses:", ctx.stats.indirectExpenses);

  if (dryRun) {
    console.log("\nDry run done. Re-run with --confirm to import.\n");
  } else {
    console.log("\nImport complete. Refresh dashboard and verify ledgers.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});