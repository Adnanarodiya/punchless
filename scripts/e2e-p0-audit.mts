/**
 * P0 end-to-end smoke tests (audit Section 10 + Phase 0/P0-1–5).
 * Run: pnpm e2e:p0  (from repo root)
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

type Result = { id: string; pass: boolean; detail: string };

const results: Result[] = [];
const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3002";

function pass(id: string, detail: string) {
  results.push({ id, pass: true, detail });
  console.log(`  ✅ ${id}: ${detail}`);
}

function fail(id: string, detail: string) {
  results.push({ id, pass: false, detail });
  console.log(`  ❌ ${id}: ${detail}`);
}

function assert(id: string, condition: boolean, ok: string, bad: string) {
  if (condition) pass(id, ok);
  else fail(id, bad);
}

async function testFingerprintParser() {
  console.log("\n📄 Phase 0 — Fingerprint parser (may 2026 attandence.xlsx)");

  const { parseFingerprintWorkbook } = await import(
    "../apps/web/src/lib/utils/fingerprint-attendance-parser.ts"
  );

  function calcLine(
    monthlySalary: number,
    daysWorked: number,
    otHours: number,
    settings: { dailyWorkHours: number; workingDaysPerMonth: number; otRateMultiplier: number }
  ) {
    const eligibleDays = settings.workingDaysPerMonth;
    const earnedSalary = Math.round((monthlySalary * daysWorked) / eligibleDays);
    const hourlyRate = monthlySalary / (eligibleDays * settings.dailyWorkHours);
    const otPay = Math.round(otHours * hourlyRate * settings.otRateMultiplier);
    return { earnedSalary, otPay };
  }

  const xlsxPath = resolve(root, "may 2026 attandence.xlsx");
  const buffer = readFileSync(xlsxPath).buffer;
  const parsed = parseFingerprintWorkbook(buffer);

  assert(
    "P0-month",
    parsed.salaryMonth === "2026-05",
    `salaryMonth = ${parsed.salaryMonth}`,
    `expected 2026-05, got ${parsed.salaryMonth}`
  );

  assert(
    "P0-eligible-days",
    parsed.eligibleDays === 26,
    `eligibleDays = ${parsed.eligibleDays}`,
    `expected 26, got ${parsed.eligibleDays}`
  );

  assert(
    "P0-noname-skip",
    parsed.skippedNonameCount > 0,
    `skipped ${parsed.skippedNonameCount} NONAME block(s)`,
    "expected NONAME blocks to be skipped"
  );

  const names = parsed.employees.map((e) => e.fingerprintName);
  assert(
    "P0-no-noname-rows",
    !names.some((n) => n.toUpperCase() === "NONAME"),
    "no NONAME in employee list",
    "NONAME appeared in parsed employees"
  );

  const sufiyan = parsed.employees.find((e) =>
    e.fingerprintName.toUpperCase().includes("SUFIYAN")
  );

  if (!sufiyan) {
    fail("P0-sufiyan-found", "SUFIYAN DATA not found in workbook");
  } else {
    pass("P0-sufiyan-found", `found ${sufiyan.fingerprintName}`);
    assert(
      "P0-working-days",
      Math.abs(sufiyan.daysWorked - 20) < 0.01,
      `daysWorked = ${sufiyan.daysWorked}`,
      `expected ~20 days, got ${sufiyan.daysWorked}`
    );
    assert(
      "P0-ot-hours",
      sufiyan.summary.otHours != null && sufiyan.summary.otHours.includes("3"),
      `OT from SUMMERY = ${sufiyan.summary.otHours}`,
      `expected OT ~3:15, got ${sufiyan.summary.otHours}`
    );

    const line = calcLine(30000, sufiyan.daysWorked, 3.25, {
      dailyWorkHours: 8,
      workingDaysPerMonth: 26,
      otRateMultiplier: 1,
    });

    assert(
      "P0-earned-salary",
      line.earnedSalary >= 23076 && line.earnedSalary <= 23078,
      `earned ₹${line.earnedSalary} (30000 × 20÷26)`,
      `expected ~₹23,077, got ₹${line.earnedSalary}`
    );
    assert(
      "P0-ot-pay-1x",
      line.otPay >= 468 && line.otPay <= 470,
      `OT pay ₹${line.otPay} @ 1×`,
      `expected ~₹469 OT pay, got ₹${line.otPay}`
    );
  }
}

async function testHttpSmoke() {
  console.log("\n🌐 HTTP smoke (dev server)");

  const routes: Array<{ id: string; path: string; expect: RegExp | ((status: number) => boolean) }> =
    [
      { id: "HTTP-login", path: "/login", expect: /login|sign in|password/i },
      { id: "HTTP-dashboard-redirect", path: "/dashboard", expect: (s) => s === 200 || s === 307 || s === 308 },
    ];

  for (const route of routes) {
    try {
      const res = await fetch(`${baseUrl}${route.path}`, { redirect: "manual" });
      const text = await res.text();
      const ok =
        typeof route.expect === "function"
          ? route.expect(res.status)
          : route.expect.test(text);
      assert(
        route.id,
        ok,
        `${route.path} → ${res.status}`,
        `${route.path} → ${res.status}, body snippet: ${text.slice(0, 120)}`
      );
    } catch (err) {
      fail(route.id, `fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function testSourceChecks() {
  console.log("\n🔍 P0-1–5 source checks");

  const sidebar = readFileSync(
    resolve(root, "apps/web/src/components/sidebar-config.ts"),
    "utf8"
  );
  assert(
    "P0-1-simple-label",
    sidebar.includes('simpleLabel: "Pay Staff"') && sidebar.includes("full-only"),
    "Pay Staff nav + Payments full-only",
    "sidebar simple mode config missing"
  );

  const home = readFileSync(
    resolve(root, "apps/web/src/app/(dashboard)/dashboard/page.tsx"),
    "utf8"
  );
  assert(
    "P0-5-hero",
    home.includes("DashboardMoneyHero") && home.includes("DashboardShowMore"),
    "home has money hero + show more",
    "simpler home layout missing"
  );

  const commerce = readFileSync(
    resolve(root, "apps/web/src/components/commerce-flow-panel.tsx"),
    "utf8"
  );
  assert(
    "P0-4-statement",
    !commerce.includes("/dashboard/reports/rojmel") &&
      commerce.includes("Icon on each client row"),
    "client step 4 fixed (no Rojmel link)",
    "commerce flow still links to Rojmel"
  );

  const suppliers = readFileSync(
    resolve(root, "apps/web/src/app/(dashboard)/dashboard/suppliers/page.tsx"),
    "utf8"
  );
  assert(
    "P0-3-supplier-flow",
    suppliers.includes("SupplierFlowPanel"),
    "suppliers page has flow panel",
    "SupplierFlowPanel not on suppliers page"
  );

  const payHub = readFileSync(
    resolve(root, "apps/web/src/components/pay-staff-hub.tsx"),
    "utf8"
  );
  assert(
    "P0-2-pay-hub",
    payHub.includes("This month") && payHub.includes("History"),
    "Pay Staff hub tabs present",
    "PayStaffHub missing"
  );
}

async function main() {
  console.log("Punchless P0 E2E audit");
  console.log(`Base URL: ${baseUrl}`);

  await testFingerprintParser();
  await testHttpSmoke();
  await testSourceChecks();

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed}/${results.length} automated checks passed`);

  if (failed.length) {
    console.log("\nFailed:");
    for (const f of failed) console.log(`  - ${f.id}: ${f.detail}`);
    process.exit(1);
  }

  console.log("\n📋 Manual browser checklist (Section 10 — needs owner login):");
  console.log("  1. Add customer with ₹5,000 opening due");
  console.log("  2. Create ₹2,000 credit invoice (New bill)");
  console.log("  3. Collect ₹1,000 payment on client row");
  console.log("  4. Add supplier → purchase ₹3,000 → pay ₹1,000");
  console.log("  5. Upload may 2026 attandence.xlsx → verify salary table");
  console.log("  6. Pay one employee from Pay Staff hub");
  console.log("  7. Home: explain Customers owe / You owe / Cash+Bank");
  console.log("\nOpen: " + baseUrl + "/login");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});