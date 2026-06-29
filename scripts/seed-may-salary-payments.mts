/**
 * Import May 2026 attendance + mark May salary paid from bank entries in shahin data.xlsx
 *
 * 1. Upload MAY 2026 NEW.xlsx fingerprint attendance (2026-05)
 * 2. Create May salary deposits (accrual) for paid employees
 * 3. Convert bank salary transactions → staff_payments (salary_month = 2026-05)
 *
 * Usage:
 *   npx tsx scripts/seed-may-salary-payments.mts --dry-run
 *   npx tsx scripts/seed-may-salary-payments.mts --confirm
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import {
  parseFingerprintWorkbook,
  parseDurationHours,
} from "../apps/web/src/lib/utils/fingerprint-attendance-parser.ts";
import {
  matchEmployeeForFingerprintName,
  type FingerprintEmployeeRecord,
} from "../apps/web/src/lib/utils/fingerprint-salary-report.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const KEEPER_EMAIL = "aiarodiya07@gmail.com";
const SALARY_MONTH = "2026-05";
const ATTENDANCE_FILE = "MAY 2026 NEW.xlsx";
const DEPOSIT_DATE = "2026-05-31";

/** Bank payment particular → employee full_name */
const SALARY_EMPLOYEE_MAP: Array<{ test: RegExp; name: string }> = [
  { test: /bilal arodiya/i, name: "ARODIYA BILAL UMAR" },
  { test: /data mahmad sufiyan/i, name: "DATA MAHMADSUFYAN ISMAIL" },
  { test: /kevin sirish patel/i, name: "KEVIN SIRISH PATEL" },
  { test: /kevin patel ca/i, name: "KEVIN U PATEL" },
  { test: /watchman/i, name: "PARVEZ SHAIKH" },
  { test: /housekeeping/i, name: "PARVEZ SHAIKH (Housekeeping)" },
  { test: /tina p gamit/i, name: "TINA BEN" },
  { test: /savan halpati/i, name: "SAVAN" },
  { test: /viral a chodhri/i, name: "VIRAL CHAUDHARI" },
  { test: /salmanbeg afzalbeg mirza/i, name: "SALMAN MIRZA" },
  { test: /ramesh bhai rathod/i, name: "RAMESHBHAI BUDHIYABHAI" },
  { test: /rinkesh vinodbhai/i, name: "RINKESH VINODBHAI MEHTA" },
  { test: /suhel safi mulla/i, name: "SUHEL SAIF MULLA" },
  { test: /^raj salary$/i, name: "RAJ BAVISHKAR" },
  { test: /umer ibadullah arodiya/i, name: "UMER ARODIYA" },
  { test: /aakib pathan/i, name: "AAKIB PATHAN" },
  { test: /sanjitkumar singh/i, name: "SUJIT KUMAR" },
];

