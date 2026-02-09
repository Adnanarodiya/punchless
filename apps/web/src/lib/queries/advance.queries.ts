import { createClient } from "@/lib/supabase/server";

export type AdvanceWithEmployee = {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  amount: number;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approver_name: string | null;
  approved_at: string | null;
  notes: string | null;
  salary_month: string | null;
  requested_at: string | null;
  created_at: string | null;
};

/**
 * Get all advances for the current company, with employee name joined
 */
export async function getAdvances(): Promise<AdvanceWithEmployee[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salary_advances")
    .select(`
      *,
      employee:users!salary_advances_employee_id_fkey(full_name),
      approver:users!salary_advances_approved_by_fkey(full_name)
    `)
    .order("requested_at", { ascending: false });

  if (error || !data) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    company_id: row.company_id,
    employee_id: row.employee_id,
    employee_name: row.employee?.full_name ?? "Unknown",
    amount: row.amount,
    reason: row.reason,
    status: row.status ?? "pending",
    approved_by: row.approved_by,
    approver_name: row.approver?.full_name ?? null,
    approved_at: row.approved_at,
    notes: row.notes,
    salary_month: row.salary_month,
    requested_at: row.requested_at,
    created_at: row.created_at,
  }));
}

/**
 * Get total approved advances for a specific employee in a specific month
 */
export async function getApprovedAdvancesForMonth(
  employeeId: string,
  monthStr: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salary_advances")
    .select("amount")
    .eq("employee_id", employeeId)
    .eq("status", "approved")
    .eq("salary_month", monthStr);

  if (error || !data) return 0;

  return (data as unknown as { amount: number }[]).reduce((sum, row) => sum + (row.amount ?? 0), 0);
}

/**
 * Get pending advance count (for dashboard stats)
 */
export async function getPendingAdvanceCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("salary_advances")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) return 0;
  return count ?? 0;
}
