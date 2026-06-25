import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type PushMessage = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * Send Expo push notification to all registered devices for a user.
 * Fails silently — never blocks the calling server action.
 */
export async function sendPushToUser(
  userId: string,
  message: PushMessage
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: tokens, error } = await admin
      .from("push_tokens")
      .select("expo_push_token")
      .eq("user_id", userId);

    if (error || !tokens?.length) return;

    const payload = tokens.map((row) => ({
      to: row.expo_push_token,
      sound: "default" as const,
      title: message.title,
      body: message.body,
      data: message.data ?? {},
    }));

    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Expo push API error:", response.status, text);
    }
  } catch (err) {
    console.error("sendPushToUser failed:", err);
  }
}