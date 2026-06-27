/**
 * Section 10 owner usability test — automated backend + UI smoke.
 * Simulates owner flows via Supabase (same data paths as server actions).
 * Run: pnpm e2e:owner
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

type BlockResult = {
  block: string;
  pass: boolean;
  detail: string;
  friction?: string;
};

const blocks: BlockResult[] = [];
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3002";
const today = new Date().toISOString().slice(0, 10);
const runTag = `E2E-${Date.now().toString(36)}`;

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const env: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

function record(block: string, pass: boolean, detail: string, friction?: string) {
  blocks.push({ block, pass, detail, friction });
  const icon = pass ? "✅" : "❌";
  console.log(`  ${icon} Block ${block}: ${detail}`);
  if (friction) console.log(`     ⚠️  ${friction}`);
}

async function ledgerBalance(
  supabase: ReturnType<typeof createClient>,
  entityType: "client" | "supplier",
  entityId: string
) {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("entry_type, amount")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) throw new Error(error.message);

  let balance = 0;
  for (const row of data ?? []) {
    const amt = Number((row as { amount: number }).amount);
    const type = (row as { entry_type: string }).entry_type;
    if (entityType === "client") {
      balance += type === "debit" ? amt : -amt;
    } else {
      balance += type === "credit" ? amt : -amt;
    }
  }
  return Math.round(balance * 100) / 100;
}

async function testUiSmoke() {
  console.log("\n🌐 UI smoke (unauthenticated pages)");

  const checks: Array<{ id: string; path: string; pattern: RegExp }> = [
    { id: "UI-login", path: "/login", pattern: /login|password|sign/i },
    {
      id: "UI-home-labels",
      path: "/dashboard",
      pattern: /Customers owe you|You owe suppliers|Cash \+ Bank/i,
    },
  ];

  for (const check of checks) {
    try {
      const res = await fetch(`${baseUrl}${check.path}`, { redirect: "manual" });
      const text = await res.text();
      const ok = check.pattern.test(text) || res.status === 307 || res.status === 308;
      if (!ok) {
        record("UI", false, `${check.id} failed (${check.path})`, "Page missing expected copy");
      }
    } catch (err) {
      record("UI", false, `${check.id} fetch failed`, err instanceof Error ? err.message : String(err));
      return;
    }
  }

  const homeSource = readFileSync(
    resolve(root, "apps/web/src/app/(dashboard)/dashboard/dashboard-money-hero.tsx"),
    "utf8"
  );
  const pendingSource = readFileSync(
    resolve(root, "apps/web/src/app/(dashboard)/dashboard/dashboard-pending-dues.tsx"),
    "utf8"
  );
  const hasHero =
    homeSource.includes("Customers owe you") &&
    homeSource.includes("You owe suppliers") &&
    homeSource.includes("Cash + Bank");
  const hasCollect = pendingSource.includes("Collect") && pendingSource.includes("Pay");

  if (hasHero && hasCollect) {
    record("UI", true, "Home hero labels + Collect/Pay buttons present in source");
  } else {
    record("UI", false, "Home UX source check failed", "Missing hero labels or Collect/Pay");
  }
}

async function runDataFlows() {
  console.log("\n📊 Section 10 — data flows (owner@demo.punchless)");

  const env = {
    ...loadEnvFile(resolve(root, ".env")),
    ...loadEnvFile(resolve(root, "apps/web/.env.local")),
  };

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || (!anonKey && !serviceKey)) {
    for (const b of ["A", "B", "C", "D", "E", "F"]) {
      record(b, false, "Skipped — missing Supabase env in apps/web/.env.local");
    }
    return;
  }

  let supabase = createClient(url, serviceKey ?? anonKey!);
  let me: { id: string; company_id: string; role: string } | null = null;
  let authMode = "service_role";

  if (anonKey) {
    const userClient = createClient(url, anonKey);
    const { data: auth, error: authError } = await userClient.auth.signInWithPassword({
      email: "owner@demo.punchless",
      password: "demo1234",
    });

    if (!authError && auth.user) {
      const { data: profile } = await userClient
        .from("users")
        .select("id, company_id, role")
        .eq("id", auth.user.id)
        .single();
      if (profile) {
        supabase = userClient;
        me = profile as { id: string; company_id: string; role: string };
        authMode = "owner@demo.punchless";
      }
    }
  }

  if (!me && serviceKey) {
    supabase = createClient(url, serviceKey);
    const { data: owner } = await supabase
      .from("users")
      .select("id, company_id, role")
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    if (owner) {
      me = owner as { id: string; company_id: string; role: string };
      authMode = "service_role (first owner)";
    }
  }

  if (!me) {
    for (const b of ["A", "B", "C", "D", "E", "F"]) {
      record(
        b,
        false,
        "No owner user — run pnpm db:reset for demo login or ensure an owner exists"
      );
    }
    return;
  }

  console.log(`  ℹ️  Auth: ${authMode}, company ${me.company_id.slice(0, 8)}…`);
  const clientName = `Test Motors ${runTag}`;
  const supplierName = `Test Parts ${runTag}`;

  // --- Block A ---
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      company_id: me.company_id,
      name: clientName,
      opening_balance: 5000,
    } as never)
    .select("id")
    .single();

  if (clientError || !client) {
    record("A", false, clientError?.message ?? "Could not create client");
  } else {
    const clientId = (client as { id: string }).id;
    await supabase.from("ledger_entries").insert({
      company_id: me.company_id,
      entity_type: "client",
      entity_id: clientId,
      entry_type: "debit",
      amount: 5000,
      reference_type: "opening_balance",
      reference_id: clientId,
      remark: "Opening balance",
      entry_date: today,
      created_by: me.id,
    } as never);

    const due = await ledgerBalance(supabase, "client", clientId);
    record(
      "A",
      Math.abs(due - 5000) < 0.02,
      due === 5000 ? `Customer created, due ₹${due}` : `Due ₹${due}, expected ₹5000`
    );

    // --- Block B ---
    const billAmount = 2000;
    const { data: invoice, error: invError } = await supabase
      .from("invoices")
      .insert({
        company_id: me.company_id,
        client_id: clientId,
        invoice_date: today,
        taxable_amount: billAmount,
        gst_percent: 0,
        gst_amount: 0,
        total_amount: billAmount,
        payment_mode: "credit",
        cash_amount: 0,
        bank_amount: 0,
        credit_amount: billAmount,
        created_by: me.id,
      } as never)
      .select("id")
      .single();

    if (invError || !invoice) {
      record("B", false, invError?.message ?? "Quick bill failed");
    } else {
      const invoiceId = (invoice as { id: string }).id;
      await supabase.from("invoice_line_items").insert({
        invoice_id: invoiceId,
        description: "Workshop bill",
        quantity: 1,
        unit_price: billAmount,
        gst_percent: 0,
        amount: billAmount,
        sort_order: 0,
      } as never);
      await supabase.from("ledger_entries").insert({
        company_id: me.company_id,
        entity_type: "client",
        entity_id: clientId,
        entry_type: "debit",
        amount: billAmount,
        reference_type: "invoice",
        reference_id: invoiceId,
        remark: "Tax invoice",
        entry_date: today,
        created_by: me.id,
      } as never);

      const dueAfterBill = await ledgerBalance(supabase, "client", clientId);
      record(
        "B",
        Math.abs(dueAfterBill - 7000) < 0.02,
        `Udhar bill saved; due ₹${dueAfterBill} (expected ₹7000)`
      );

      // --- Block C ---
      const { data: payment, error: payErr } = await supabase
        .from("client_payments")
        .insert({
          company_id: me.company_id,
          client_id: clientId,
          amount: 1000,
          payment_mode: "cash",
          payment_date: today,
          created_by: me.id,
        } as never)
        .select("id")
        .single();

      if (payErr || !payment) {
        record("C", false, payErr?.message ?? "Collection failed");
      } else {
        await supabase.from("ledger_entries").insert({
          company_id: me.company_id,
          entity_type: "client",
          entity_id: clientId,
          entry_type: "credit",
          amount: 1000,
          payment_mode: "cash",
          reference_type: "payment",
          reference_id: (payment as { id: string }).id,
          remark: "Payment received (cash)",
          entry_date: today,
          created_by: me.id,
        } as never);

        const dueAfterPay = await ledgerBalance(supabase, "client", clientId);
        record(
          "C",
          Math.abs(dueAfterPay - 6000) < 0.02,
          `Collection recorded; due ₹${dueAfterPay} (expected ₹6000)`
        );
      }
    }
  }

  // --- Block D ---
  const { data: supplier, error: supErr } = await supabase
    .from("suppliers")
    .insert({
      company_id: me.company_id,
      name: supplierName,
      opening_balance: 0,
    } as never)
    .select("id")
    .single();

  if (supErr || !supplier) {
    record("D", false, supErr?.message ?? "Supplier create failed");
  } else {
    const supplierId = (supplier as { id: string }).id;
    const purchaseTotal = 3000;

    const { data: purchase, error: purchErr } = await supabase
      .from("purchase_invoices")
      .insert({
        company_id: me.company_id,
        supplier_id: supplierId,
        invoice_type: "purchase",
        invoice_date: today,
        taxable_amount: purchaseTotal,
        gst_percent: 0,
        gst_amount: 0,
        total_amount: purchaseTotal,
        created_by: me.id,
      } as never)
      .select("id")
      .single();

    if (purchErr || !purchase) {
      record("D", false, purchErr?.message ?? "Purchase failed");
    } else {
      const purchaseId = (purchase as { id: string }).id;
      await supabase.from("ledger_entries").insert({
        company_id: me.company_id,
        entity_type: "supplier",
        entity_id: supplierId,
        entry_type: "credit",
        amount: purchaseTotal,
        reference_type: "purchase",
        reference_id: purchaseId,
        remark: "Purchase invoice",
        entry_date: today,
        created_by: me.id,
      } as never);

      const { data: supPay, error: supPayErr } = await supabase
        .from("supplier_payments")
        .insert({
          company_id: me.company_id,
          supplier_id: supplierId,
          amount: 1000,
          payment_mode: "cash",
          payment_date: today,
          created_by: me.id,
        } as never)
        .select("id")
        .single();

      if (supPayErr || !supPay) {
        record("D", false, supPayErr?.message ?? "Supplier payment failed");
      } else {
        await supabase.from("ledger_entries").insert({
          company_id: me.company_id,
          entity_type: "supplier",
          entity_id: supplierId,
          entry_type: "debit",
          amount: 1000,
          payment_mode: "cash",
          reference_type: "payment",
          reference_id: (supPay as { id: string }).id,
          remark: "Payment made (cash)",
          entry_date: today,
          created_by: me.id,
        } as never);

        const payable = await ledgerBalance(supabase, "supplier", supplierId);
        record(
          "D",
          Math.abs(payable - 2000) < 0.02,
          `Supplier flow OK; payable ₹${payable} (expected ₹2000)`,
          "In Simple mode, Supplier bills is under More tools — watch for owner friction"
        );
      }
    }
  }

  // --- Block E ---
  const xlsxPath = resolve(root, "may 2026 attandence.xlsx");
  try {
    const { parseFingerprintWorkbook } = await import(
      "../apps/web/src/lib/utils/fingerprint-attendance-parser.ts"
    );

    const buffer = readFileSync(xlsxPath).buffer;
    const parsed = parseFingerprintWorkbook(buffer);

    const hasNonameInList = parsed.employees.some((e) =>
      /noname/i.test(e.fingerprintName)
    );
    const hasWorkingDays = parsed.employees.some((e) => e.daysWorked > 0);
    const hasOt = parsed.employees.some(
      (e) => e.summary.otHours != null && e.summary.otHours !== "0:0"
    );
    const sufiyan = parsed.employees.find((e) =>
      /sufiyan/i.test(e.fingerprintName)
    );

    const { data: existingImport } = await supabase
      .from("attendance_imports")
      .select("id, salary_month")
      .eq("company_id", me.company_id)
      .eq("salary_month", "2026-05")
      .maybeSingle();

    const ePass =
      parsed.salaryMonth === "2026-05" &&
      parsed.eligibleDays === 26 &&
      !hasNonameInList &&
      parsed.skippedNonameCount > 0 &&
      parsed.employees.length > 0 &&
      hasWorkingDays &&
      hasOt &&
      (sufiyan?.daysWorked ?? 0) >= 18;

    record(
      "E",
      ePass,
      `Parser: ${parsed.employees.length} employees, month ${parsed.salaryMonth}, NONAME skipped ${parsed.skippedNonameCount}` +
        (existingImport ? ", DB import exists for 2026-05" : ", no DB import yet (upload in UI)"),
      ePass ? undefined : "Fingerprint parser or salary row checks failed"
    );
  } catch (err) {
    record("E", false, err instanceof Error ? err.message : String(err));
  }

  // --- Block F ---
  const { data: employee } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("company_id", me.company_id)
    .eq("role", "employee")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!employee) {
    record("F", false, "No active employee for payment test");
  } else {
    const empId = (employee as { id: string }).id;
    const { data: staffPay, error: staffErr } = await supabase
      .from("staff_payments")
      .insert({
        company_id: me.company_id,
        employee_id: empId,
        payment_type: "salary_paid",
        amount: 500,
        payment_mode: "cash",
        payment_date: today,
        remark: `Owner test ${runTag}`,
        created_by: me.id,
      } as never)
      .select("id")
      .single();

    const paymentOk = !staffErr && !!staffPay;
    const heroLabels =
      readFileSync(
        resolve(root, "apps/web/src/app/(dashboard)/dashboard/dashboard-money-hero.tsx"),
        "utf8"
      ).includes("Customers owe you") &&
      readFileSync(
        resolve(root, "apps/web/src/app/(dashboard)/dashboard/dashboard-money-hero.tsx"),
        "utf8"
      ).includes("You owe suppliers") &&
      readFileSync(
        resolve(root, "apps/web/src/app/(dashboard)/dashboard/dashboard-money-hero.tsx"),
        "utf8"
      ).includes("Cash + Bank");

    record(
      "F",
      paymentOk && heroLabels,
      paymentOk
        ? `Staff payment ₹500 recorded for ${(employee as { full_name: string }).full_name}`
        : staffErr?.message ?? "Payment failed",
      heroLabels
        ? "Home labels exist — human must still explain meanings (not automated)"
        : "Home hero labels missing"
    );
  }

  if (authMode === "owner@demo.punchless") {
    await supabase.auth.signOut();
  }
}

async function main() {
  console.log("Punchless Owner Test — Section 10 (automated)");
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Run tag: ${runTag}`);

  await testUiSmoke();
  await runDataFlows();

  const uiBlock = blocks.find((b) => b.block === "UI");
  if (uiBlock) {
    console.log(`\nUI smoke: ${uiBlock.pass ? "PASS" : "FAIL"} — ${uiBlock.detail}`);
  }

  const scored = blocks.filter((b) => /^[A-F]$/.test(b.block));
  const passed = scored.filter((b) => b.pass).length;
  const total = scored.length;

  console.log("\n" + "=".repeat(60));
  console.log(`BLOCK SCORE: ${passed}/${total} passed`);
  console.log(passed >= 5 ? "\n🟢 AUTOMATED GATE: PASS (≥5/6)" : "\n🔴 AUTOMATED GATE: FAIL (<5/6)");

  console.log("\n📋 Still needs a REAL owner (human):");
  console.log("  • Can they find each screen without your help?");
  console.log("  • Block D: did they discover Supplier bills under More tools?");
  console.log("  • Block F: can they explain all 3 home numbers in plain words?");
  console.log("\nFacilitator script: OWNER_USABILITY_TEST.md");
  console.log(`Login: ${baseUrl}/login → owner@demo.punchless / demo1234`);

  const failed = scored.filter((b) => !b.pass);
  if (failed.length) {
    console.log("\nFailed blocks:");
    for (const f of failed) console.log(`  - ${f.block}: ${f.detail}`);
  }

  if (passed < 5) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});