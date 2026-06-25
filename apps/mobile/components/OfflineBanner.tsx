import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";

import { useNetworkStore } from "@/lib/stores/network.store";
import { useOfflineStore } from "@/lib/stores/offline.store";

export function OfflineBanner() {
  const isOnline = useNetworkStore((s) => s.isOnline);
  const queueLength = useOfflineStore((s) => s.queue.length);
  const syncing = useOfflineStore((s) => s.syncing);
  const syncQueue = useOfflineStore((s) => s.syncQueue);

  if (isOnline && queueLength === 0) return null;

  const label = !isOnline
    ? queueLength > 0
      ? `Offline — ${queueLength} action${queueLength === 1 ? "" : "s"} queued`
      : "Offline — attendance will sync when back online"
    : `${queueLength} pending sync${queueLength === 1 ? "" : "s"}`;

  return (
    <TouchableOpacity
      style={[styles.banner, !isOnline ? styles.offline : styles.sync]}
      onPress={() => {
        if (isOnline && !syncing) void syncQueue();
      }}
      disabled={!isOnline || syncing}
      activeOpacity={isOnline ? 0.8 : 1}
    >
      {syncing ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <Text style={styles.text}>
          {!isOnline ? "📡 " : "🔄 "}
          {label}
          {isOnline && queueLength > 0 ? " — tap to sync" : ""}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  offline: {
    backgroundColor: "#b45309",
  },
  sync: {
    backgroundColor: "#2563eb",
  },
  text: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});