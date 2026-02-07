"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@punchless/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

async function getMe() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  const me = data as UserRow | null;
  if (!me || !["owner", "admin"].includes(me.role)) throw new Error("Only owner/admin allowed");
  return { supabase, me };
}

/**
 * Manually create an attendance session (for testing / corrections)
 */
export async function createAttendanceSession(formData: FormData): Promise<void> {
  const { supabase, me } = await getMe();

  const employeeId = String(formData.get("employeeId") || "");
  const state = String(formData.get("state") || "workshop");
  const workshopId = String(formData.get("workshopId") || "") || null;
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "") || null;

  if (!employeeId || !startTime) {
    throw new Error("Employee and start time are required");
  }

  // Calculate duration if end time provided
  let durationMinutes: number | null = null;
  if (endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMinutes < 0) throw new Error("End time must be after start time");
  }

  const payload = {
    company_id: me.company_id,
    employee_id: employeeId,
    state,
    workshop_id: workshopId,
    start_time: new Date(startTime).toISOString(),
    end_time: endTime ? new Date(endTime).toISOString() : null,
    duration_minutes: durationMinutes,
  };

  const { error } = await supabase
    .from("attendance_sessions")
    .insert(payload as unknown as never);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
}

/**
 * Manually close an open session (set end_time to now)
 */
export async function closeAttendanceSession(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) throw new Error("Session ID required");

  // Fetch the session to get start_time
  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("start_time")
    .eq("id", sessionId)
    .single();

  if (!session) throw new Error("Session not found");

  const startTime = new Date((session as { start_time: string }).start_time);
  const endTime = new Date();
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  const { error } = await supabase
    .from("attendance_sessions")
    .update({
      end_time: endTime.toISOString(),
      duration_minutes: durationMinutes,
    } as unknown as never)
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
}

/**
 * Delete an attendance session (for corrections)
 */
export async function deleteAttendanceSession(formData: FormData): Promise<void> {
  const { supabase } = await getMe();

  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) throw new Error("Session ID required");

  const { error } = await supabase
    .from("attendance_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/attendance");
}
