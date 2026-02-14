import { supabase } from "@/lib/supabase";
import {
  getActiveWorkshops,
  findNearestWorkshop,
  getDistanceMeters,
  type WorkshopLocation,
} from "@/lib/services/workshop.service";
import { updateJobStatus } from "@/lib/services/job.service";
import type { LocationCoords } from "@/lib/services/location.service";

export type EngineState = "off_duty" | "workshop" | "travel" | "on_site_job" | "break";

type ActiveSession = {
  id: string;
  state: EngineState;
  workshop_id: string | null;
  job_id: string | null;
};

// Grace period: how many consecutive "outside" checks before we end a session
// At ~30s intervals, 10 checks = ~5 minutes grace
const EXIT_GRACE_COUNT = 10;

// Module-level state (persists across background task invocations)
let cachedWorkshops: WorkshopLocation[] = [];
let lastWorkshopFetch = 0;
const WORKSHOP_CACHE_TTL = 2 * 60 * 1000; // 2 min — shorter to detect workshop location changes quickly

let exitGraceCounter = 0;

/**
 * Refresh cached workshops if stale.
 * Shorter TTL ensures workshop location changes are picked up quickly.
 */
async function ensureWorkshops(): Promise<WorkshopLocation[]> {
  const now = Date.now();
  if (cachedWorkshops.length === 0 || now - lastWorkshopFetch > WORKSHOP_CACHE_TTL) {
    cachedWorkshops = await getActiveWorkshops();
    lastWorkshopFetch = now;
  }
  return cachedWorkshops;
}

/**
 * Force refresh workshops cache — call when workshop location might have changed.
 */
export async function forceRefreshWorkshops(): Promise<WorkshopLocation[]> {
  cachedWorkshops = await getActiveWorkshops();
  lastWorkshopFetch = Date.now();
  return cachedWorkshops;
}

/**
 * Get the current open session for this employee (no end_time)
 */
async function getOpenSession(employeeId: string): Promise<ActiveSession | null> {
  const { data } = await supabase
    .from("attendance_sessions")
    .select("id, state, workshop_id, job_id")
    .eq("employee_id", employeeId)
    .is("end_time", null)
    .order("start_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return data as ActiveSession;
}

/**
 * Close an open session (set end_time + compute duration)
 */
async function closeSession(sessionId: string): Promise<void> {
  const now = new Date().toISOString();

  // First get start_time to compute duration
  const { data: session } = await supabase
    .from("attendance_sessions")
    .select("start_time")
    .eq("id", sessionId)
    .single();

  if (!session) return;

  const startMs = new Date(session.start_time).getTime();
  const endMs = new Date(now).getTime();
  const durationMinutes = Math.round((endMs - startMs) / 60000);

  await supabase
    .from("attendance_sessions")
    .update({
      end_time: now,
      duration_minutes: Math.max(durationMinutes, 0),
    })
    .eq("id", sessionId);
}

/**
 * Open a new session
 */
async function openSession(params: {
  employeeId: string;
  companyId: string;
  state: EngineState;
  workshopId?: string | null;
  jobId?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .insert({
      employee_id: params.employeeId,
      company_id: params.companyId,
      state: params.state,
      workshop_id: params.workshopId ?? null,
      job_id: params.jobId ?? null,
      start_time: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to open session:", error.message);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Main geofence processing — called every location update
 *
 * Handles only GPS-automatic transitions:
 *   - OFF_DUTY → WORKSHOP (enters geofence)
 *   - WORKSHOP → OFF_DUTY (exits geofence, with grace period)
 *   - TRAVEL → WORKSHOP (returns to workshop geofence)
 *
 * Manual transitions (handled by buttons on UI):
 *   - WORKSHOP → TRAVEL (start travel)
 *   - TRAVEL → ON_SITE_JOB (arrive at job)
 *   - ON_SITE_JOB → TRAVEL (job done)
 */
export async function processLocation(
  coords: LocationCoords,
  employeeId: string,
  companyId: string
): Promise<{ newState: EngineState; transitioned: boolean }> {
  const workshops = await ensureWorkshops();
  const nearWorkshop = findNearestWorkshop(
    coords.latitude,
    coords.longitude,
    workshops
  );

  const openSess = await getOpenSession(employeeId);
  const currentState: EngineState = (openSess?.state as EngineState) ?? "off_duty";

  // ─── OFF_DUTY ─────────────────────────────────
  if (currentState === "off_duty") {
    if (nearWorkshop) {
      // Entered workshop geofence → create workshop session
      exitGraceCounter = 0;
      const id = await openSession({
        employeeId,
        companyId,
        state: "workshop",
        workshopId: nearWorkshop.id,
      });
      if (id) {
        return { newState: "workshop", transitioned: true };
      }
    }
    return { newState: "off_duty", transitioned: false };
  }

  // ─── WORKSHOP ─────────────────────────────────
  if (currentState === "workshop") {
    // Check if the workshop we're assigned to still exists at same location
    // This handles the case where admin updates workshop location
    if (openSess?.workshop_id) {
      const assignedWorkshop = workshops.find((w) => w.id === openSess.workshop_id);
      if (!assignedWorkshop) {
        // Workshop was deleted or deactivated → force off_duty
        exitGraceCounter = 0;
        await closeSession(openSess.id);
        // Force re-fetch workshops to get latest data
        await forceRefreshWorkshops();
        return { newState: "off_duty", transitioned: true };
      }

      // Check if user is still within THIS workshop's geofence
      // (handles case where workshop location was changed)
      const distToAssigned = getDistanceMeters(
        coords.latitude,
        coords.longitude,
        assignedWorkshop.lat,
        assignedWorkshop.lng
      );
      if (distToAssigned > assignedWorkshop.radius) {
        // User is outside their assigned workshop — workshop may have moved
        exitGraceCounter++;
        if (exitGraceCounter >= EXIT_GRACE_COUNT) {
          // Grace expired → workshop location changed, user no longer there → off_duty
          exitGraceCounter = 0;
          await closeSession(openSess.id);
          return { newState: "off_duty", transitioned: true };
        }
        // Still in grace period
        return { newState: "workshop", transitioned: false };
      }
    }

    if (nearWorkshop) {
      // Still inside a workshop — reset grace counter
      exitGraceCounter = 0;
      return { newState: "workshop", transitioned: false };
    }

    // Outside all workshops — increment grace counter
    exitGraceCounter++;
    if (exitGraceCounter >= EXIT_GRACE_COUNT) {
      // Grace expired → close workshop session → off_duty
      exitGraceCounter = 0;
      if (openSess) await closeSession(openSess.id);
      return { newState: "off_duty", transitioned: true };
    }

    // Still in grace period — keep workshop state
    return { newState: "workshop", transitioned: false };
  }

  // ─── TRAVEL ───────────────────────────────────
  if (currentState === "travel") {
    if (nearWorkshop) {
      // Returned to workshop → close travel session, open workshop session
      exitGraceCounter = 0;
      if (openSess) await closeSession(openSess.id);
      await openSession({
        employeeId,
        companyId,
        state: "workshop",
        workshopId: nearWorkshop.id,
      });
      return { newState: "workshop", transitioned: true };
    }
    // Still traveling — no auto transition
    return { newState: "travel", transitioned: false };
  }

  // ─── BREAK ─────────────────────────────────────
  if (currentState === "break") {
    // No automatic GPS transitions from break
    // Employee must manually tap "Break Out" button
    return { newState: "break", transitioned: false };
  }

  // ─── ON_SITE_JOB ─────────────────────────────
  // No automatic GPS transitions from on_site_job
  // Employee must manually tap "Job Done" button
  return { newState: currentState, transitioned: false };
}

/**
 * Manual transition: WORKSHOP → TRAVEL
 * Called when employee taps "Start" button on a job
 */
export async function startTravel(
  employeeId: string,
  companyId: string,
  jobId: string
): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);

  // Must be in workshop state
  if (!openSess || openSess.state !== "workshop") return false;

  // Close workshop session
  await closeSession(openSess.id);

  // Mark job as in_progress
  await updateJobStatus(jobId, "in_progress");

  // Open travel session
  const id = await openSession({
    employeeId,
    companyId,
    state: "travel",
    jobId,
  });
  return !!id;
}

/**
 * Manual transition: TRAVEL → ON_SITE_JOB
 * Called when employee taps "Arrive at Job" button
 */
export async function arriveAtJob(
  employeeId: string,
  companyId: string,
  jobId: string
): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);

  // Must be in travel state
  if (!openSess || openSess.state !== "travel") return false;

  // Close travel session
  await closeSession(openSess.id);

  // Open on_site_job session
  const id = await openSession({
    employeeId,
    companyId,
    state: "on_site_job",
    jobId,
  });
  return !!id;
}

/**
 * Manual transition: ON_SITE_JOB → TRAVEL (return)
 * Called when employee taps "Job Done" button
 */
export async function finishJob(
  employeeId: string,
  companyId: string,
  jobId: string
): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);

  // Must be in on_site_job state
  if (!openSess || openSess.state !== "on_site_job") return false;

  // Close on_site_job session
  await closeSession(openSess.id);

  // Open return travel session
  const id = await openSession({
    employeeId,
    companyId,
    state: "travel",
    jobId,
  });
  return !!id;
}

