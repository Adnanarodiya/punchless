import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useAttendanceStore } from "@/lib/stores/attendance.store";
import { useLocationStore } from "@/lib/stores/location.store";
import { getTodayAttendanceSummary } from "@/lib/services/attendance.service";
import {
  processLocation,
  startTravel,
  arriveAtJob,
  completeJob,
  endShift,
} from "@/lib/services/geofence.service";
import { getActiveJobs, type MyJob } from "@/lib/services/job.service";
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
  const { tracking, permissionGranted, available, refreshLocation, requestPermissions } =
    useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeJobs, setActiveJobs] = useState<MyJob[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [summary, jobs] = await Promise.all([
      getTodayAttendanceSummary(user.id),
      getActiveJobs(user.id),
    ]);
    attendance.setSummary(summary);
    setActiveJobs(jobs);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll for fresh data every 30s
  useEffect(() => {
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    // Also trigger a manual GPS check
    if (user && tracking) {
      const loc = await refreshLocation();
      if (loc) {
        await processLocation(loc, user.id, user.company_id);
      }
    }
    await load();
    setRefreshing(false);
  }

  async function handleStartTravel(job: MyJob) {
    if (!user) return;
    setActionLoading(true);
    const ok = await startTravel(user.id, user.company_id, job.id);
    if (ok) await load();
    else Alert.alert("Error", "Cannot start travel from current state");
    setActionLoading(false);
  }

  async function handleArriveAtJob(job: MyJob) {
    if (!user) return;
    setActionLoading(true);
    const ok = await arriveAtJob(user.id, user.company_id, job.id);
    if (ok) await load();
    else Alert.alert("Error", "Cannot mark arrival from current state");
    setActionLoading(false);
  }

  async function handleFinishJob(job: MyJob) {
    if (!user) return;
    setActionLoading(true);
    const ok = await completeJob(user.id, user.company_id, job.id);
    if (ok) await load();
    else Alert.alert("Error", "Cannot finish job from current state");
    setActionLoading(false);
  }

  async function handleEndShift() {
    if (!user) return;
    Alert.alert("End Shift", "Are you sure you want to end your shift?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Shift",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          await endShift(user.id);
          await load();
          setActionLoading(false);
        },
      },
    ]);
  }

  async function handleRequestPermission() {
    await requestPermissions();
  }

  const state = attendance.currentState;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      {/* GPS Status Banner */}
      {!available ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoText}>
            ℹ️ GPS tracking requires a development build. Not available in Expo Go.
          </Text>
        </View>
      ) : !permissionGranted ? (
        <TouchableOpacity
          style={styles.warningBanner}
          onPress={handleRequestPermission}
        >
          <Text style={styles.warningText}>
            📍 Location permission needed — tap to enable
          </Text>
        </TouchableOpacity>
      ) : !tracking ? (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⏳ Starting GPS tracking...
          </Text>
        </View>
      ) : null}

      {/* Status Card */}
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={[styles.statusValue, { color: STATE_COLOR[state] }]}>
          {STATE_LABEL[state]}
        </Text>
        {tracking && (
          <Text style={styles.gpsIndicator}>📍 GPS Active</Text>
        )}
      </View>

      {/* Today's Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Today&apos;s Summary</Text>
        <Row label="Workshop" value={formatMinutes(attendance.workshopMinutes)} />
        <Row label="Travel" value={formatMinutes(attendance.travelMinutes)} />
        <Row label="On-Site" value={formatMinutes(attendance.onsiteMinutes)} />
        <Row
          label="Total"
          value={formatMinutes(attendance.totalMinutes)}
          isLast
        />
      </View>

      {/* Quick Actions based on current state */}
      {state === "workshop" && activeJobs.length > 0 && (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Start Travel To</Text>
          {activeJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobAction}
              onPress={() => handleStartTravel(job)}
              disabled={actionLoading}
            >
              <Text style={styles.jobTitle} numberOfLines={1}>
                {job.title}
              </Text>
              <View style={styles.goBtn}>
                <Text style={styles.goBtnText}>GO →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {state === "travel" && (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>Travel Actions</Text>
          {activeJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.actionBtn, { backgroundColor: "#ea580c" }]}
              onPress={() => handleArriveAtJob(job)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>
                Arrived at: {job.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {state === "on_site_job" && (
        <View style={styles.actionCard}>
          <Text style={styles.cardTitle}>On-Site Actions</Text>
          {activeJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.actionBtn, { backgroundColor: "#16a34a" }]}
              onPress={() => handleFinishJob(job)}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>
                ✓ Finish: {job.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* End Shift (visible when not off_duty) */}
      {state !== "off_duty" && (
        <TouchableOpacity
          style={styles.endShiftBtn}
          onPress={handleEndShift}
          disabled={actionLoading}
        >
          <Text style={styles.endShiftText}>End Shift</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Row({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
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

  // Info banner (Expo Go)
  infoBanner: {
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  infoText: {
    color: "#1e40af",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },

  // Warning banner
  warningBanner: {
    backgroundColor: "#fef3c7",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  warningText: {
    color: "#92400e",
    fontWeight: "600",
    fontSize: 13,
  },

  // Status card
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
  gpsIndicator: {
    marginTop: 8,
    fontSize: 12,
    color: "#16a34a",
  },

  // Summary card
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

  // Action card
  actionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  jobAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 14,
  },
  jobTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  goBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },

  // Action button
  actionBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // End shift
  endShiftBtn: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#dc2626",
  },
  endShiftText: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: 15,
  },
});
