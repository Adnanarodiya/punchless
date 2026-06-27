/**
 * Extra cleanup after reset-company-data:
 * - Remove workshops + fingerprint aliases from Shahin Motors
 * - Remove demo employees (helper@demo, mechanic@demo)
 * - Fully wipe the separate "Shahin" demo company
 *
 * Usage:
 *   node scripts/cleanup-extras.mjs --dry-run
 *   node scripts/cleanup-extras.mjs --confirm
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const SHAHIN_MOTORS_KEEPER = "aiarodiya07@gmail.com";
const DEMO_EMPLOYEE_EMAILS = ["helper@demo.punchless", "mechanic@demo.punchless"];
const DEMO_COMPANY_NAME = "Shahin"; // not "Shahin Motors"

const TABLES_BY_COMPANY = [
  "attendance_imports",
  "ledger_entries",
  "client_payments",
  "supplier_payments",
  "staff_payments",
  "bank_transactions",
  "bank_transfers",
  "salary_advances",
  "salary_deposits",
  "transactions",
  "correction_requests",
  "attendance_sessions",
  "jobs",
  "invoices",
  "purchase_invoices",
  "clients",
  "suppliers",
  "bank_accounts",
  "sticky_notes",
  "audit_logs",
  "push_tokens",
  "employee_fingerprint_aliases",
  "workshops",
  "posts",
];

function loadEnv() {
  const envPath = resolve(root, ".env");
  const vars = {};
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

async function deleteByCompany(admin, table, companyId) {
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .eq("company_id", companyId);
  if (error) return { error: error.message };
  return { deleted: count ?? 0 };
}

async function removeUser(admin, user, dryRun) {
  console.log(`  remove ${user.full_name} <${user.email}>`);
  if (dryRun) return;
  const { error: profileError } = await admin.from("users").delete().eq("id", user.id);
  if (profileError) {
    console.warn(`    profile: ${profileError.message}`);
    return;
  }
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) console.warn(`    auth: ${authError.message}`);
}

async function wipeCompany(admin, companyId, companyName, dryRun) {
  console.log(`\nWipe company: ${companyName} (${companyId})`);

  for (const table of TABLES_BY_COMPANY) {
    const { count } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("company_id", companyId);
    console.log(`  ${table}: ${count ?? 0}`);
    if (!dryRun && (count ?? 0) > 0) {
      const result = await deleteByCompany(admin, table, companyId);
      if (result.error) console.warn(`    FAILED: ${result.error}`);
    }
  }

  const { data: users } = await admin
    .from("users")
    .select("id, email, full_name, role")
    .eq("company_id", companyId);

  console.log(`  users to remove: ${(users ?? []).length}`);
  for (const u of users ?? []) {
    if (dryRun) console.log(`    • ${u.email}`);
    else await removeUser(admin, u, false);
  }

  if (!dryRun) {
    const { error } = await admin.from("companies").delete().eq("id", companyId);
    if (error) console.warn(`  company delete: ${error.message}`);
    else console.log("  company deleted");
  }
}

async function main() {
  const dryRun = !process.argv.includes("--confirm");
  const env = loadEnv();
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(dryRun ? "\n=== DRY RUN ===\n" : "\n=== LIVE CLEANUP ===\n");

  const { data: keeper } = await admin
    .from("users")
    .select("id, company_id, companies(name)")
    .ilike("email", SHAHIN_MOTORS_KEEPER)
    .single();

  if (!keeper) {
    console.error("Keeper not found:", SHAHIN_MOTORS_KEEPER);
    process.exit(1);
  }

  const motorsId = keeper.company_id;
  console.log("Shahin Motors:", keeper.companies?.name, motorsId);

  const { count: aliasCount } = await admin
    .from("employee_fingerprint_aliases")
    .select("*", { count: "exact", head: true })
    .eq("company_id", motorsId);
  const { count: workshopCount } = await admin
    .from("workshops")
    .select("*", { count: "exact", head: true })
    .eq("company_id", motorsId);

  console.log(`\nRemove fingerprint aliases: ${aliasCount ?? 0}`);
  console.log(`Remove workshops: ${workshopCount ?? 0}`);

  if (!dryRun) {
    await deleteByCompany(admin, "employee_fingerprint_aliases", motorsId);
    await deleteByCompany(admin, "workshops", motorsId);
    console.log("  aliases + workshops deleted");
  }

  const { data: demoEmployees } = await admin
    .from("users")
    .select("id, email, full_name, role")
    .eq("company_id", motorsId)
    .in("email", DEMO_EMPLOYEE_EMAILS);

  console.log(`\nRemove demo employees: ${(demoEmployees ?? []).length}`);
  for (const u of demoEmployees ?? []) {
    await removeUser(admin, u, dryRun);
  }

  const { data: demoCompany } = await admin
    .from("companies")
    .select("id, name")
    .eq("name", DEMO_COMPANY_NAME)
    .maybeSingle();

  if (demoCompany?.id === motorsId) {
    console.error('Demo company name "Shahin" matched Shahin Motors — aborting wipe.');
    process.exit(1);
  }

  if (demoCompany) {
    await wipeCompany(admin, demoCompany.id, demoCompany.name, dryRun);
  } else {
    console.log("\nDemo company 'Shahin' not found — skip.");
  }

  const { count: empCount } = await admin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("company_id", motorsId)
    .eq("role", "employee");

  console.log(`\nShahin Motors employees remaining: ${empCount ?? 0}`);
  console.log(dryRun ? "\nDry run done. Pass --confirm to execute.\n" : "\nCleanup complete.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});