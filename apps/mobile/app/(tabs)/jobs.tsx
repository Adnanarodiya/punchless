import { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useAttendanceStore } from "@/lib/stores/attendance.store";
import {
  getMyJobs,
  getJobTimeSummary,
  type MyJob,
  type JobTimeSummary,
} from "@/lib/services/job.service";
import {
  startTravel,
  arriveAtJob,
  completeJob,
} from "@/lib/services/geofence.service";
import {
  formatMinutes,
  formatLiveTimer,
  getElapsedMinutes,
} from "@/lib/utils/formatting";

const STATUS_LABEL: Record<string, string> = {
  pending: "PENDING",
  assigned: "ASSIGNED",
  in_progress: "IN PROGRESS",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#d97706",
  assigned: "#2563eb",
  in_progress: "#ea580c",
  completed: "#16a34a",
  cancelled: "#64748b",
};

type Tab = "active" | "all";

export default function JobsScreen() {
  const { user } = useAuthStore();
  const attendance = useAttendanceStore();
  const [jobs, setJobs] = useState<MyJob[]>([]);
  const [timeSummaries, setTimeSummaries] = useState<
    Record<string, JobTimeSummary>
  >({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("active");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getMyJobs(user.id);
    setJobs(data);

    // Fetch time summaries for in_progress + completed jobs
    const summaries: Record<string, JobTimeSummary> = {};
    const trackableJobs = data.filter(
      (j) => j.status === "in_progress" || j.status === "completed"
    );
    await Promise.all(
      trackableJobs.map(async (j) => {
        summaries[j.id] = await getJobTimeSummary(user.id, j.id);
      })
    );
    setTimeSummaries(summaries);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live timer tick — update every second when there's an active session
  useEffect(() => {
    const hasActive = Object.values(timeSummaries).some(
      (s) => s.activeTravelStart || s.activeOnsiteStart
    );

    if (hasActive) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeSummaries]);

  // Auto-refresh data every 15s to pick up geofence transitions
  useEffect(() => {
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  // ─── Actions ────────────────────────────────

  async function handleStart(job: MyJob) {
    if (!user) return;
    const state = attendance.currentState;
    if (state !== "workshop") {
      Alert.alert(
        "Not at Workshop",
        "You need to be at the workshop to start a job. Your current status: " +
          state.toUpperCase().replace("_", " ")
      );
      return;
    }
    setActionLoading(job.id);
    const ok = await startTravel(user.id, user.company_id, job.id);
    if (ok) await load();
    else Alert.alert("Error", "Failed to start travel. Please try again.");
    setActionLoading(null);
  }

  async function handleArrived(job: MyJob) {
    if (!user) return;
    setActionLoading(job.id);
    const ok = await arriveAtJob(user.id, user.company_id, job.id);
    if (ok) await load();
    else Alert.alert("Error", "Failed to mark arrival. Please try again.");
    setActionLoading(null);
  }

  async function handleFinish(job: MyJob) {
    if (!user) return;
    Alert.alert("Finish Job", `Mark "${job.title}" as completed?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: async () => {
          setActionLoading(job.id);
          const ok = await completeJob(user.id, user.company_id, job.id);
          if (ok) await load();
          else Alert.alert("Error", "Failed to complete job.");
          setActionLoading(null);
        },
      },
    ]);
  }

  function openMaps(lat: number, lng: number) {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    );
  }

  function callCustomer(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  // ─── Render helpers ─────────────────────────

  const activeStatuses = ["pending", "assigned", "in_progress"];
  const filtered =
    tab === "active"
      ? jobs.filter((j) => activeStatuses.includes(j.status ?? ""))
      : jobs;

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "active" && styles.tabActive]}
          onPress={() => setTab("active")}
        >
          <Text
            style={[styles.tabText, tab === "active" && styles.tabTextActive]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "all" && styles.tabActive]}
          onPress={() => setTab("all")}
        >
          <Text
            style={[styles.tabText, tab === "all" && styles.tabTextActive]}
          >
            All Jobs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>
            {jobs.filter((j) => activeStatuses.includes(j.status ?? "")).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: "#16a34a" }]}>
            {jobs.filter((j) => j.status === "completed").length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{jobs.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Job List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {tab === "active"
              ? "No active jobs right now."
              : "No jobs assigned yet."}
          </Text>
        </View>
      ) : (
        filtered.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            timeSummary={timeSummaries[job.id] ?? null}
            tick={tick}
            isLoading={actionLoading === job.id}
            onStart={() => handleStart(job)}
            onArrived={() => handleArrived(job)}
            onFinish={() => handleFinish(job)}
            onNavigate={() =>
              job.lat && job.lng ? openMaps(job.lat, job.lng) : undefined
            }
            onCall={() =>
              job.customer_phone ? callCustomer(job.customer_phone) : undefined
            }
          />
        ))
      )}
    </ScrollView>
  );
}

// ─── JobCard Component ──────────────────────────

function JobCard({
  job,
  timeSummary,
  tick,
  isLoading,
  onStart,
  onArrived,
  onFinish,
  onNavigate,
  onCall,
}: {
  job: MyJob;
  timeSummary: JobTimeSummary | null;
  tick: number;
  isLoading: boolean;
  onStart: () => void;
  onArrived: () => void;
  onFinish: () => void;
  onNavigate: () => void;
  onCall: () => void;
}) {
  const phase = timeSummary?.phase ?? "idle";
  const status = job.status ?? "";

  // Compute live travel time (closed + active)
  let travelDisplay = timeSummary?.travelMinutes ?? 0;
  let liveTravelStr: string | null = null;
  if (timeSummary?.activeTravelStart) {
    liveTravelStr = formatLiveTimer(timeSummary.activeTravelStart);
    travelDisplay += getElapsedMinutes(timeSummary.activeTravelStart);
  }

  // Compute live on-site time (closed + active)
  let onsiteDisplay = timeSummary?.onsiteMinutes ?? 0;
  let liveOnsiteStr: string | null = null;
  if (timeSummary?.activeOnsiteStart) {
    liveOnsiteStr = formatLiveTimer(timeSummary.activeOnsiteStart);
    onsiteDisplay += getElapsedMinutes(timeSummary.activeOnsiteStart);
  }

  const totalDisplay = travelDisplay + onsiteDisplay;

  // Force re-render on tick (for live timers)
  void tick;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {job.title}
        </Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                (STATUS_COLOR[status] ?? "#64748b") + "18",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: STATUS_COLOR[status] ?? "#64748b" },
            ]}
          >
            {STATUS_LABEL[status] ?? status}
          </Text>
        </View>
      </View>

      {/* Description */}
      {job.description ? (
        <Text style={styles.desc} numberOfLines={2}>
          {job.description}
        </Text>
      ) : null}

      {/* Customer / Workshop Info */}
      {job.customer_name ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Customer</Text>
          <Text style={styles.infoValue}>{job.customer_name}</Text>
        </View>
      ) : null}
      {job.workshop_name ? (
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Workshop</Text>
          <Text style={styles.infoValue}>{job.workshop_name}</Text>
        </View>
      ) : null}

      {/* ─── Time Tracking Section ─── */}
      {(status === "in_progress" || status === "completed") &&
        timeSummary && (
          <View style={styles.timeCard}>
            {/* Travel time */}
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>🚗 Travel</Text>
              {liveTravelStr ? (
                <Text style={styles.timeLive}>{liveTravelStr}</Text>
              ) : (
                <Text style={styles.timeValue}>
                  {formatMinutes(timeSummary.travelMinutes)}
                </Text>
              )}
            </View>

            {/* On-site time */}
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>🔧 On-Site</Text>
              {liveOnsiteStr ? (
                <Text style={styles.timeLive}>{liveOnsiteStr}</Text>
              ) : (
                <Text style={styles.timeValue}>
                  {formatMinutes(timeSummary.onsiteMinutes)}
                </Text>
              )}
            </View>

            {/* Total */}
            <View style={[styles.timeRow, { borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 8 }]}>
              <Text style={[styles.timeLabel, { fontWeight: "700", color: "#0f172a" }]}>
                ⏱ Total
              </Text>
              <Text style={[styles.timeValue, { fontWeight: "700", color: "#0f172a" }]}>
                {formatMinutes(Math.round(totalDisplay))}
              </Text>
            </View>
          </View>
        )}

      {/* ─── Action Buttons ─── */}
      <View style={styles.actions}>
        {/* Navigate + Call — always visible if data exists */}
        {job.lat && job.lng ? (
          <TouchableOpacity style={styles.smallBtn} onPress={onNavigate}>
            <Text style={styles.smallBtnText}>📍 Navigate</Text>
          </TouchableOpacity>
        ) : null}

        {job.customer_phone ? (
          <TouchableOpacity
            style={[styles.smallBtn, styles.smallBtnOutline]}
            onPress={onCall}
          >
            <Text style={[styles.smallBtnText, { color: "#2563eb" }]}>
              📞 Call
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ─── Primary Action Button (context-aware) ─── */}
      {status === "assigned" && (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={onStart}
          disabled={isLoading}
        >
          <Text style={styles.primaryBtnText}>
            {isLoading ? "Starting..." : "▶  START JOB"}
          </Text>
        </TouchableOpacity>
      )}

      {status === "in_progress" && phase === "traveling" && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: "#ea580c" }]}
          onPress={onArrived}
          disabled={isLoading}
        >
          <Text style={styles.primaryBtnText}>
            {isLoading ? "Updating..." : "📍  I'VE ARRIVED"}
          </Text>
        </TouchableOpacity>
      )}

      {status === "in_progress" && phase === "on_site" && (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: "#16a34a" }]}
          onPress={onFinish}
          disabled={isLoading}
        >
          <Text style={styles.primaryBtnText}>
            {isLoading ? "Finishing..." : "✓  FINISH JOB"}
          </Text>
        </TouchableOpacity>
      )}

      {status === "in_progress" && phase === "return_travel" && (
        <View style={styles.returnBanner}>
          <Text style={styles.returnText}>
            🚗 Returning to workshop...
          </Text>
        </View>
      )}

      {status === "completed" && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>✅ Job Completed</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  center: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  muted: { color: "#64748b", fontSize: 15 },

  // Tabs
  tabRow: { flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tabActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabText: { color: "#64748b", fontWeight: "600", fontSize: 14 },
  tabTextActive: { color: "#fff" },

  // Stats
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statNum: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b", marginTop: 2 },

  // Job Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    flex: 1,
    marginRight: 8,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  desc: { color: "#64748b", fontSize: 13, lineHeight: 18 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: { color: "#94a3b8", fontSize: 13 },
  infoValue: { color: "#0f172a", fontSize: 13, fontWeight: "600" },

  // Time tracking
  timeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  timeLabel: { color: "#64748b", fontSize: 14 },
  timeValue: { color: "#0f172a", fontSize: 14, fontWeight: "600" },
  timeLive: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },

  // Small action buttons (Navigate, Call)
  actions: { flexDirection: "row", gap: 8, marginTop: 2 },
  smallBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  smallBtnOutline: {
    backgroundColor: "#fff",
    borderColor: "#bfdbfe",
  },
  smallBtnText: { color: "#334155", fontWeight: "600", fontSize: 13 },

  // Primary action button (START, ARRIVED, FINISH)
  primaryBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },

  // Return travel banner
  returnBanner: {
    backgroundColor: "#dbeafe",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  returnText: { color: "#1e40af", fontWeight: "700", fontSize: 14 },

  // Completed banner
  completedBanner: {
    backgroundColor: "#dcfce7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  completedText: { color: "#166534", fontWeight: "700", fontSize: 14 },

  // Empty
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  emptyText: { color: "#64748b", fontSize: 15 },
});
