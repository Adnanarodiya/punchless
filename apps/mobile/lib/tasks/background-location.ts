import * as TaskManager from "expo-task-manager";
import { BACKGROUND_LOCATION_TASK } from "@/lib/services/location.service";
import { processLocation } from "@/lib/services/geofence.service";
import { supabase } from "@/lib/supabase";

/**
 * Background task definition — runs even when app is backgrounded.
 * Must be defined at the top level (outside any component).
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

    await processLocation(coords, user.id, profile.company_id);
  } catch (err) {
    console.error("Background geofence processing error:", err);
  }
});