/**
 * Manual: Complete job — ON_SITE_JOB → TRAVEL (return) + mark job completed
 * Called when employee taps "Finish Job" button
 */
export async function completeJob(
  employeeId: string,
  companyId: string,
  jobId: string
): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);

  // Must be in on_site_job state
  if (!openSess || openSess.state !== "on_site_job") return false;

  // Close on_site_job session
  await closeSession(openSess.id);

  // Mark job as completed
  await updateJobStatus(jobId, "completed");

  // Open return travel session
  const id = await openSession({
    employeeId,
    companyId,
    state: "travel",
    jobId,
  });
  return !!id;
}

/**
 * Manual transition: WORKSHOP → BREAK
 * Called when employee taps "Break In" button
 */
export async function startBreak(
  employeeId: string,
  companyId: string
): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);

  // Must be in workshop state to take a break
  if (!openSess || openSess.state !== "workshop") return false;

  // Close workshop session
  await closeSession(openSess.id);

  // Open break session (keep same workshop_id for reference)
  const id = await openSession({
    employeeId,
    companyId,
    state: "break",
    workshopId: openSess.workshop_id,
  });
  return !!id;
}

/**
 * Manual transition: BREAK → WORKSHOP
 * Called when employee taps "Break Out" button
 */
export async function endBreak(
  employeeId: string,
  companyId: string
): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);

  // Must be in break state
  if (!openSess || openSess.state !== "break") return false;

  // Close break session
  await closeSession(openSess.id);

  // Reopen workshop session (use same workshop_id)
  const id = await openSession({
    employeeId,
    companyId,
    state: "workshop",
    workshopId: openSess.workshop_id,
  });
  return !!id;
}

/**
 * Manual: End shift completely (close any open session)
 */
export async function endShift(employeeId: string): Promise<boolean> {
  const openSess = await getOpenSession(employeeId);
  if (!openSess) return false;

  await closeSession(openSess.id);
  exitGraceCounter = 0;
  return true;
}

/**
 * Force-clear cached workshops (call when user logs out)
 */
export function clearEngineCache(): void {
  cachedWorkshops = [];
  lastWorkshopFetch = 0;
  exitGraceCounter = 0;
}
