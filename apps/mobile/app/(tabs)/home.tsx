import { useEffect, useState } from "react";
import { View, Text, StyleSheet, RefreshControl, ScrollView } from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useAttendanceStore } from "@/lib/stores/attendance.store";
import { getTodayAttendanceSummary } from "@/lib/services/attendance.service";
import { formatMinutes } from "@/lib/utils/formatting";

const STATE_LABEL: Record<string, string> = {
  off_duty: "OFF DUTY",
  workshop: "AT WORKSHOP",
  travel: "TRAVELING",
  on_site_job: "ON SITE",
};

const STATE_COLOR: Record<string, string> = {
  off_duty: "#64748b",
  workshop: "#16a34a",
  travel: "#2563eb",
  on_site_job: "#ea580c",
};

export default function HomeScreen() {
  const { user } = useAuthStore();
  const attendance = useAttendanceStore();
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    const summary = await getTodayAttendanceSummary(user.id);
    attendance.setSummary(summary);
  }

  useEffect(() => {
    void load();
  }, [user?.id]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={[styles.statusValue, { color: STATE_COLOR[attendance.currentState] }]}> 
          {STATE_LABEL[attendance.currentState]}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Today&apos;s Summary</Text>
        <Row label="Workshop" value={formatMinutes(attendance.workshopMinutes)} />
        <Row label="Travel" value={formatMinutes(attendance.travelMinutes)} />
        <Row label="On-Site" value={formatMinutes(attendance.onsiteMinutes)} />
        <Row label="Total" value={formatMinutes(attendance.totalMinutes)} isLast />
      </View>
    </ScrollView>
  );
}

function Row({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.summaryRow, isLast && { borderBottomWidth: 0 }]}> 
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  statusCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusLabel: {
    color: "#64748b",
    fontSize: 14,
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  summaryLabel: {
    color: "#64748b",
    fontSize: 15,
  },
  summaryValue: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "600",
  },
});
