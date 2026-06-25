import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@punchless/types/database.types";

type AppSupabase = SupabaseClient<Database>;

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  const label = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const today = now.toISOString().slice(0, 10);
  return { start, end, label, today };
}

/**
 * Keeps the current month's salary_deposit in sync with employee monthly_salary.
 * - No deposit this month → create one
 * - Exactly one deposit this month → update amount
 * - Multiple deposits → update only the auto-sync row (remark starts with "Monthly salary")
 */
export async function syncMonthlySalaryDeposit(
  supabase: AppSupabase,
  params: {
    companyId: string;
    employeeId: string;
    employeeName: string;
    monthlySalary: number;
    createdBy: string;
  }
): Promise<void> {
  const { companyId, employeeId, employeeName, monthlySalary, createdBy } =
    params;

  if (monthlySalary <= 0) return;

  const { start, end, label, today } = currentMonthRange();
  const remark = `Monthly salary — ${label}`;
  const ledgerRemark = `Salary deposit — ${employeeName} (${label})`;

  const { data: existing } = await supabase
    .from("salary_deposits")
    .select("id, amount, remark")
    .eq("employee_id", employeeId)
    .gte("deposit_date", start)
    .lte("deposit_date", end);

  const rows = existing ?? [];

  let targetId: string | null = null;

  if (rows.length === 1) {
    targetId = rows[0].id;
  } else if (rows.length > 1) {
    const autoRow = rows.find((row) =>
      row.remark?.startsWith("Monthly salary")
    );
    targetId = autoRow?.id ?? null;
  }

  if (targetId) {
    const current = rows.find((row) => row.id === targetId);
    if (current && Number(current.amount) === monthlySalary) return;

    await supabase
      .from("salary_deposits")
      .update({
        amount: monthlySalary,
        remark,
      } as never)
      .eq("id", targetId);

    await supabase
      .from("ledger_entries")
      .update({
        amount: monthlySalary,
        remark: ledgerRemark,
      } as never)
      .eq("reference_type", "salary_deposit")
      .eq("reference_id", targetId);

    return;
  }

  const { data: deposit, error } = await supabase
    .from("salary_deposits")
    .insert({
      company_id: companyId,
      employee_id: employeeId,
      amount: monthlySalary,
      deposit_date: today,
      remark,
      created_by: createdBy,
    } as never)
    .select("id")
    .single();

  if (error || !deposit) return;

  await supabase.from("ledger_entries").insert({
    company_id: companyId,
    entity_type: "staff",
    entity_id: employeeId,
    entry_type: "credit",
    amount: monthlySalary,
    reference_type: "salary_deposit",
    reference_id: deposit.id,
    remark: ledgerRemark,
    entry_date: today,
    created_by: createdBy,
  } as never);
}