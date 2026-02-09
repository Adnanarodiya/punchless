import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useLocationStore, syncTrackingState } from "@/lib/stores/location.store";
import { clearEngineCache } from "@/lib/services/geofence.service";

// Register background task (must be at top level, outside component)
// Safe to import — task only runs in dev builds with native location support
try {
  require("@/lib/tasks/background-location");
} catch (e) {
  console.warn("Background location task registration skipped:", e);
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize } = useAuthStore();
  const { startTracking, stopTracking } = useLocationStore();

  useEffect(() => {
    void initialize();
    syncTrackingState().catch(() => {});
  }, [initialize]);

  // Start/stop GPS tracking based on auth state
  useEffect(() => {
    if (!initialized) return;

    if (user) {
      // User logged in → start background GPS tracking
      void startTracking();
    } else {
      // User logged out → stop tracking, clear caches
      void stopTracking();
      clearEngineCache();
    }
  }, [initialized, user?.id]);

  useEffect(() => {
    if (!initialized) return;

    const inAuth = pathname.startsWith("/(auth)");
    if (!user && !inAuth) router.replace("/(auth)/login");
    if (user && inAuth) router.replace("/(tabs)/home");
  }, [initialized, pathname, router, user]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#ffffff" },
          headerTintColor: "#0f172a",
          contentStyle: { backgroundColor: "#f8fafc" },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
