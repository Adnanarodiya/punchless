/**
 * Reset company data — keep employee roster + one owner user, delete everything else.
 *
 * Keeps: company, posts, employees (role=employee), one keeper account (default: aiarodiya07@gmail.com)
 * Also removes by default: workshops, fingerprint aliases, @demo.punchless employees
 * Optional: --wipe-demo-company removes separate "Shahin" demo tenant
 *
 * Deletes: clients, suppliers, invoices, payments, salary proofs, attendance,
 *          banks, transactions, jobs, audit logs, other dashboard users + auth.
 *
 * Usage:
 *   node scripts/reset-company-data.mjs --dry-run
 *   node scripts/reset-company-data.mjs --confirm --keeper=aiardoiya07@gmail.com
 *
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in root .env
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const DEFAULT_KEEPER = "aiarodiya07@gmail.com";

/** Tables wiped by company_id (order: children / dependents first). */
const TABLES_BY_COMPANY = [
  // attendance_import_rows + invoice_line_items cascade from parents
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
  "sales_register_imports",
  "invoices",
  "purchase_invoices",
  "clients",
  "suppliers",
  "bank_accounts",
  "sticky_notes",
  "audit_logs",
  "push_tokens",
];

function loadEnv() {
  const envPath = resolve(root, ".env");
  const vars = {};
  try {
    const text = readFileSync(envPath, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
  } catch {
    console.error("Could not read .env at", envPath);
    process.exit(1);
  }
  return vars;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run") || !args.includes("--confirm");
  const keeperArg = args.find((a) => a.startsWith("--keeper="));
  const keeperEmail = (keeperArg?.split("=")[1] || DEFAULT_KEEPER).trim().toLowerCase();
  return { dryRun, keeperEmail };
}

async function countRows(admin, table, companyId) {
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

async function deleteByCompany(admin, table, companyId, dryRun) {
  if (dryRun) return { deleted: 0, skipped: true };
  const { error, count } = await admin
    .from(table)
    .delete({ count: "exact" })
    .eq("company_id", companyId);
  if (error) return { error: error.message };
  return { deleted: count ?? 0 };
}

async function listAuthUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    users.push(...(data.users ?? []));
    if ((data.users ?? []).length < perPage) break;
    page += 1;
  }
  return users;
}

async function main() {
  const { dryRun, keeperEmail } = parseArgs();
  const env = loadEnv();
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(dryRun ? "\n=== DRY RUN (pass --confirm to execute) ===\n" : "\n=== LIVE RESET ===\n");
  console.log("Keeper account:", keeperEmail);

  const { data: keeper, error: keeperError } = await admin
    .from("users")
    .select("id, email, full_name, role, company_id, companies(name)")
    .ilike("email", keeperEmail)
    .maybeSingle();

  if (keeperError || !keeper) {
    console.error("Keeper user not found:", keeperEmail, keeperError?.message);
    process.exit(1);
  }

  const companyId = keeper.company_id;
  const companyName = keeper.companies?.name ?? companyId;
  console.log("Company:", companyName, `(${companyId})`);
  console.log("Keeper:", keeper.full_name, `— ${keeper.role}\n`);

  const { data: allUsers, error: usersError } = await admin
    .from("users")
    .select("id, email, full_name, role")
    .eq("company_id", companyId);

  if (usersError) {
    console.error("Failed to list users:", usersError.message);
    process.exit(1);
  }

  const employees = (allUsers ?? []).filter((u) => u.role === "employee");
  const usersToRemove = (allUsers ?? []).filter(
    (u) => u.role !== "employee" && u.email.toLowerCase() !== keeperEmail
  );

  console.log("Users to KEEP:");
  console.log(`  • ${keeper.full_name} <${keeper.email}> (${keeper.role})`);
  console.log(`  • ${employees.length} employees`);
  console.log("\nUsers to REMOVE:", usersToRemove.length);
  for (const u of usersToRemove) {
    console.log(`  • ${u.full_name} <${u.email}> (${u.role})`);
  }

  console.log("\nRow counts to delete:");
  for (const table of TABLES_BY_COMPANY) {
    const result = await countRows(admin, table, companyId);
    if (result.error) {
      console.log(`  ${table}: (skip — ${result.error})`);
    } else {
      console.log(`  ${table}: ${result.count}`);
    }
  }

  const { count: aliasCount } = await admin
    .from("employee_fingerprint_aliases")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  console.log(`\nKeeping employee_fingerprint_aliases: ${aliasCount ?? 0}`);
  const { count: postCount } = await admin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  console.log(`Keeping posts (job titles): ${postCount ?? 0}`);
  const { count: workshopCount } = await admin
    .from("workshops")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);
  console.log(`Keeping workshops: ${workshopCount ?? 0}`);

  if (dryRun) {
    console.log("\nDry run complete. Re-run with --confirm to wipe data.\n");
    return;
  }

  console.log("\nDeleting transactional data…");
  for (const table of TABLES_BY_COMPANY) {
    const result = await deleteByCompany(admin, table, companyId, false);
    if (result.error) {
      console.warn(`  ${table}: FAILED — ${result.error}`);
    } else {
      console.log(`  ${table}: deleted ${result.deleted}`);
    }
  }

  console.log("\nRemoving extra dashboard users…");
  for (const u of usersToRemove) {
    const { error: profileError } = await admin.from("users").delete().eq("id", u.id);
    if (profileError) {
      console.warn(`  profile ${u.email}: ${profileError.message}`);
      continue;
    }
    const { error: authError } = await admin.auth.admin.deleteUser(u.id);
    if (authError) {
      console.warn(`  auth ${u.email}: ${authError.message}`);
    } else {
      console.log(`  removed ${u.email}`);
    }
  }

  console.log("\nDone. Fresh slate — employees +", keeperEmail, "only.");
  console.log("Log in as", keeperEmail, "and rebuild customers, bills, payments from scratch.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});