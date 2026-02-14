import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";

/**
 * Root index — redirects based on auth state.
 * This prevents the "Unmatched route" error on initial load.
 */
export default function Index() {
  const { user, initialized } = useAuthStore();

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
