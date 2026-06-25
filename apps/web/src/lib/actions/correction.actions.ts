"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";

function getRequestId(formData: FormData): string | null {
  const id = formData.get("requestId");
  return typeof id === "string" && id.length > 0 ? id : null;
}

export const approveCorrectionRequest = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: {
    action: "approve_correction",
    entityType: "correction_request",
    entityId: (formData) => getRequestId(formData),
    summary: () => "Attendance correction request approved",
  },
})(async (formData, { supabase }) => {
  const requestId = getRequestId(formData);
  const adminNotes = formData.get("adminNotes") as string | null;

  if (!requestId) return { success: false, error: "Missing request ID" };

  const { data: request } = await supabase
    .from("correction_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request) return { success: false, error: "Request not found" };

  const { data: { user } } = await supabase.auth.getUser();

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

  if (
    request.session_id &&
    request.requested_start_time &&
    request.requested_end_time
  ) {
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
  revalidatePath("/dashboard/audit-log");
  return { success: true };
});

export const rejectCorrectionRequest = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: {
    action: "reject_correction",
    entityType: "correction_request",
    entityId: (formData) => getRequestId(formData),
    summary: () => "Attendance correction request rejected",
  },
})(async (formData, { supabase }) => {
  const requestId = getRequestId(formData);
  const adminNotes = formData.get("adminNotes") as string | null;

  if (!requestId) return { success: false, error: "Missing request ID" };

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
  revalidatePath("/dashboard/audit-log");
  return { success: true };
});