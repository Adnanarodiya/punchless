/**
 * One-time seed: Shahin Motors real employee roster (Apr 2026 salary sheet).
 * - Deactivates all existing dummy employees
 * - Creates posts + employees with monthly_salary
 * - Seeds fingerprint name aliases for attendance upload matching
 *
 * Run: node scripts/seed-shahin-employees.mjs
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in root .env
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

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

function calcHourlyRate(monthlySalary, dailyHours = 8, workingDays = 26) {
  const total = dailyHours * workingDays;
  if (total <= 0) return 0;
  return Math.round((monthlySalary / total) * 100) / 100;
}

function emailSlug(fullName, index) {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 40);
  return `${base || `employee.${index}`}@shahinmotors.payroll`;
}

/** @type {Array<{ fullName: string; post: string; salary: number; fingerprintAliases?: string[] }>} */
const EMPLOYEES = [
  { fullName: "ARODIYA BILAL UMAR", post: "DPM", salary: 18150 },
  {
    fullName: "DATA MAHMADSUFYAN ISMAIL",
    post: "ELECTRICIAN",
    salary: 14000,
    fingerprintAliases: ["SUFIYAN DATA"],
  },
  {
    fullName: "KEVIN SIRISH PATEL",
    post: "TECH",
    salary: 18150,
    fingerprintAliases: ["KEVIN PATEL"],
  },
  { fullName: "KEVIN U PATEL", post: "ACCOUNTANT", salary: 7700 },
  { fullName: "RAJ BAVISHKAR", post: "WM", salary: 43000 },
  { fullName: "NAZRUL", post: "TECH", salary: 14000 },
  {
    fullName: "PARVEZ SHAIKH",
    post: "SECURITY GUARD",
    salary: 9500,
    fingerprintAliases: ["PARVEZ SHAIKH"],
  },
  {
    fullName: "RAMESHBHAI BUDHIYABHAI",
    post: "TECH",
    salary: 20000,
    fingerprintAliases: ["RAMESH RATHOD"],
  },
  {
    fullName: "RINKESH VINODBHAI MEHTA",
    post: "SA",
    salary: 19250,
    fingerprintAliases: ["RINKESH MEHTA"],
  },
  { fullName: "AASIM ACHALA", post: "LAND RENT", salary: 40000 },
  {
    fullName: "SALMAN MIRZA",
    post: "TECH",
    salary: 19360,
    fingerprintAliases: ["SALMAN MIRZA"],
  },
  { fullName: "UMER ARODIYA", post: "MD", salary: 38720 },
  {
    fullName: "VIRAL CHAUDHARI",
    post: "TECH",
    salary: 17303,
    fingerprintAliases: ["VIRAL CHAUDHARI"],
  },
  {
    fullName: "AAKIB PATHAN",
    post: "DRIVER",
    salary: 17545,
    fingerprintAliases: ["AAKIB PATHAN"],
  },
  {
    fullName: "SAVAN",
    post: "TECH",
    salary: 8000,
    fingerprintAliases: ["SAVANBHAI RAJUBHAI HALPATI"],
  },
  {
    fullName: "TINA BEN",
    post: "CRO",
    salary: 14520,
    fingerprintAliases: ["TINABEN"],
  },
  {
    fullName: "SUJIT KUMAR",
    post: "TECH",
    salary: 30000,
    fingerprintAliases: ["SAJEET R MAHATO"],
  },
  {
    fullName: "PARVEZ SHAIKH (Housekeeping)",
    post: "HOUSEKEEPING",
    salary: 5000,
  },
  { fullName: "SUHEL SAIF MULLA", post: "OFFICE", salary: 22000 },
];

const DEFAULT_PASSWORD = "Shahin@2026";
const KEEPER_EMAIL = "aiarodiya07@gmail.com";

