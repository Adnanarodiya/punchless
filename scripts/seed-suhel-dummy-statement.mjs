/**
 * Demo statement data for SUHEL SAIF MULLA — 3 months with salary proof snapshots.
 *
 * - Mar 2026: all days present → full salary
 * - Apr 2026: 5 absent days → reduced salary
 * - May 2026: advance taken + salary paid with advance deducted
 *
 * Run: pnpm db:seed-suhel-demo
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in root .env
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const DEMO_TAG = "DEMO-SUHEL";

function loadEnv() {
  const vars = {};
  for (const file of [resolve(root, ".env"), resolve(root, "apps/web/.env.local")]) {
    try {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq < 0) continue;
        vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
      }
    } catch {
      /* optional */
    }
  }
  return vars;
}

function earnedSalary(monthlySalary, workingDays, eligibleDays = 26) {
  return Math.round((monthlySalary / eligibleDays) * workingDays);
}

function buildSnapshot({
  employeeName,
  designation,
  salaryMonth,
  monthlySalary,
  workingDays,
  absentDays,
  advanceDeduction,
  amountPaid,
  paymentDate,
  remark,
}) {
  const eligibleDays = 26;
  const earned = earnedSalary(monthlySalary, workingDays, eligibleDays);
  const totalSalary = earned;
  const netPayment = totalSalary - advanceDeduction;

  return {
    employeeName,
    designation,
    salaryMonth,
    monthlySalary,
    workingDays,
    absentDays,
    sundaysExcluded: 4,
    eligibleDays,
    otHours: 0,
    otRateMultiplier: 1,
    earnedSalary: earned,
    otPay: 0,
    totalSalary,
    advanceDeduction,
    alreadyPaidBefore: 0,
    netPayment,
    amountPaid,
    paymentDate,
    paymentMode: "cash",
    remark,
  };
}

async function cleanupDemo(admin, employeeId) {
  const { data: payments } = await admin
    .from("staff_payments")
    .select("id")
    .eq("employee_id", employeeId)
    .ilike("remark", `%${DEMO_TAG}%`);

  const paymentIds = (payments ?? []).map((p) => p.id);

  if (paymentIds.length) {
    await admin
      .from("ledger_entries")
      .delete()
      .in("reference_id", paymentIds)
      .eq("reference_type", "staff_payment");
    await admin.from("staff_payments").delete().in("id", paymentIds);
  }

  const { data: advances } = await admin
    .from("salary_advances")
    .select("id")
    .eq("employee_id", employeeId)
    .ilike("reason", `%${DEMO_TAG}%`);

  for (const adv of advances ?? []) {
    await admin.from("salary_advances").delete().eq("id", adv.id);
  }

  console.log(
    `Cleaned ${paymentIds.length} demo payment(s), ${(advances ?? []).length} demo advance(s)`
  );
}

async function insertSalaryPayment(admin, {
  companyId,
  ownerId,
  employeeId,
  salaryMonth,
  amount,
  paymentDate,
  slipSnapshot,
  remark,
}) {
  const { data: payment, error } = await admin
    .from("staff_payments")
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      payment_type: "salary_paid",
      amount,
      payment_mode: "cash",
      payment_date: paymentDate,
      salary_month: salaryMonth,
      slip_snapshot: slipSnapshot,
      remark,
      created_by: ownerId,
    })
    .select("id")
    .single();

  if (error || !payment) throw new Error(error?.message ?? "staff_payment insert failed");

  const { error: ledgerError } = await admin.from("ledger_entries").insert({
    company_id: companyId,
    entity_type: "staff",
    entity_id: employeeId,
    entry_type: "debit",
    amount,
    payment_mode: "cash",
    reference_type: "staff_payment",
    reference_id: payment.id,
    remark: remark,
    entry_date: paymentDate,
    created_by: ownerId,
  });

  if (ledgerError) throw new Error(ledgerError.message);

  return payment.id;
}

