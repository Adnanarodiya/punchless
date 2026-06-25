import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

export function isBackgroundLocationSupported(): boolean {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  return !(Platform.OS === "ios" && isExpoGo);
}

export const BACKGROUND_LOCATION_TASK = "punchless-background-location";

export type TrackingProfile = "idle" | "active";

const TRACKING_PROFILES: Record<
  TrackingProfile,
  { timeInterval: number; distanceInterval: number }
> = {
  idle: { timeInterval: 60_000, distanceInterval: 50 },
  active: { timeInterval: 30_000, distanceInterval: 20 },
};

let currentProfile: TrackingProfile = "active";

export type LocationCoords = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

/**
 * Check if location APIs are available in this environment.
 * Returns false in Expo Go (which lacks native location config).
 */
async function isLocationAvailable(): Promise<boolean> {
  try {
    await Location.getForegroundPermissionsAsync();
    return true;
  } catch {
    return false;
  }
}

/**
 * Request foreground + background location permissions
 * Returns true if both granted, false if unavailable or denied
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    if (!isBackgroundLocationSupported()) {
      return true; // Fallback to foreground only on iOS Expo Go
    }

    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === "granted";
  } catch (err) {
    console.warn("Location permissions unavailable (Expo Go?):", err);
    return false;
  }
}

/**
 * Check if permissions are already granted
 */
export async function hasLocationPermissions(): Promise<boolean> {
  try {
    const fg = await Location.getForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    if (!isBackgroundLocationSupported()) {
      return true; // Fallback to foreground only on iOS Expo Go
    }

    const bg = await Location.getBackgroundPermissionsAsync();
    return bg.status === "granted";
  } catch {
    return false;
  }
}

/**
 * Get current location once
 */
export async function getCurrentLocation(): Promise<LocationCoords | null> {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    };
  } catch {
    return null;
  }
}

/**
 * Start background location tracking.
 * Silently returns false if location APIs are unavailable (Expo Go).
 */
export async function startBackgroundTracking(): Promise<boolean> {
  const available = await isLocationAvailable();
  if (!available || !isBackgroundLocationSupported()) {
    console.warn("Background location not available in this environment (iOS Expo Go). Use a development build for GPS features.");
    return false;
  }

  const hasPerms = await hasLocationPermissions();
  if (!hasPerms) {
    // Try requesting
    const granted = await requestLocationPermissions();
    if (!granted) return false;
  }

  const isTracking = await Location.hasStartedLocationUpdatesAsync(
    BACKGROUND_LOCATION_TASK
  ).catch(() => false);

  if (isTracking) return true;

  try {
    const profile = TRACKING_PROFILES[currentProfile];
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: profile.timeInterval,
      distanceInterval: profile.distanceInterval,
      deferredUpdatesInterval: profile.timeInterval,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Punchless",
        notificationBody: "Tracking your attendance",
        notificationColor: "#2563eb",
      },
    });
    return true;
  } catch (err) {
    console.warn("Failed to start background tracking:", err);
    return false;
  }
}

/**
 * Stop background location tracking
 */
export async function stopBackgroundTracking(): Promise<void> {
  try {
    const isTracking = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    ).catch(() => false);

    if (isTracking) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch {
    // Silently ignore — not available in Expo Go
  }
}

/**
 * Check if background tracking is running
 */
export async function isBackgroundTrackingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    return false;
  }
}

/**
 * Use slower GPS polling when off duty to save battery.
 */
export async function applyTrackingProfile(
  profile: TrackingProfile
): Promise<void> {
  if (profile === currentProfile) return;
  currentProfile = profile;

  const isTracking = await isBackgroundTrackingActive();
  if (!isTracking) return;

  await stopBackgroundTracking();
  await startBackgroundTracking();
}
