"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/utils/action-result";

export async function approveCorrectionRequest(formData: FormData): Promise<ActionResult> {
  const requestId = formData.get("requestId") as string;
  const adminNotes = formData.get("adminNotes") as string | null;

  if (!requestId) return { success: false, error: "Missing request ID" };

  const supabase = await createClient() as any;

  // Get the request details
  const { data: request } = await supabase
    .from("correction_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) return { success: false, error: "Request not found" };

  // Get current user (admin)
  const { data: { user } } = await supabase.auth.getUser();

  // Update the correction request status
  const { error: updateError } = await supabase
    .from("correction_requests")
    .update({
      status: "approved",
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq("id", requestId);

  if (updateError) return { success: false, error: updateError.message };

  // If there's a session to correct, update it
  if (request.session_id && request.requested_start_time && request.requested_end_time) {
    const startMs = new Date(request.requested_start_time).getTime();
    const endMs = new Date(request.requested_end_time).getTime();
    const durationMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));

    await supabase
      .from("attendance_sessions")
      .update({
        start_time: request.requested_start_time,
        end_time: request.requested_end_time,
        duration_minutes: durationMinutes,
      })
      .eq("id", request.session_id);
  }

  revalidatePath("/dashboard/requests");
  return { success: true };
}

export async function rejectCorrectionRequest(formData: FormData): Promise<ActionResult> {
  const requestId = formData.get("requestId") as string;
  const adminNotes = formData.get("adminNotes") as string | null;

  if (!requestId) return { success: false, error: "Missing request ID" };

  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("correction_requests")
    .update({
      status: "rejected",
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
      admin_notes: adminNotes || null,
    })
    .eq("id", requestId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/requests");
  return { success: true };
}
