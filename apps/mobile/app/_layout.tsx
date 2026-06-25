import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLocationStore, syncTrackingState } from "@/lib/stores/location.store";
import { useNetworkStore } from "@/lib/stores/network.store";
import { useOfflineStore } from "@/lib/stores/offline.store";
import { clearEngineCache } from "@/lib/services/geofence.service";
import { syncOfflineQueueAndRefresh } from "@/lib/services/sync.service";
import * as Notifications from "expo-notifications";
import {
  getRouteForNotificationScreen,
  registerForPushNotifications,
} from "@/lib/services/notification.service";

// Register background task (must be at top level, outside component)
try {
  require("@/lib/tasks/background-location");
} catch (e) {
  console.warn("Background location task registration skipped:", e);
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize } = useAuthStore();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const {
    startTracking,
    stopTracking,
    available,
    permissionGranted,
    requestPermissions,
    checkPermissions,
  } = useLocationStore();

  const [showSplash, setShowSplash] = useState(true);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationAsked, setLocationAsked] = useState(false);

  // Initialize auth, network, and offline queue
  useEffect(() => {
    void initialize();
    void useOfflineStore.getState().loadQueue();
    syncTrackingState().catch(() => {});
    const unsubscribeNetwork = useNetworkStore.getState().initialize();
    return unsubscribeNetwork;
  }, [initialize]);

  // Sync queued attendance actions when back online
  useEffect(() => {
    if (!user || !isOnline) return;
    void syncOfflineQueueAndRefresh(user.id);
  }, [user?.id, isOnline]);

  // Splash screen timer — show for at least 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // After auth is initialized and splash is done, check location permissions
  useEffect(() => {
    if (!initialized || showSplash || locationAsked) return;
    if (!user) return; // Only ask logged-in users

    // Check if permission already granted
    checkPermissions().then((granted) => {
      if (!granted && available) {
        // Show location permission modal
        setShowLocationModal(true);
      }
      setLocationAsked(true);
    });
  }, [initialized, showSplash, user?.id]);

  // Start/stop GPS tracking based on auth state
  useEffect(() => {
    if (!initialized) return;

    if (user) {
      void startTracking();
      void registerForPushNotifications(user.id, user.company_id);
    } else {
      void stopTracking();
      clearEngineCache();
    }
  }, [initialized, user?.id, user?.company_id]);

  // Navigate when user taps a push notification
  useEffect(() => {
    if (!user) return;

    function handleNotificationResponse(
      response: Notifications.NotificationResponse | null
    ) {
      if (!response) return;
      const screen = response.notification.request.content.data?.screen;
      const route = getRouteForNotificationScreen(
        typeof screen === "string" ? screen : undefined
      );
      if (route) router.push(route);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    void Notifications.getLastNotificationResponseAsync().then(
      handleNotificationResponse
    );

    return () => subscription.remove();
  }, [user?.id, router]);

  // Navigation guard — redirect based on auth
  useEffect(() => {
    if (!initialized || showSplash) return;

    const inAuth = pathname.startsWith("/(auth)");
    const isRoot = pathname === "/";

    if (!user && !inAuth) router.replace("/(auth)/login");
    if (user && (inAuth || isRoot)) router.replace("/(tabs)/home");
  }, [initialized, showSplash, pathname, router, user]);

  // Handle location permission request from modal
  async function handleAllowLocation() {
    setShowLocationModal(false);
    const granted = await requestPermissions();
    if (granted) {
      // Permission granted, start tracking
      void startTracking();
    }
  }

  function handleDenyLocation() {
    setShowLocationModal(false);
  }

  // Show splash screen
  if (showSplash || !initialized) {
    return (
      <View style={splashStyles.container}>
        <StatusBar style="dark" />
        <Text style={splashStyles.logo}>⚡</Text>
        <Text style={splashStyles.title}>Punchless</Text>
        <Text style={splashStyles.subtitle}>Automatic Attendance Tracking</Text>
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />

      {/* Location Permission Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="fade"
        onRequestClose={handleDenyLocation}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.icon}>📍</Text>
            <Text style={modalStyles.title}>Location Access Required</Text>
            <Text style={modalStyles.description}>
              Punchless needs your location to automatically track your attendance when you arrive at the workshop.
            </Text>
            <Text style={modalStyles.hint}>
              Please select "Allow all the time" when prompted for the best experience.
            </Text>
            <TouchableOpacity style={modalStyles.allowBtn} onPress={handleAllowLocation}>
              <Text style={modalStyles.allowBtnText}>Allow Location Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.denyBtn} onPress={handleDenyLocation}>
              <Text style={modalStyles.denyBtnText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#0f172a",
          contentStyle: { backgroundColor: "#f8fafc" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    color: "#2563eb",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 24,
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  allowBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  allowBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  denyBtn: {
    paddingVertical: 10,
  },
  denyBtnText: {
    color: "#64748b",
    fontSize: 14,
  },
});
