import { useEffect, useState, useCallback, useRef } from "react";
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
  startBreak,
  endBreak,
  forceRefreshWorkshops,
} from "@/lib/services/geofence.service";
import { getActiveJobs, type MyJob } from "@/lib/services/job.service";
import { formatMinutes } from "@/lib/utils/formatting";

const STATE_LABEL: Record<string, string> = {
  off_duty: "OFF DUTY",
  workshop: "AT WORKSHOP",
  travel: "TRAVELING",
  on_site_job: "ON SITE",
  break: "ON BREAK",
};

const STATE_COLOR: Record<string, string> = {
  off_duty: "#64748b",
  workshop: "#16a34a",
  travel: "#2563eb",
  on_site_job: "#ea580c",
  break: "#f59e0b",
};

const STATE_BG: Record<string, string> = {
  off_duty: "#f1f5f9",
  workshop: "#f0fdf4",
  travel: "#eff6ff",
  on_site_job: "#fff7ed",
  break: "#fffbeb",
};

function formatLiveTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const attendance = useAttendanceStore();
  const {
    tracking,
    permissionGranted,
    available,
    refreshLocation,
    requestPermissions,
    lastBackgroundError,
    startTracking,
  } = useLocationStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeJobs, setActiveJobs] = useState<MyJob[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Live counter state
  const [workSeconds, setWorkSeconds] = useState(0);
  const [breakSeconds, setBreakSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Live counter — ticks every second
  useEffect(() => {
    // Calculate base seconds from completed sessions
    const baseWorkSecs =
      (attendance.workshopMinutes + attendance.travelMinutes + attendance.onsiteMinutes) * 60;
    const baseBreakSecs = attendance.breakMinutes * 60;

    // Calculate live seconds from current open session
    const sessionStart = attendance.currentSessionStart;
    const state = attendance.currentState;

    function tick() {
      const now = Date.now();
      const liveSecs = sessionStart
        ? Math.max(0, Math.round((now - new Date(sessionStart).getTime()) / 1000))
        : 0;

      if (state === "break") {
        setWorkSeconds(baseWorkSecs);
        setBreakSeconds(baseBreakSecs + liveSecs);
      } else if (state === "workshop" || state === "travel" || state === "on_site_job") {
        setWorkSeconds(baseWorkSecs + liveSecs);
        setBreakSeconds(baseBreakSecs);
      } else {
        setWorkSeconds(baseWorkSecs);
        setBreakSeconds(baseBreakSecs);
      }
    }

    tick(); // immediate
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    attendance.workshopMinutes,
    attendance.travelMinutes,
    attendance.onsiteMinutes,
    attendance.breakMinutes,
    attendance.currentState,
    attendance.currentSessionStart,
  ]);

  async function onRefresh() {
    setRefreshing(true);
    // Explicitly force refresh the workshops cache first so we get the newest coordinates
    await forceRefreshWorkshops();
    
    if (user && permissionGranted) {
      const loc = await refreshLocation();
      if (loc) {
        await processLocation(loc, user.id, user.company_id, { bypassGrace: true });
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

  async function handleBreakIn() {
    if (!user) return;
    setActionLoading(true);
    const ok = await startBreak(user.id, user.company_id);
    if (ok) await load();
    else Alert.alert("Error", "You can only take a break while at workshop");
    setActionLoading(false);
  }

  async function handleBreakOut() {
    if (!user) return;
    setActionLoading(true);
    const ok = await endBreak(user.id, user.company_id);
    if (ok) await load();
    else Alert.alert("Error", "You are not on a break");
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
  const stateColor = STATE_COLOR[state];
  const stateBg = STATE_BG[state];
  const isWorking = state === "workshop" || state === "travel" || state === "on_site_job";
  const isOnBreak = state === "break";
  const isActive = isWorking || isOnBreak;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
    >
      {/* GPS Status Banner */}
      {lastBackgroundError ? (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={async () => {
            // Clear error and attempt restart
            useLocationStore.getState().setLastBackgroundError(null);
            await startTracking();
          }}
        >
          <Text style={styles.errorBannerText}>
            ⚠️ Background tracking error: {lastBackgroundError}. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : !available ? (
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

      {/* ═══ LIVE COUNTER CARD ═══ */}
      <View style={[styles.counterCard, { backgroundColor: stateBg }]}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: stateColor }]}>
          <Text style={styles.statusBadgeText}>{STATE_LABEL[state]}</Text>
        </View>

        {/* Work Counter */}
        <Text style={styles.counterLabel}>Working Hours</Text>
        <Text style={[styles.counterTime, { color: isWorking ? stateColor : "#0f172a" }]}>
          {formatLiveTime(workSeconds)}
        </Text>

        {/* Break Counter (show if any break taken today or currently on break) */}
        {(breakSeconds > 0 || isOnBreak) && (
          <View style={styles.breakCounterRow}>
            <Text style={styles.breakLabel}>Break</Text>
            <Text style={[styles.breakTime, isOnBreak && { color: "#f59e0b" }]}>
              {formatLiveTime(breakSeconds)}
            </Text>
          </View>
        )}

        {tracking && (
          <Text style={styles.gpsIndicator}>📍 GPS Active</Text>
        )}
      </View>

      {/* ═══ BREAK BUTTON ═══ */}
      {state === "workshop" && (
        <TouchableOpacity
          style={styles.breakInBtn}
          onPress={handleBreakIn}
          disabled={actionLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.breakInIcon}>☕</Text>
          <Text style={styles.breakInText}>Take Break</Text>
          <Text style={styles.breakInHint}>Working hours will pause</Text>
        </TouchableOpacity>
      )}

      {state === "break" && (
        <TouchableOpacity
          style={styles.breakOutBtn}
          onPress={handleBreakOut}
          disabled={actionLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.breakOutIcon}>🔔</Text>
          <Text style={styles.breakOutText}>End Break</Text>
          <Text style={styles.breakOutHint}>Resume working hours</Text>
        </TouchableOpacity>
      )}

      {/* ═══ TODAY'S SUMMARY ═══ */}
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Today&apos;s Summary</Text>
        <Row label="Workshop" value={formatMinutes(attendance.workshopMinutes)} color="#16a34a" />
        <Row label="Travel" value={formatMinutes(attendance.travelMinutes)} color="#2563eb" />
        <Row label="On-Site" value={formatMinutes(attendance.onsiteMinutes)} color="#ea580c" />
        <Row label="Break" value={formatMinutes(attendance.breakMinutes)} color="#f59e0b" />
        <Row
          label="Total Working"
          value={formatMinutes(attendance.totalMinutes)}
          isLast
          bold
        />
      </View>

      {/* ═══ JOB ACTIONS ═══ */}
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
      {isActive && (
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
  bold,
  color,
}: {
  label: string;
  value: string;
  isLast?: boolean;
  bold?: boolean;
  color?: string;
}) {
  return (
    <View style={[styles.summaryRow, isLast && { borderBottomWidth: 0 }]}>
      <Text style={[styles.summaryLabel, color ? { color } : null]}>{label}</Text>
      <Text style={[styles.summaryValue, bold && { fontWeight: "800", fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Info / Warning banners
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
  errorBanner: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  errorBannerText: {
    color: "#991b1b",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },

  // ═══ Live Counter Card ═══
  counterCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },
  counterLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  counterTime: {
    fontSize: 48,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  breakCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  breakLabel: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
  },
  breakTime: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748b",
    fontVariant: ["tabular-nums"],
  },
  gpsIndicator: {
    marginTop: 12,
    fontSize: 12,
    color: "#16a34a",
  },

  // ═══ Break Buttons ═══
  breakInBtn: {
    backgroundColor: "#fffbeb",
    borderWidth: 2,
    borderColor: "#f59e0b",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  breakInIcon: {
    fontSize: 32,
  },
  breakInText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#b45309",
  },
  breakInHint: {
    fontSize: 12,
    color: "#92400e",
  },
  breakOutBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  breakOutIcon: {
    fontSize: 32,
  },
  breakOutText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  breakOutHint: {
    fontSize: 12,
    color: "#dcfce7",
  },

  // ═══ Summary Card ═══
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

  // ═══ Action Cards ═══
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

  // ═══ End Shift ═══
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
