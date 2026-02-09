import { supabase } from "@/lib/supabase";

export type MyAdvance = {
  id: string;
  amount: number;
  reason: string | null;
  status: string;
  salary_month: string | null;
  requested_at: string | null;
  notes: string | null;
};

export async function getMyAdvances(employeeId: string): Promise<MyAdvance[]> {
  const { data } = await supabase
    .from("salary_advances")
    .select("id, amount, reason, status, salary_month, requested_at, notes")
    .eq("employee_id", employeeId)
    .order("requested_at", { ascending: false });

  return (data ?? []) as MyAdvance[];
}

export async function requestAdvance(params: {
  companyId: string;
  employeeId: string;
  amount: number;
  reason?: string;
  salaryMonth?: string;
}) {
  return supabase.from("salary_advances").insert({
    company_id: params.companyId,
    employee_id: params.employeeId,
    amount: params.amount,
    reason: params.reason || null,
    salary_month: params.salaryMonth || null,
    status: "pending",
  });
}
