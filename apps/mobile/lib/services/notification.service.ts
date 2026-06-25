import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
}

export async function registerForPushNotifications(
  userId: string,
  companyId: string
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications require a physical device");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Punchless",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    console.warn("Missing EAS projectId — cannot register Expo push token");
    return null;
  }

  const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken = tokenResult.data;

  const platform =
    Platform.OS === "ios"
      ? "ios"
      : Platform.OS === "android"
        ? "android"
        : "unknown";

  const { error } = await supabase.from("push_tokens").upsert(
    {
      user_id: userId,
      company_id: companyId,
      expo_push_token: expoPushToken,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,expo_push_token" }
  );

  if (error) {
    console.error("Failed to save push token:", error.message);
    return null;
  }

  return expoPushToken;
}

const NOTIFICATION_SCREEN_ROUTES: Record<string, string> = {
  jobs: "/(tabs)/jobs",
  salary: "/(tabs)/salary",
  requests: "/(tabs)/requests",
  home: "/(tabs)/home",
};

export function getRouteForNotificationScreen(screen?: string): string | null {
  if (!screen) return null;
  return NOTIFICATION_SCREEN_ROUTES[screen] ?? null;
}

export async function unregisterPushNotifications(userId: string): Promise<void> {
  const projectId = getExpoProjectId();
  if (!projectId || !Device.isDevice) return;

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("expo_push_token", tokenResult.data);
  } catch {
    // Token may not exist if permissions were never granted
  }
}