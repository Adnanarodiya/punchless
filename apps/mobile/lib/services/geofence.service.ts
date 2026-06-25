import {
  getActiveWorkshops,
  getDistanceMeters,
  type WorkshopLocation,
} from "@/lib/services/workshop.service";
import { updateJobStatus } from "@/lib/services/job.service";
import type { LocationCoords } from "@/lib/services/location.service";
import {
  closeAttendanceSession,
  getActiveSession,
  openAttendanceSession,
} from "@/lib/services/session.service";
import { useAttendanceStore } from "@/lib/stores/attendance.store";
import type { EngineState } from "@/lib/types/attendance-engine";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type { EngineState };

// Grace period: how many consecutive "outside" checks before we end a session
// At ~30s intervals, 10 checks = ~5 minutes grace
const EXIT_GRACE_COUNT = 10;

const WORKSHOPS_CACHE_KEY = "punchless_cached_workshops";

// Module-level state (persists across background task invocations)
let cachedWorkshops: WorkshopLocation[] = [];
let lastWorkshopFetch = 0;
const WORKSHOP_CACHE_TTL = 30 * 1000; // 30 seconds TTL (reduced per Task 15)

let exitGraceCounter = 0;

/**
 * Refresh cached workshops if stale.
 * Falls back to persistent AsyncStorage cache when offline.
 */
async function ensureWorkshops(): Promise<WorkshopLocation[]> {
  const now = Date.now();
  
  if (cachedWorkshops.length > 0 && now - lastWorkshopFetch <= WORKSHOP_CACHE_TTL) {
    return cachedWorkshops;
  }

  try {
    const networkWorkshops = await getActiveWorkshops();
    if (networkWorkshops && networkWorkshops.length > 0) {
      cachedWorkshops = networkWorkshops;
      lastWorkshopFetch = now;
      await AsyncStorage.setItem(WORKSHOPS_CACHE_KEY, JSON.stringify(networkWorkshops));
      return cachedWorkshops;
    }
  } catch (err) {
    console.warn("Failed to fetch workshops from network, falling back to persistent cache:", err);
  }

  try {
    const cachedStr = await AsyncStorage.getItem(WORKSHOPS_CACHE_KEY);
    if (cachedStr) {
      cachedWorkshops = JSON.parse(cachedStr);
      return cachedWorkshops;
    }
  } catch (err) {
    console.error("Failed to read workshops from AsyncStorage cache:", err);
  }

  return cachedWorkshops;
}

/**
 * Force refresh workshops cache — call when workshop location might have changed.
 */
export async function forceRefreshWorkshops(): Promise<WorkshopLocation[]> {
  try {
    cachedWorkshops = await getActiveWorkshops();
    lastWorkshopFetch = Date.now();
    await AsyncStorage.setItem(WORKSHOPS_CACHE_KEY, JSON.stringify(cachedWorkshops));
  } catch (err) {
    console.warn("Failed to force refresh workshops:", err);
  }
  return cachedWorkshops;
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
  companyId: string,
  options?: { bypassGrace?: boolean }
): Promise<{ newState: EngineState; transitioned: boolean }> {
  const workshops = await ensureWorkshops();
  
  // Calculate minimum distance to any active workshop
  let minDistance = Infinity;
  let nearestWorkshop = null;
  for (const w of workshops) {
    const dist = getDistanceMeters(coords.latitude, coords.longitude, w.lat, w.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestWorkshop = w;
    }
  }

  const nearWorkshop = nearestWorkshop && minDistance <= nearestWorkshop.radius ? nearestWorkshop : null;

  const currentState = useAttendanceStore.getState().currentState;

  // ─── OFF_DUTY ─────────────────────────────────
  if (currentState === "off_duty") {
    if (nearWorkshop) {
      // Entered workshop geofence → create workshop session
      exitGraceCounter = 0;
      const id = await openAttendanceSession({
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
    if (nearWorkshop) {
      // Still inside a workshop — reset grace counter and return immediately WITHOUT database calls
      exitGraceCounter = 0;
      return { newState: "workshop", transitioned: false };
    }

    // Outside all workshops
    if (options?.bypassGrace || minDistance > 500 || workshops.length === 0) {
      exitGraceCounter = 0;
      const openSess = await getActiveSession(employeeId);
      if (openSess) await closeAttendanceSession(openSess.id, openSess.start_time);
      return { newState: "off_duty", transitioned: true };
    }

    // Outside all workshops — increment grace counter
    exitGraceCounter++;
    if (exitGraceCounter >= EXIT_GRACE_COUNT) {
      // Grace expired → close workshop session → off_duty (requires database call to fetch the open session to close)
      exitGraceCounter = 0;
      const openSess = await getActiveSession(employeeId);
      if (openSess) await closeAttendanceSession(openSess.id, openSess.start_time);
      return { newState: "off_duty", transitioned: true };
    }

    // Still in grace period — keep workshop state without writing to DB
    return { newState: "workshop", transitioned: false };
  }

  // ─── TRAVEL ───────────────────────────────────
  if (currentState === "travel") {
    if (nearWorkshop) {
      // Returned to workshop → close travel session, open workshop session
      exitGraceCounter = 0;
      const openSess = await getActiveSession(employeeId);
      if (openSess) await closeAttendanceSession(openSess.id, openSess.start_time);
      await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);

  // Must be in workshop state
  if (!openSess || openSess.state !== "workshop") return false;

  // Close workshop session
  await closeAttendanceSession(openSess.id, openSess.start_time);

  // Mark job as in_progress
  await updateJobStatus(jobId, "in_progress");

  // Open travel session
  const id = await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);

  // Must be in travel state
  if (!openSess || openSess.state !== "travel") return false;

  // Close travel session
  await closeAttendanceSession(openSess.id, openSess.start_time);

  // Open on_site_job session
  const id = await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);

  // Must be in on_site_job state
  if (!openSess || openSess.state !== "on_site_job") return false;

  // Close on_site_job session
  await closeAttendanceSession(openSess.id, openSess.start_time);

  // Open return travel session
  const id = await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);

  // Must be in on_site_job state
  if (!openSess || openSess.state !== "on_site_job") return false;

  // Close on_site_job session
  await closeAttendanceSession(openSess.id, openSess.start_time);

  // Mark job as completed
  await updateJobStatus(jobId, "completed");

  // Open return travel session
  const id = await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);

  // Must be in workshop state to take a break
  if (!openSess || openSess.state !== "workshop") return false;

  // Close workshop session
  await closeAttendanceSession(openSess.id, openSess.start_time);

  // Open break session (keep same workshop_id for reference)
  const id = await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);

  // Must be in break state
  if (!openSess || openSess.state !== "break") return false;

  // Close break session
  await closeAttendanceSession(openSess.id, openSess.start_time);

  // Reopen workshop session (use same workshop_id)
  const id = await openAttendanceSession({
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
  const openSess = await getActiveSession(employeeId);
  if (!openSess) return false;

  await closeAttendanceSession(openSess.id, openSess.start_time);
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