async function main() {
  const env = loadEnv();
  const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: employee, error: empError } = await admin
    .from("users")
    .select("id, full_name, company_id, monthly_salary, post_id, posts(name)")
    .eq("role", "employee")
    .ilike("full_name", "%SUHEL%")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (empError || !employee) {
    console.error("SUHEL SAIF MULLA not found. Run pnpm db:seed-shahin-employees first.");
    process.exit(1);
  }

  const { data: owner } = await admin
    .from("users")
    .select("id")
    .eq("company_id", employee.company_id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (!owner) {
    console.error("No owner for SUHEL company");
    process.exit(1);
  }

  const monthlySalary = Number(employee.monthly_salary) || 22000;
  const designation =
    (employee.posts && typeof employee.posts === "object"
      ? employee.posts.name
      : null) ?? "OFFICE";
  const employeeName = employee.full_name;

  console.log(`Seeding demo for ${employeeName} (${employee.id})`);
  console.log(`Monthly salary: ₹${monthlySalary}`);

  await cleanupDemo(admin, employee.id);

  // --- March 2026: all days present ---
  const marWorking = 26;
  const marAbsent = 0;
  const marEarned = earnedSalary(monthlySalary, marWorking);
  const marSnapshot = buildSnapshot({
    employeeName,
    designation,
    salaryMonth: "2026-03",
    monthlySalary,
    workingDays: marWorking,
    absentDays: marAbsent,
    advanceDeduction: 0,
    amountPaid: marEarned,
    paymentDate: "2026-03-31",
    remark: `${DEMO_TAG} Mar 2026 — all days present`,
  });
  const marId = await insertSalaryPayment(admin, {
    companyId: employee.company_id,
    ownerId: owner.id,
    employeeId: employee.id,
    salaryMonth: "2026-03",
    amount: marEarned,
    paymentDate: "2026-03-31",
    slipSnapshot: marSnapshot,
    remark: marSnapshot.remark,
  });
  console.log(`✓ Mar 2026 — ₹${marEarned} paid (26/26 days) — slip ${marId}`);

  // --- April 2026: 5 absent days ---
  const aprWorking = 21;
  const aprAbsent = 5;
  const aprEarned = earnedSalary(monthlySalary, aprWorking);
  const aprSnapshot = buildSnapshot({
    employeeName,
    designation,
    salaryMonth: "2026-04",
    monthlySalary,
    workingDays: aprWorking,
    absentDays: aprAbsent,
    advanceDeduction: 0,
    amountPaid: aprEarned,
    paymentDate: "2026-04-30",
    remark: `${DEMO_TAG} Apr 2026 — 5 absent days`,
  });
  const aprId = await insertSalaryPayment(admin, {
    companyId: employee.company_id,
    ownerId: owner.id,
    employeeId: employee.id,
    salaryMonth: "2026-04",
    amount: aprEarned,
    paymentDate: "2026-04-30",
    slipSnapshot: aprSnapshot,
    remark: aprSnapshot.remark,
  });
  console.log(`✓ Apr 2026 — ₹${aprEarned} paid (21 days, 5 absent) — slip ${aprId}`);

  // --- May 2026: advance + salary ---
  const advanceAmount = 5000;
  const { data: advance, error: advError } = await admin
    .from("salary_advances")
    .insert({
      company_id: employee.company_id,
      employee_id: employee.id,
      amount: advanceAmount,
      reason: `${DEMO_TAG} May 2026 — advance for family`,
      status: "approved",
      approved_at: "2026-05-10T10:00:00Z",
      approved_by: owner.id,
      salary_month: "2026-05",
      requested_at: "2026-05-10T09:00:00Z",
    })
    .select("id")
    .single();

  if (advError) throw new Error(advError.message);
  console.log(`✓ May 2026 — advance ₹${advanceAmount} (${advance.id})`);

  const mayWorking = 24;
  const mayAbsent = 2;
  const mayEarned = earnedSalary(monthlySalary, mayWorking);
  const mayNet = mayEarned - advanceAmount;
  const maySnapshot = buildSnapshot({
    employeeName,
    designation,
    salaryMonth: "2026-05",
    monthlySalary,
    workingDays: mayWorking,
    absentDays: mayAbsent,
    advanceDeduction: advanceAmount,
    amountPaid: mayNet,
    paymentDate: "2026-05-31",
    remark: `${DEMO_TAG} May 2026 — advance deducted`,
  });
  const mayId = await insertSalaryPayment(admin, {
    companyId: employee.company_id,
    ownerId: owner.id,
    employeeId: employee.id,
    salaryMonth: "2026-05",
    amount: mayNet,
    paymentDate: "2026-05-31",
    slipSnapshot: maySnapshot,
    remark: maySnapshot.remark,
  });
  console.log(
    `✓ May 2026 — ₹${mayNet} paid (earned ₹${mayEarned} − advance ₹${advanceAmount}) — slip ${mayId}`
  );

  console.log("\nDone. Open employee statement with date range 2026-03-01 to 2026-06-30.");
  console.log(`Employee ID: ${employee.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});