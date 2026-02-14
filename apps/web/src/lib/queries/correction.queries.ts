import { createClient } from "@/lib/supabase/server";

export type CorrectionRequestWithEmployee = {
  id: string;
  company_id: string;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  session_id: string | null;
  request_type: string;
  original_start_time: string | null;
  original_end_time: string | null;
  original_state: string | null;
  requested_start_time: string | null;
  requested_end_time: string | null;
  requested_state: string | null;
  date: string;
  reason: string;
  status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string | null;
};

export async function getCorrectionRequests(
  status?: string
): Promise<CorrectionRequestWithEmployee[]> {
  const supabase = await createClient();

  let query = (supabase
    .from("correction_requests" as any)
    .select("*, users(full_name, email)")
    .order("created_at", { ascending: false }) as any);

  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;

  type RawRow = any & {
    users: { full_name: string; email: string } | null;
  };

  const rows = (data as unknown as RawRow[]) ?? [];

  return rows.map((r: RawRow) => ({
    ...r,
    employee_name: r.users?.full_name ?? "Unknown",
    employee_email: r.users?.email ?? "",
  }));
}

export async function getPendingRequestCount(): Promise<number> {
  const supabase = await createClient();

  const { count } = await (supabase
    .from("correction_requests" as any)
    .select("*", { count: "exact", head: true })
    .eq("status", "pending") as any);

  return count ?? 0;
}
