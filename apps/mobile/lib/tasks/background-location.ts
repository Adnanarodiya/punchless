import * as TaskManager from "expo-task-manager";
import { BACKGROUND_LOCATION_TASK } from "@/lib/services/location.service";
import { processLocation } from "@/lib/services/geofence.service";
import { supabase } from "@/lib/supabase";
import { useAttendanceStore } from "@/lib/stores/attendance.store";
import { getTodayAttendanceSummary } from "@/lib/services/attendance.service";

/**
 * Background task definition — runs even when app is backgrounded.
 * Must be defined at the top level (outside any component).
 *
 * This is lightweight — it only:
 * 1. Gets the latest GPS location
 * 2. Runs geofence processing (check workshop proximity)
 * 3. Refreshes attendance summary in background
 *
 * This does NOT run the full app — only location + attendance state.
 * Battery efficient: runs every ~30s with 20m distance filter.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location error:", error.message);
    return;
  }

  const locations = (data as any)?.locations;
  if (!locations || locations.length === 0) return;

  const loc = locations[locations.length - 1]; // latest
  const coords = {
    latitude: loc.coords.latitude as number,
    longitude: loc.coords.longitude as number,
    accuracy: loc.coords.accuracy as number | null,
  };

  // Get the current user from Supabase auth
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Get employee's company_id from profile
    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) return;

    // Process geofence (check workshop proximity, update state)
    await processLocation(coords, user.id, profile.company_id);

    // Background refresh: update attendance summary so UI is fresh when user opens app
    try {
      const summary = await getTodayAttendanceSummary(user.id);
      useAttendanceStore.getState().setSummary(summary);
    } catch {
      // Non-critical — silently ignore
    }
  } catch (err) {
    console.error("Background geofence processing error:", err);
  }
});
