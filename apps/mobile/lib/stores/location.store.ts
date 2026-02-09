import { create } from "zustand";
import {
  requestLocationPermissions,
  hasLocationPermissions,
  startBackgroundTracking,
  stopBackgroundTracking,
  isBackgroundTrackingActive,
  getCurrentLocation,
  type LocationCoords,
} from "@/lib/services/location.service";

type LocationState = {
  /** Whether location is available in this environment (false in Expo Go) */
  available: boolean;
  permissionGranted: boolean;
  tracking: boolean;
  lastLocation: LocationCoords | null;
  error: string | null;

  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  startTracking: () => Promise<boolean>;
  stopTracking: () => Promise<void>;
  refreshLocation: () => Promise<LocationCoords | null>;
  reset: () => void;
};

export const useLocationStore = create<LocationState>((set, get) => ({
  available: true, // assume available until proven otherwise
  permissionGranted: false,
  tracking: false,
  lastLocation: null,
  error: null,

  checkPermissions: async () => {
    try {
      const granted = await hasLocationPermissions();
      set({ permissionGranted: granted, available: true });
      return granted;
    } catch {
      set({ available: false, permissionGranted: false });
      return false;
    }
  },

  requestPermissions: async () => {
    try {
      const granted = await requestLocationPermissions();
      set({
        permissionGranted: granted,
        available: true,
        error: granted ? null : "Location permission denied",
      });
      return granted;
    } catch {
      set({ available: false, error: "Location not available in Expo Go" });
      return false;
    }
  },

  startTracking: async () => {
    try {
      const started = await startBackgroundTracking();
      if (started) {
        set({ tracking: true, available: true, error: null });
      } else {
        // Could be permissions denied OR Expo Go — don't crash
        set({ tracking: false });
      }
      return started;
    } catch {
      set({ tracking: false, available: false, error: "GPS not available in Expo Go" });
      return false;
    }
  },

  stopTracking: async () => {
    try {
      await stopBackgroundTracking();
    } catch {
      // ignore
    }
    set({ tracking: false });
  },

  refreshLocation: async () => {
    try {
      const loc = await getCurrentLocation();
      if (loc) set({ lastLocation: loc });
      return loc;
    } catch {
      return null;
    }
  },

  reset: () => {
    set({
      permissionGranted: false,
      tracking: false,
      lastLocation: null,
      error: null,
    });
  },
}));

/**
 * Initialize: check if tracking was already running.
 * Safe to call in any environment — silently handles Expo Go.
 */
export async function syncTrackingState(): Promise<void> {
  try {
    const active = await isBackgroundTrackingActive();
    const perms = await hasLocationPermissions();
    useLocationStore.setState({ tracking: active, permissionGranted: perms, available: true });
  } catch {
    useLocationStore.setState({ available: false, tracking: false, permissionGranted: false });
  }
}
