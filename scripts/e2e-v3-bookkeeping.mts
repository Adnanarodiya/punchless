/**
 * V3 bookkeeping automated test — sales bill, purchase bill, general entry, ledgers.
 * Run: pnpm e2e:v3
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

type StepResult = { step: string; pass: boolean; detail: string };

const results: StepResult[] = [];
const today = new Date().toISOString().slice(0, 10);
const runTag = `V3-${Date.now().toString(36)}`;

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function record(step: string, pass: boolean, detail: string) {
  results.push({ step, pass, detail });
  console.log(`  ${pass ? "✅" : "❌"} ${step}: ${detail}`);
}

async function clientDue(
  supabase: ReturnType<typeof createClient>,
  clientId: string
) {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount")
    .eq("entity_type", "client")
    .eq("entity_id", clientId);
  if (error) throw new Error(error.message);
  let balance = 0;
  for (const row of data ?? []) {
    const amt = Number((row as { amount: number }).amount);
    const type = (row as { entry_type: string }).entry_type;
    balance += type === "debit" ? amt : -amt;
  }
  return Math.round(balance * 100) / 100;
}

async function supplierPayable(
  supabase: ReturnType<typeof createClient>,
  supplierId: string
) {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount")
    .eq("entity_type", "supplier")
    .eq("entity_id", supplierId);
  if (error) throw new Error(error.message);
  let balance = 0;
  for (const row of data ?? []) {
    const amt = Number((row as { amount: number }).amount);
    const type = (row as { entry_type: string }).entry_type;
    balance += type === "credit" ? amt : -amt;
  }
  return Math.round(balance * 100) / 100;
}

async function main() {
  console.log("\n=== V3 Bookkeeping E2E ===\n");

  const env = {
    ...loadEnvFile(resolve(root, ".env")),
    ...loadEnvFile(resolve(root, "apps/web/.env.local")),
  };
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: keeper } = await supabase
    .from("users")
    .select("id, company_id")
    .ilike("email", "aiarodiya07@gmail.com")
    .maybeSingle();

  if (!keeper) {
    record("setup", false, "Keeper user not found");
    process.exit(1);
  }

  const companyId = (keeper as { company_id: string }).company_id;
  const userId = (keeper as { id: string }).id;

  const clientName = `V3 Client ${runTag}`;
  const supplierName = `V3 Supplier ${runTag}`;
  const invoiceNo = `ISHABA-${runTag}`;

  const { data: client, error: clientErr } = await supabase
    .from("clients")
    .insert({
      company_id: companyId,
      name: clientName,
      gst_number: "24AAAAA0000A1Z5",
      opening_balance: 0,
    } as never)
    .select("id")
    .single();

  if (clientErr || !client) {
    record("1-create-client", false, clientErr?.message ?? "no client");
    process.exit(1);
  }
  const clientId = (client as { id: string }).id;
  record("1-create-client", true, clientName);

  const { data: salesInvoice, error: salesErr } = await supabase
    .from("invoices")
    .insert({
      company_id: companyId,
      client_id: clientId,
      invoice_number: invoiceNo,
      invoice_date: today,
      taxable_amount: 1000,
      gst_percent: 0,
      gst_amount: 0,
      total_amount: 1000,
      payment_mode: "credit",
      cash_amount: 0,
      bank_amount: 0,
      credit_amount: 1000,
      entry_category: "sales_bill",
      created_by: userId,
    } as never)
    .select("id")
    .single();

  if (salesErr || !salesInvoice) {
    record("2-sales-bill", false, salesErr?.message ?? "failed");
  } else {
    const invId = (salesInvoice as { id: string }).id;
    await supabase.from("ledger_entries").insert({
      company_id: companyId,
      entity_type: "client",
      entity_id: clientId,
      entry_type: "debit",
      amount: 1000,
      reference_type: "invoice",
      reference_id: invId,
      remark: `Sales bill #${invoiceNo}`,
      entry_date: today,
      entry_category: "sales_bill",
      created_by: userId,
    } as never);
    const due = await clientDue(supabase, clientId);
    record("2-sales-bill", due === 1000, `Due ₹${due} (expected ₹1000)`);
  }

  const { data: payment, error: payErr } = await supabase
    .from("client_payments")
    .insert({
      company_id: companyId,
      client_id: clientId,
      amount: 500,
      payment_mode: "cash",
      payment_date: today,
      remark: "Partial receipt",
      entry_category: "receipt",
      created_by: userId,
    } as never)
    .select("id")
    .single();

  if (payErr || !payment) {
    record("3-partial-receipt", false, payErr?.message ?? "failed");
  } else {
    const payId = (payment as { id: string }).id;
    await supabase.from("ledger_entries").insert({
      company_id: companyId,
      entity_type: "client",
      entity_id: clientId,
      entry_type: "credit",
      amount: 500,
      payment_mode: "cash",
      reference_type: "payment",
      reference_id: payId,
      remark: "Partial receipt",
      entry_date: today,
      entry_category: "receipt",
      created_by: userId,
    } as never);
    const due = await clientDue(supabase, clientId);
    record("3-partial-receipt", due === 500, `Outstanding ₹${due} (expected ₹500)`);
  }

  const { data: indirect, error: indirectErr } = await supabase
    .from("transactions")
    .insert({
      company_id: companyId,
      particular: "Indirect Expense",
      amount: 200,
      transaction_type: "expense",
      payment_mode: "cash",
      transaction_date: today,
      remark: "Electrical work",
      entry_category: "indirect_expense",
      created_by: userId,
    } as never)
    .select("id")
    .single();

  record(
    "4-indirect-expense",
    !indirectErr && !!indirect,
    indirectErr?.message ?? "Indirect expense recorded"
  );

  const { data: supplier, error: supErr } = await supabase
    .from("suppliers")
    .insert({
      company_id: companyId,
      name: supplierName,
      opening_balance: 0,
    } as never)
    .select("id")
    .single();

  if (supErr || !supplier) {
    record("5-purchase-bill", false, supErr?.message ?? "no supplier");
  } else {
    const supplierId = (supplier as { id: string }).id;
    const { data: purchase, error: purErr } = await supabase
      .from("purchase_invoices")
      .insert({
        company_id: companyId,
        supplier_id: supplierId,
        invoice_type: "purchase",
        invoice_number: `PUR-${runTag}`,
        invoice_date: today,
        taxable_amount: 800,
        gst_percent: 0,
        gst_amount: 0,
        total_amount: 800,
        entry_category: "purchase_bill",
        created_by: userId,
      } as never)
      .select("id")
      .single();

    if (purErr || !purchase) {
      record("5-purchase-bill", false, purErr?.message ?? "failed");
    } else {
      const purId = (purchase as { id: string }).id;
      await supabase.from("ledger_entries").insert({
        company_id: companyId,
        entity_type: "supplier",
        entity_id: supplierId,
        entry_type: "credit",
        amount: 800,
        reference_type: "purchase",
        reference_id: purId,
        remark: `Purchase bill #PUR-${runTag}`,
        entry_date: today,
        entry_category: "purchase_bill",
        created_by: userId,
      } as never);
      const payable = await supplierPayable(supabase, supplierId);
      record("5-purchase-bill", payable === 800, `Payable ₹${payable} (expected ₹800)`);
    }
  }

  const sourceChecks: Array<{ path: string; pattern: RegExp }> = [
    { path: "apps/web/src/components/quick-bill-modal.tsx", pattern: /ISHABA/ },
    { path: "apps/web/src/components/purchase-bill-modal.tsx", pattern: /Purchase bill/ },
    { path: "apps/web/src/components/general-entry-modal.tsx", pattern: /Indirect Income/ },
    {
      path: "apps/web/src/app/(dashboard)/dashboard/dashboard-primary-actions.tsx",
      pattern: /salesBill/,
    },
    {
      path: "apps/web/src/app/(dashboard)/dashboard/cash-book/page.tsx",
      pattern: /getCashBookReport/,
    },
    {
      path: "apps/web/src/app/(dashboard)/dashboard/bank-book/page.tsx",
      pattern: /getBankBookReport/,
    },
  ];

  for (const check of sourceChecks) {
    const finalPath = resolve(root, check.path);
    const exists = existsSync(finalPath);
    const content = exists ? readFileSync(finalPath, "utf8") : "";
    record(
      `src-${check.path.split("/").pop()}`,
      exists && check.pattern.test(content),
      exists ? "source OK" : "file missing"
    );
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${failed.length === 0 ? "✅ ALL V3 TESTS PASSED" : `❌ ${failed.length} FAILED`}\n`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});