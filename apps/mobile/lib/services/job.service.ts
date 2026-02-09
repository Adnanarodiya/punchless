import { supabase } from "@/lib/supabase";

export type MyJob = {
  id: string;
  title: string;
  description: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  lat: number | null;
  lng: number | null;
  radius: number | null;
  status: string | null;
  created_at: string | null;
  workshop_name: string | null;
};

/** Time tracking info for a single job */
export type JobTimeSummary = {
  travelMinutes: number;
  onsiteMinutes: number;
  totalMinutes: number;
  /** If there's an open travel session, this is the start_time ISO string */
  activeTravelStart: string | null;
  /** If there's an open on_site session, this is the start_time ISO string */
  activeOnsiteStart: string | null;
  /** Current phase: idle (not started), traveling, on_site, return_travel, done */
  phase: "idle" | "traveling" | "on_site" | "return_travel" | "done";
};

// ─── Job Queries ────────────────────────────────

export async function getMyJobs(employeeId: string): Promise<MyJob[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, description, customer_name, customer_phone, lat, lng, radius, status, created_at, workshops(name)"
    )
    .eq("assigned_to", employeeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    customer_name: j.customer_name,
    customer_phone: j.customer_phone,
    lat: j.lat,
    lng: j.lng,
    radius: j.radius,
    status: j.status,
    created_at: j.created_at,
    workshop_name: j.workshops?.name ?? null,
  }));
}

export async function getActiveJobs(employeeId: string): Promise<MyJob[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      "id, title, description, customer_name, customer_phone, lat, lng, radius, status, created_at, workshops(name)"
    )
    .eq("assigned_to", employeeId)
    .in("status", ["assigned", "in_progress"])
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map((j) => ({
    id: j.id,
    title: j.title,
    description: j.description,
    customer_name: j.customer_name,
    customer_phone: j.customer_phone,
    lat: j.lat,
    lng: j.lng,
    radius: j.radius,
    status: j.status,
    created_at: j.created_at,
    workshop_name: j.workshops?.name ?? null,
  }));
}

// ─── Job Time Tracking ──────────────────────────

/**
 * Fetch all attendance sessions linked to a specific job
 * and compute travel / on-site time + detect active sessions.
 */
export async function getJobTimeSummary(
  employeeId: string,
  jobId: string
): Promise<JobTimeSummary> {
  // Get all sessions (closed + open) for this job
  const { data: sessions } = await supabase
    .from("attendance_sessions")
    .select("state, start_time, end_time, duration_minutes")
    .eq("employee_id", employeeId)
    .eq("job_id", jobId)
    .order("start_time", { ascending: true });

  let travelMinutes = 0;
  let onsiteMinutes = 0;
  let activeTravelStart: string | null = null;
  let activeOnsiteStart: string | null = null;
  let hasOnsite = false;
  let hasClosedReturn = false;

  for (const s of sessions ?? []) {
    const isClosed = s.end_time !== null;
    const mins = s.duration_minutes ?? 0;

    if (s.state === "travel") {
      if (isClosed) {
        travelMinutes += mins;
        // If we already had on-site, this closed travel is a return trip
        if (hasOnsite) hasClosedReturn = true;
      } else {
        activeTravelStart = s.start_time;
      }
    }

    if (s.state === "on_site_job") {
      hasOnsite = true;
      if (isClosed) {
        onsiteMinutes += mins;
      } else {
        activeOnsiteStart = s.start_time;
      }
    }
  }

  // Determine phase
  let phase: JobTimeSummary["phase"] = "idle";
  if (activeOnsiteStart) {
    phase = "on_site";
  } else if (activeTravelStart) {
    phase = hasOnsite ? "return_travel" : "traveling";
  } else if (hasOnsite) {
    // All sessions closed — if we have on-site work done
    phase = hasClosedReturn ? "done" : "done";
  }

  return {
    travelMinutes,
    onsiteMinutes,
    totalMinutes: travelMinutes + onsiteMinutes,
    activeTravelStart,
    activeOnsiteStart,
    phase,
  };
}

// ─── Job Status Updates ─────────────────────────

/** Mark job as in_progress when employee starts traveling */
export async function updateJobStatus(
  jobId: string,
  status: "in_progress" | "completed"
): Promise<boolean> {
  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  return !error;
}
