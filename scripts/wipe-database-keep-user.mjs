/**
 * Full database wipe — keep ONE login user only (default: aiarodiya07@gmail.com).
 *
 * Deletes ALL transactional data, employees, posts, workshops, other companies,
 * and all auth accounts except the keeper.
 *
 * Keeps: keeper's company row + keeper public.users + keeper auth.users
 *
 * Usage:
 *   node scripts/wipe-database-keep-user.mjs --dry-run
 *   node scripts/wipe-database-keep-user.mjs --confirm
 *   node scripts/wipe-database-keep-user.mjs --confirm --keeper=other@email.com
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

/** Child tables first; attendance_import_rows / invoice_line_items cascade from parents. */
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
  "sales_register_imports",
  "invoices",
  "purchase_invoices",
  "clients",
  "suppliers",
  "bank_accounts",
  "sticky_notes",
  "audit_logs",
  "push_tokens",
  "employee_fingerprint_aliases",
];

/** Deleted after all non-keeper users are removed (FK: users.post_id / users.workshop_id). */
const STRUCTURE_TABLES_BY_COMPANY = ["workshops", "posts"];

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

async function deleteByCompany(admin, table, companyId) {
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

  console.log(
    dryRun
      ? "\n=== DRY RUN (pass --confirm to wipe database) ===\n"
      : "\n=== LIVE DATABASE WIPE ===\n"
  );
  console.log("Keeper login:", keeperEmail);

  const { data: keeper, error: keeperError } = await admin
    .from("users")
    .select("id, email, full_name, role, company_id, companies(id, name)")
    .ilike("email", keeperEmail)
    .maybeSingle();

  if (keeperError || !keeper) {
    console.error("Keeper user not found in public.users:", keeperEmail, keeperError?.message);
    process.exit(1);
  }

  const keeperCompanyId = keeper.company_id;
  console.log("Keeper:", keeper.full_name, `(${keeper.role})`);
  console.log("Company to keep:", keeper.companies?.name ?? keeperCompanyId, `(${keeperCompanyId})\n`);

  const { data: companies, error: companiesError } = await admin
    .from("companies")
    .select("id, name");
  if (companiesError) {
    console.error("Failed to list companies:", companiesError.message);
    process.exit(1);
  }

  const { data: allProfiles, error: profilesError } = await admin
    .from("users")
    .select("id, email, full_name, role, company_id");
  if (profilesError) {
    console.error("Failed to list users:", profilesError.message);
    process.exit(1);
  }

  const authUsers = await listAuthUsers(admin);
  const profilesToRemove = (allProfiles ?? []).filter((u) => u.id !== keeper.id);
  const authToRemove = authUsers.filter(
    (u) => u.email?.toLowerCase() !== keeperEmail
  );
  const companiesToRemove = (companies ?? []).filter((c) => c.id !== keeperCompanyId);

  console.log("Companies to DELETE:", companiesToRemove.length);
  for (const c of companiesToRemove) {
    console.log(`  • ${c.name} (${c.id})`);
  }

  console.log("\nProfiles to DELETE:", profilesToRemove.length);
  for (const u of profilesToRemove) {
    console.log(`  • ${u.full_name} <${u.email}> (${u.role})`);
  }

  console.log("\nAuth accounts to DELETE:", authToRemove.length);
  for (const u of authToRemove) {
    console.log(`  • ${u.email ?? u.id}`);
  }

  console.log("\nData rows to delete by company:");
  for (const company of companies ?? []) {
    console.log(`\n  [${company.name}]`);
    for (const table of TABLES_BY_COMPANY) {
      const result = await countRows(admin, table, company.id);
      if (result.error) {
        console.log(`    ${table}: (skip — ${result.error})`);
      } else if (result.count > 0) {
        console.log(`    ${table}: ${result.count}`);
      }
    }
  }

  if (dryRun) {
    console.log("\nDry run complete. Re-run with --confirm to wipe everything.\n");
    return;
  }

  console.log("\nDeleting transactional data…");
  for (const company of companies ?? []) {
    console.log(`\n  Company: ${company.name}`);
    for (const table of TABLES_BY_COMPANY) {
      const result = await deleteByCompany(admin, table, company.id);
      if (result.error) {
        console.warn(`    ${table}: FAILED — ${result.error}`);
      } else if (result.deleted > 0) {
        console.log(`    ${table}: deleted ${result.deleted}`);
      }
    }
  }

  console.log("\nClearing keeper profile links before user removal…");
  const { error: preResetError } = await admin
    .from("users")
    .update({
      workshop_id: null,
      post_id: null,
    })
    .eq("id", keeper.id);
  if (preResetError) {
    console.warn("  keeper pre-reset:", preResetError.message);
  }

  console.log("\nRemoving user profiles…");
  for (const u of profilesToRemove) {
    const { error } = await admin.from("users").delete().eq("id", u.id);
    if (error) console.warn(`  ${u.email}: ${error.message}`);
    else console.log(`  removed profile ${u.email}`);
  }

  console.log("\nDeleting workshops + posts…");
  for (const company of companies ?? []) {
    for (const table of STRUCTURE_TABLES_BY_COMPANY) {
      const result = await deleteByCompany(admin, table, company.id);
      if (result.error) {
        console.warn(`    ${table}: FAILED — ${result.error}`);
      } else if (result.deleted > 0) {
        console.log(`    ${table}: deleted ${result.deleted}`);
      }
    }
  }

  console.log("\nRemoving auth accounts…");
  for (const u of authToRemove) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.warn(`  ${u.email ?? u.id}: ${error.message}`);
    else console.log(`  removed auth ${u.email ?? u.id}`);
  }

  console.log("\nRemoving extra companies…");
  for (const c of companiesToRemove) {
    const { error } = await admin.from("companies").delete().eq("id", c.id);
    if (error) console.warn(`  ${c.name}: ${error.message}`);
    else console.log(`  deleted company ${c.name}`);
  }

  console.log("\nResetting keeper profile links…");
  const { error: resetError } = await admin
    .from("users")
    .update({
      workshop_id: null,
      post_id: null,
      phone: null,
      address: null,
      account_no: null,
      ifsc_code: null,
      monthly_salary: null,
      hourly_rate: null,
      daily_shift_hours: null,
      joining_date: null,
      deleted_at: null,
      is_active: true,
      role: keeper.role === "employee" ? "owner" : keeper.role,
    })
    .eq("id", keeper.id);
  if (resetError) {
    console.warn("  keeper reset:", resetError.message);
  } else {
    console.log("  keeper profile cleaned (owner login ready)");
  }

  console.log("\nRestoring system parties (INCOME + EXPENSE)…");
  const { error: systemPartiesError } = await admin.rpc(
    "ensure_system_parties",
    { p_company_id: keeperCompanyId }
  );
  if (systemPartiesError) {
    console.warn("  ensure_system_parties:", systemPartiesError.message);
  } else {
    console.log("  INCOME client + EXPENSE supplier ready");
  }

  console.log("\nDone. Database is empty except:");
  console.log(`  Login: ${keeperEmail}`);
  console.log(`  Company: ${keeper.companies?.name ?? keeperCompanyId}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});