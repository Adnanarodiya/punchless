/**
 * Salary already paid per employee for a payroll month.
 * Uses salary_month when set (pay in June for May still counts for May).
 * Falls back to payment_date in calendar month for legacy rows.
 */
export async function fetchSalaryPaidByEmployeeForMonth(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  monthStr: string,
  monthStart: string,
  monthEnd: string
): Promise<Map<string, number>> {
  const paidMap = new Map<string, number>();

  const [{ data: bySalaryMonth }, { data: byPaymentDate }] = await Promise.all([
    supabase
      .from("staff_payments")
      .select("employee_id, amount")
      .eq("payment_type", "salary_paid")
      .eq("salary_month", monthStr),
    supabase
      .from("staff_payments")
      .select("employee_id, amount")
      .eq("payment_type", "salary_paid")
      .is("salary_month", null)
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEnd),
  ]);

  for (const source of [bySalaryMonth, byPaymentDate]) {
    if (!source) continue;
    for (const row of source) {
      const empId = (row as { employee_id: string }).employee_id;
      const amt = Number((row as { amount: number }).amount ?? 0);
      paidMap.set(empId, (paidMap.get(empId) ?? 0) + amt);
    }
  }

  return paidMap;
}