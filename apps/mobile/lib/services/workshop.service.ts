import { supabase } from "../supabase";

export interface WorkshopLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

/**
 * Fetch all active workshops for the employee's company
 * Used for geofence detection on the mobile app
 */
export async function getActiveWorkshops(): Promise<WorkshopLocation[]> {
  const { data, error } = await supabase
    .from("workshops")
    .select("id, name, lat, lng, radius")
    .eq("is_active", true);

  if (error) {
    console.error("Failed to fetch workshops:", error.message);
    return [];
  }

  return (data ?? []) as WorkshopLocation[];
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in meters
 */
export function getDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if a GPS position is inside any workshop geofence
 * Returns the workshop if inside, null if outside all
 */
export function findNearestWorkshop(
  lat: number,
  lng: number,
  workshops: WorkshopLocation[]
): WorkshopLocation | null {
  for (const w of workshops) {
    const distance = getDistanceMeters(lat, lng, w.lat, w.lng);
    if (distance <= w.radius) {
      return w;
    }
  }
  return null;
}