function loadEnv() {
  const vars: Record<string, string> = {};
  for (const line of readFileSync(resolve(root, ".env"), "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 0) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

function resolveEmployeeByParticular(
  particular: string,
  employees: Map<string, { id: string; full_name: string; monthly_salary: number }>
) {
  const entry = SALARY_EMPLOYEE_MAP.find((m) => m.test.test(particular));
  if (!entry) return null;
  return employees.get(entry.name.toUpperCase()) ?? null;
}

async function deleteTransactionWithLedgers(
  admin: ReturnType<typeof createClient>,
  companyId: string,
  transactionId: string
) {
  await admin
    .from("ledger_entries")
    .delete()
    .eq("company_id", companyId)
    .eq("reference_type", "expense")
    .eq("reference_id", transactionId);
  await admin
    .from("ledger_entries")
    .delete()
    .eq("company_id", companyId)
    .eq("entity_type", "bank")
    .eq("reference_id", transactionId);
  await admin.from("transactions").delete().eq("id", transactionId);
}

async function writeStaffPaymentBundle(
  admin: ReturnType<typeof createClient>,
  ctx: {
    companyId: string;
    userId: string;
    employeeId: string;
    employeeName: string;
    amount: number;
    paymentDate: string;
    bankId: string;
    remark: string;
    dryRun: boolean;
  }
) {
  if (ctx.dryRun) return { paymentId: "dry" };

  const { data: payment, error: payErr } = await admin
    .from("staff_payments")
    .insert({
      company_id: ctx.companyId,
      employee_id: ctx.employeeId,
      payment_type: "salary_paid",
      amount: ctx.amount,
      payment_mode: "bank",
      bank_id: ctx.bankId,
      payment_date: ctx.paymentDate,
      salary_month: SALARY_MONTH,
      remark: ctx.remark,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (payErr || !payment) throw new Error(payErr?.message ?? "staff_payment insert failed");

  const paymentId = (payment as { id: string }).id;

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "staff",
    entity_id: ctx.employeeId,
    entry_type: "debit",
    amount: ctx.amount,
    payment_mode: "bank",
    bank_id: ctx.bankId,
    reference_type: "staff_payment",
    reference_id: paymentId,
    remark: ctx.remark,
    entry_date: ctx.paymentDate,
    created_by: ctx.userId,
  });

  const { data: tx, error: txErr } = await admin
    .from("transactions")
    .insert({
      company_id: ctx.companyId,
      particular: `Staff salary paid — ${ctx.employeeName}`,
      amount: ctx.amount,
      transaction_type: "expense",
      payment_mode: "bank",
      bank_id: ctx.bankId,
      transaction_date: ctx.paymentDate,
      remark: ctx.remark,
      created_by: ctx.userId,
    })
    .select("id")
    .single();

  if (txErr || !tx) throw new Error(txErr?.message ?? "transaction insert failed");
  const txId = (tx as { id: string }).id;

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "expense",
    entity_id: txId,
    entry_type: "debit",
    amount: ctx.amount,
    payment_mode: "bank",
    bank_id: ctx.bankId,
    reference_type: "expense",
    reference_id: txId,
    remark: ctx.remark,
    entry_date: ctx.paymentDate,
    created_by: ctx.userId,
  });

  await admin.from("ledger_entries").insert({
    company_id: ctx.companyId,
    entity_type: "bank",
    entity_id: ctx.bankId,
    entry_type: "debit",
    amount: ctx.amount,
    payment_mode: "bank",
    bank_id: ctx.bankId,
    reference_type: "expense",
    reference_id: txId,
    remark: ctx.remark,
    entry_date: ctx.paymentDate,
    created_by: ctx.userId,
  });

  return { paymentId };
}

async function importMayAttendance(
  admin: ReturnType<typeof createClient>,
  ctx: {
    companyId: string;
    userId: string;
    dryRun: boolean;
    employees: FingerprintEmployeeRecord[];
    aliases: Array<{ fingerprint_name: string; employee_id: string }>;
  }
) {
  const buffer = readFileSync(resolve(root, ATTENDANCE_FILE));
  const parsed = parseFingerprintWorkbook(buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ));

  if (parsed.salaryMonth !== SALARY_MONTH) {
    throw new Error(`Expected ${SALARY_MONTH} attendance, got ${parsed.salaryMonth}`);
  }

  console.log(`\n1) May attendance — ${parsed.employees.length} fingerprint rows`);

  if (ctx.dryRun) {
    const matched = parsed.employees.filter((row) =>
      matchEmployeeForFingerprintName(row.fingerprintName, ctx.employees, ctx.aliases)
    ).length;
    console.log(`   Would import ${parsed.employees.length} rows (${matched} matched)`);
    return;
  }

  const { data: existing } = await admin
    .from("attendance_imports")
    .select("id")
    .eq("company_id", ctx.companyId)
    .eq("salary_month", SALARY_MONTH)
    .maybeSingle();

  if (existing?.id) {
    await admin.from("attendance_import_rows").delete().eq("import_id", existing.id);
    await admin.from("attendance_imports").delete().eq("id", existing.id);
  }

  const { data: company } = await admin
    .from("companies")
    .select("working_days_per_month, ot_rate_multiplier")
    .eq("id", ctx.companyId)
    .single();

  const eligibleDays = Number(
    (company as { working_days_per_month: number } | null)?.working_days_per_month ??
      parsed.eligibleDays
  );
  const otRateMultiplier = Number(
    (company as { ot_rate_multiplier: number } | null)?.ot_rate_multiplier ?? 1
  );

  const { data: importRecord, error: importError } = await admin
    .from("attendance_imports")
    .insert({
      company_id: ctx.companyId,
      salary_month: SALARY_MONTH,
      file_name: ATTENDANCE_FILE,
      year: parsed.year,
      month: parsed.month,
      eligible_days: eligibleDays,
      ot_rate_multiplier: otRateMultiplier,
      uploaded_by: ctx.userId,
    })
    .select("id")
    .single();

  if (importError || !importRecord) throw new Error(importError?.message ?? "attendance import failed");

  const importId = (importRecord as { id: string }).id;
  const rowPayload = parsed.employees.map((employee) => {
    const matched = matchEmployeeForFingerprintName(
      employee.fingerprintName,
      ctx.employees,
      ctx.aliases
    );
    return {
      import_id: importId,
      company_id: ctx.companyId,
      fingerprint_name: employee.fingerprintName,
      fingerprint_emp_id: employee.fingerprintEmpId,
      employee_id: matched?.id ?? null,
      days_worked: employee.daysWorked,
      summary_present: employee.summary.present,
      summary_absent: employee.summary.absent,
      summary_half: employee.summary.half,
      ot_hours: parseDurationHours(employee.summary.otHours),
      total_hours: parseDurationHours(employee.summary.totalHours),
      sundays_excluded: employee.sundaysExcluded,
      weekday_absents: employee.weekdayAbsents,
      daily_statuses: employee.dailyStatuses,
      raw_summary: employee.rawSummaryCells,
    };
  });

  const { error: rowsError } = await admin.from("attendance_import_rows").insert(rowPayload);
  if (rowsError) throw new Error(rowsError.message);

  const unmatched = rowPayload.filter((r) => !r.employee_id).length;
  console.log(`   Imported ${rowPayload.length} rows (${unmatched} unmatched)`);
}

