import { supabase } from "@/lib/supabase";

export type CorrectionRequest = {
  id: string;
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
  admin_notes: string | null;
  created_at: string | null;
};

/**
 * Get all correction requests for the current employee
 */
export async function getMyCorrectionRequests(employeeId: string): Promise<CorrectionRequest[]> {
  const { data } = await supabase
    .from("correction_requests")
    .select("*")
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as CorrectionRequest[];
}

/**
 * Submit a break correction request
 */
export async function submitBreakCorrection(params: {
  employeeId: string;
  companyId: string;
  sessionId: string;
  originalStart: string;
  originalEnd: string | null;
  requestedStart: string;
  requestedEnd: string;
  date: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("correction_requests").insert({
    company_id: params.companyId,
    employee_id: params.employeeId,
    session_id: params.sessionId,
    request_type: "break_correction",
    original_start_time: params.originalStart,
    original_end_time: params.originalEnd,
    original_state: "break",
    requested_start_time: params.requestedStart,
    requested_end_time: params.requestedEnd,
    requested_state: "break",
    date: params.date,
    reason: params.reason,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Submit a general session correction request
 */
export async function submitSessionCorrection(params: {
  employeeId: string;
  companyId: string;
  sessionId?: string;
  originalStart?: string;
  originalEnd?: string | null;
  originalState?: string;
  requestedStart: string;
  requestedEnd: string;
  requestedState?: string;
  date: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("correction_requests").insert({
    company_id: params.companyId,
    employee_id: params.employeeId,
    session_id: params.sessionId ?? null,
    request_type: params.sessionId ? "session_correction" : "missing_session",
    original_start_time: params.originalStart ?? null,
    original_end_time: params.originalEnd ?? null,
    original_state: params.originalState ?? null,
    requested_start_time: params.requestedStart,
    requested_end_time: params.requestedEnd,
    requested_state: params.requestedState ?? null,
    date: params.date,
    reason: params.reason,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