async function main() {
  const env = loadEnv();
  const url = env.SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: owner, error: ownerError } = await admin
    .from("users")
    .select("id, company_id, companies(name)")
    .ilike("email", KEEPER_EMAIL)
    .maybeSingle();

  if (ownerError || !owner) {
    console.error(`Keeper not found (${KEEPER_EMAIL}):`, ownerError?.message);
    process.exit(1);
  }

  const companyId = owner.company_id;
  console.log("Company:", companyId);

  const { data: company } = await admin
    .from("companies")
    .select("daily_work_hours, working_days_per_month, name")
    .eq("id", companyId)
    .single();

  const dailyHours = Number(company?.daily_work_hours ?? 8);
  const workingDays = Number(company?.working_days_per_month ?? 26);
  console.log("Company name:", owner.companies?.name ?? company?.name);

  const { data: existingEmployees } = await admin
    .from("users")
    .select("id, full_name, email")
    .eq("company_id", companyId)
    .eq("role", "employee");

  for (const emp of existingEmployees ?? []) {
    console.log("Deactivating dummy employee:", emp.full_name);
    await admin
      .from("users")
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq("id", emp.id);
    try {
      await admin.auth.admin.updateUserById(emp.id, { ban_duration: "87600h" });
    } catch (err) {
      console.warn("  (auth ban skipped:", err.message, ")");
    }
  }

  const postIds = new Map();
  const uniquePosts = [...new Set(EMPLOYEES.map((e) => e.post))];

  for (const postName of uniquePosts) {
    const { data: existingPost } = await admin
      .from("posts")
      .select("id")
      .eq("company_id", companyId)
      .ilike("name", postName)
      .eq("is_deleted", false)
      .maybeSingle();

    if (existingPost?.id) {
      postIds.set(postName, existingPost.id);
      continue;
    }

    const { data: createdPost, error: postError } = await admin
      .from("posts")
      .insert({ company_id: companyId, name: postName })
      .select("id")
      .single();

    if (postError) {
      console.error("Post insert failed:", postName, postError.message);
      process.exit(1);
    }
    postIds.set(postName, createdPost.id);
    console.log("Created post:", postName);
  }

  const employeeIdsByName = new Map();

  for (let i = 0; i < EMPLOYEES.length; i++) {
    const row = EMPLOYEES[i];
    const email = emailSlug(row.fullName, i + 1);
    const hourlyRate = calcHourlyRate(row.salary, dailyHours, workingDays);
    const postId = postIds.get(row.post);

    const { data: existingByEmail } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingByEmail?.id) {
      await admin
        .from("users")
        .update({
          company_id: companyId,
          role: "employee",
          full_name: row.fullName,
          monthly_salary: row.salary,
          hourly_rate: hourlyRate,
          daily_shift_hours: dailyHours,
          post_id: postId,
          is_active: true,
          deleted_at: null,
        })
        .eq("id", existingByEmail.id);
      employeeIdsByName.set(row.fullName, existingByEmail.id);
      console.log("Updated employee:", row.fullName);
      continue;
    }

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: row.fullName, role: "employee" },
    });

    if (authError || !authUser.user) {
      console.error("Auth create failed:", row.fullName, authError?.message);
      process.exit(1);
    }

    const { error: profileError } = await admin.from("users").insert({
      id: authUser.user.id,
      company_id: companyId,
      role: "employee",
      full_name: row.fullName,
      email,
      monthly_salary: row.salary,
      hourly_rate: hourlyRate,
      daily_shift_hours: dailyHours,
      post_id: postId,
      is_active: true,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      console.error("Profile insert failed:", row.fullName, profileError.message);
      process.exit(1);
    }

    employeeIdsByName.set(row.fullName, authUser.user.id);
    console.log("Created employee:", row.fullName, `₹${row.salary}`, row.post);
  }

  await admin
    .from("employee_fingerprint_aliases")
    .delete()
    .eq("company_id", companyId);

  for (const row of EMPLOYEES) {
    const employeeId = employeeIdsByName.get(row.fullName);
    if (!employeeId || !row.fingerprintAliases?.length) continue;

    for (const alias of row.fingerprintAliases) {
      const { error: aliasError } = await admin.from("employee_fingerprint_aliases").insert({
        company_id: companyId,
        fingerprint_name: alias,
        employee_id: employeeId,
      });
      if (aliasError) {
        console.warn("Alias failed:", alias, aliasError.message);
      } else {
        console.log("Alias:", alias, "→", row.fullName);
      }
    }
  }

  console.log("\nDone. Seeded", EMPLOYEES.length, "employees.");
  console.log("Payroll-only login emails use @shahinmotors.payroll (mobile not in use).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});