async function createMaySalaryDeposits(
  admin: ReturnType<typeof createClient>,
  ctx: {
    companyId: string;
    userId: string;
    dryRun: boolean;
    paidEmployeeIds: Set<string>;
    employees: Map<string, { id: string; full_name: string; monthly_salary: number }>;
  }
) {
  console.log("\n2) May salary deposits (accrual)");

  let count = 0;
  for (const [, emp] of ctx.employees) {
    if (!ctx.paidEmployeeIds.has(emp.id) || !emp.monthly_salary) continue;

    const remark = `May 2026 salary accrual — ${emp.full_name}`;
    if (ctx.dryRun) {
      count++;
      continue;
    }

    const { data: existing } = await admin
      .from("salary_deposits")
      .select("id")
      .eq("company_id", ctx.companyId)
      .eq("employee_id", emp.id)
      .eq("deposit_date", DEPOSIT_DATE)
      .maybeSingle();

    if (existing?.id) continue;

    const { data: deposit, error } = await admin
      .from("salary_deposits")
      .insert({
        company_id: ctx.companyId,
        employee_id: emp.id,
        amount: emp.monthly_salary,
        deposit_date: DEPOSIT_DATE,
        remark,
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (error || !deposit) throw new Error(error?.message ?? "salary deposit failed");

    await admin.from("ledger_entries").insert({
      company_id: ctx.companyId,
      entity_type: "staff",
      entity_id: emp.id,
      entry_type: "credit",
      amount: emp.monthly_salary,
      reference_type: "salary_deposit",
      reference_id: (deposit as { id: string }).id,
      remark,
      entry_date: DEPOSIT_DATE,
      created_by: ctx.userId,
    });
    count++;
  }

  console.log(`   ${count} salary deposits for May 2026`);
}

async function convertBankSalaryPayments(
  admin: ReturnType<typeof createClient>,
  ctx: {
    companyId: string;
    userId: string;
    dryRun: boolean;
    bankId: string;
    employees: Map<string, { id: string; full_name: string; monthly_salary: number }>;
  }
) {
  console.log("\n3) Bank salary payments → staff_payments (May 2026)");

  const { data: salaryTx } = await admin
    .from("transactions")
    .select("id, particular, amount, transaction_date, remark")
    .eq("company_id", ctx.companyId)
    .eq("payment_mode", "bank")
    .or("particular.ilike.%salary%,particular.ilike.%SALARY%")
    .not("particular", "ilike", "Staff salary paid%")
    .order("transaction_date");

  const { data: existingPayments } = await admin
    .from("staff_payments")
    .select("employee_id, amount, payment_date")
    .eq("company_id", ctx.companyId)
    .eq("salary_month", SALARY_MONTH);

  const existingPaymentKeys = new Set(
    (existingPayments ?? []).map(
      (row) =>
        `${(row as { employee_id: string }).employee_id}|${(row as { amount: number }).amount}|${(row as { payment_date: string }).payment_date}`
    )
  );

  const paidEmployeeIds = new Set<string>(
    (existingPayments ?? []).map((row) => (row as { employee_id: string }).employee_id)
  );
  let converted = 0;
  let skipped = 0;

  for (const row of salaryTx ?? []) {
    const tx = row as {
      id: string;
      particular: string;
      amount: number;
      transaction_date: string;
    };

    if (/rent/i.test(tx.particular)) {
      skipped++;
      continue;
    }

    const employee = resolveEmployeeByParticular(tx.particular, ctx.employees);
    if (!employee) {
      console.log(`   ⚠ Unmatched: ${tx.particular} ₹${tx.amount} (${tx.transaction_date})`);
      skipped++;
      continue;
    }

    const paymentKey = `${employee.id}|${tx.amount}|${tx.transaction_date}`;
    if (existingPaymentKeys.has(paymentKey)) {
      paidEmployeeIds.add(employee.id);
      skipped++;
      continue;
    }

    paidEmployeeIds.add(employee.id);
    const remark = `May 2026 salary paid — ${employee.full_name} (bank)`;

    if (!ctx.dryRun) {
      await deleteTransactionWithLedgers(admin, ctx.companyId, tx.id);
      await writeStaffPaymentBundle(admin, {
        companyId: ctx.companyId,
        userId: ctx.userId,
        employeeId: employee.id,
        employeeName: employee.full_name,
        amount: tx.amount,
        paymentDate: tx.transaction_date,
        bankId: ctx.bankId,
        remark,
        dryRun: false,
      });
    }

    converted++;
    console.log(`   ✓ ${employee.full_name} ₹${tx.amount} (${tx.transaction_date})`);
  }

  console.log(`   Converted: ${converted}, skipped/unmatched: ${skipped}`);
  return paidEmployeeIds;
}

async function main() {
  const dryRun = !process.argv.includes("--confirm");
  const env = loadEnv();
  const admin = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(dryRun ? "\n=== DRY RUN ===" : "\n=== LIVE SEED ===");

  const { data: keeper } = await admin
    .from("users")
    .select("id, company_id, companies(name)")
    .ilike("email", KEEPER_EMAIL)
    .single();

  if (!keeper) throw new Error(`Keeper not found: ${KEEPER_EMAIL}`);

  const companyId = (keeper as { company_id: string }).company_id;
  const userId = (keeper as { id: string }).id;
  console.log("Company:", (keeper as { companies: { name: string } }).companies?.name);

  const [{ data: empRows }, { data: aliasRows }, { data: bank }] = await Promise.all([
    admin
      .from("users")
      .select("id, full_name, monthly_salary, posts(name)")
      .eq("company_id", companyId)
      .eq("role", "employee")
      .eq("is_active", true),
    admin
      .from("employee_fingerprint_aliases")
      .select("fingerprint_name, employee_id")
      .eq("company_id", companyId),
    admin.from("bank_accounts").select("id").eq("company_id", companyId).limit(1).maybeSingle(),
  ]);

  if (!bank?.id) throw new Error("No bank account found");

  const fingerprintEmployees: FingerprintEmployeeRecord[] = (empRows ?? []).map((row) => {
    const r = row as {
      id: string;
      full_name: string;
      monthly_salary: number | null;
      posts: { name: string } | null;
    };
    return {
      id: r.id,
      fullName: r.full_name,
      monthlySalary: Number(r.monthly_salary ?? 0),
      designation: r.posts?.name ?? null,
    };
  });

  const employeeMap = new Map(
    (empRows ?? []).map((row) => {
      const r = row as { id: string; full_name: string; monthly_salary: number | null };
      return [
        r.full_name.toUpperCase(),
        {
          id: r.id,
          full_name: r.full_name,
          monthly_salary: Number(r.monthly_salary ?? 0),
        },
      ];
    })
  );

  await importMayAttendance(admin, {
    companyId,
    userId,
    dryRun,
    employees: fingerprintEmployees,
    aliases: (aliasRows ?? []) as Array<{ fingerprint_name: string; employee_id: string }>,
  });

  const paidEmployeeIds = await convertBankSalaryPayments(admin, {
    companyId,
    userId,
    dryRun,
    bankId: bank.id as string,
    employees: employeeMap,
  });

  await createMaySalaryDeposits(admin, {
    companyId,
    userId,
    dryRun,
    paidEmployeeIds,
    employees: employeeMap,
  });

  if (dryRun) {
    console.log("\nDry run done. Re-run with --confirm to apply.\n");
  } else {
    console.log("\nDone. Check Dashboard → Salary → May 2026 and employee statements.\n");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});