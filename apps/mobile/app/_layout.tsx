import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "@/lib/stores/auth.store";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initialized, initialize } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

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
