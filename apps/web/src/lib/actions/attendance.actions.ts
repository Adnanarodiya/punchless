"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/server/protected-action";
import {
  bulkAttendanceSchema,
  createAttendanceSchema,
} from "@/lib/validations/attendance.schema";

export const createAttendanceSession = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "create_attendance_session", entityType: "attendance" },
})(async (formData, { supabase, me }) => {
  const parsed = createAttendanceSchema.safeParse({
    employeeId: String(formData.get("employeeId") || ""),
    state: String(formData.get("state") || "workshop"),
    workshopId: String(formData.get("workshopId") || ""),
    startTime: String(formData.get("startTime") || ""),
    endTime: String(formData.get("endTime") || ""),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { employeeId, state, workshopId, startTime, endTime } = parsed.data;

  const startISO = new Date(startTime).toISOString();
  const endISO = endTime ? new Date(endTime).toISOString() : null;

  // Check if employee is currently active
  const { data: activeSession } = await supabase
    .from("attendance_sessions")
    .select("state, workshops(name), jobs(title)")
    .eq("employee_id", employeeId)
    .is("end_time", null)
    .maybeSingle();

  type ActiveSessionWithRelations = {
    state: string;
    workshops: { name: string } | null;
    jobs: { title: string } | null;
  };

  if (activeSession) {
    const session = activeSession as unknown as ActiveSessionWithRelations;
    const location = session.workshops?.name || session.jobs?.title || session.state;
    return { success: false, error: `Employee is already active at ${location}. Please close that session first.` };
  }

  // Check for time overlaps
  if (endISO) {
    const { data: overlap } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("employee_id", employeeId)
      .lte("start_time", endISO)
      .gte("end_time", startISO)
      .limit(1);

    if (overlap && overlap.length > 0) {
      return { success: false, error: "Time range overlaps with an existing session." };
    }
  } else {
    const { data: overlap } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("employee_id", employeeId)
      .lte("start_time", startISO)
      .gte("end_time", startISO)
      .limit(1);

    if (overlap && overlap.length > 0) {
      return { success: false, error: "Start time falls within an existing completed session." };
    }
  }

  // Calculate duration if end time provided
  let durationMinutes: number | null = null;
  if (endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (durationMinutes < 0) return { success: false, error: "End time must be after start time" };
  }

  const { error } = await supabase
    .from("attendance_sessions")
    .insert({
      company_id: me.company_id,
      employee_id: employeeId,
      state,
      workshop_id: workshopId || null,
      start_time: startISO,
      end_time: endISO,
      duration_minutes: durationMinutes,
    } as unknown as never);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/attendance");
  return { success: true };
});

export const closeAttendanceSession = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "close_attendance_session", entityType: "attendance" },
})(async (formData, { supabase }) => {
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) return { success: false, error: "Session ID required" };

  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("start_time")
    .eq("id", sessionId)
    .single();

  if (!session) return { success: false, error: "Session not found" };

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

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/attendance");
  return { success: true };
});

export const deleteAttendanceSession = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "delete_attendance_session", entityType: "attendance" },
})(async (formData, { supabase }) => {
  const sessionId = String(formData.get("sessionId") || "");
  if (!sessionId) return { success: false, error: "Session ID required" };

  const { error } = await supabase
    .from("attendance_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/attendance");
  return { success: true };
});

export const bulkMarkAttendance = protectedAction<FormData>({
  roles: ["owner", "admin"],
  audit: { action: "bulk_mark_attendance", entityType: "attendance" },
})(async (formData, { supabase, me }) => {
  const parsed = bulkAttendanceSchema.safeParse({
    attendanceDate: formData.get("attendanceDate"),
    workshopId: formData.get("workshopId"),
    employeeIds: formData.getAll("employeeIds").map(String),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { success: false, error: firstError?.message || "Validation failed" };
  }

  const { attendanceDate, workshopId, employeeIds } = parsed.data;

  const { data: companySettings } = await supabase
    .from("companies")
    .select("daily_work_hours")
    .eq("id", me.company_id)
    .single();

  const dailyHours = companySettings?.daily_work_hours ?? 8;
  const start = new Date(`${attendanceDate}T09:00:00`);
  const end = new Date(start);
  end.setHours(end.getHours() + dailyHours);

  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const durationMinutes = dailyHours * 60;

  let created = 0;
  const skipped: string[] = [];

  for (const employeeId of employeeIds) {
    const dayStart = `${attendanceDate}T00:00:00`;
    const dayEnd = `${attendanceDate}T23:59:59`;

    const { data: existing } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("employee_id", employeeId)
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)
      .limit(1);

    if (existing && existing.length > 0) {
      skipped.push(employeeId);
      continue;
    }

    const { error } = await supabase.from("attendance_sessions").insert({
      company_id: me.company_id,
      employee_id: employeeId,
      state: "workshop",
      workshop_id: workshopId,
      start_time: startISO,
      end_time: endISO,
      duration_minutes: durationMinutes,
    } as unknown as never);

    if (!error) created += 1;
  }

  if (created === 0) {
    return {
      success: false,
      error:
        skipped.length > 0
          ? "All selected employees already have attendance for this date."
          : "Failed to create attendance sessions.",
    };
  }

  revalidatePath("/dashboard/attendance");
  revalidatePath("/dashboard/history");
  return { success: true };
});
