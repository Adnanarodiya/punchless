import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  getAttendanceHistory,
  groupSessionsByDate,
  type HistoryDaySummary,
  type HistorySession,
} from "@/lib/services/history.service";

type FilterPeriod = "1day" | "7days" | "month";

const STATE_LABEL: Record<string, string> = {
  off_duty: "Off Duty",
  workshop: "Workshop",
  travel: "Travel",
  on_site_job: "On-Site",
};

const STATE_COLOR: Record<string, string> = {
  off_duty: "#64748b",
  workshop: "#16a34a",
  travel: "#2563eb",
  on_site_job: "#ea580c",
};

function formatMins(minutes: number): string {
  if (minutes === 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatTimeOnly(isoString: string | null): string {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getDateRange(period: FilterPeriod): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === "7days") {
    start.setDate(start.getDate() - 6);
  } else if (period === "month") {
    start.setDate(1);
  }

  return { start: start.toISOString(), end: end.toISOString() };
}

export default function HistoryScreen() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<FilterPeriod>("1day");
  const [daySummaries, setDaySummaries] = useState<HistoryDaySummary[]>([]);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { start, end } = getDateRange(period);
      const sessions = await getAttendanceHistory(user.id, start, end);
      const grouped = groupSessionsByDate(sessions);
      setDaySummaries(grouped);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    setLoading(false);
  }, [user?.id, period]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function toggleExpand(date: string) {
    setExpandedDate(expandedDate === date ? null : date);
  }

  // Calculate totals for the period
  let totalWorkshop = 0;
  let totalTravel = 0;
  let totalOnsite = 0;
  for (const d of daySummaries) {
    totalWorkshop += d.workshopMinutes;
    totalTravel += d.travelMinutes;
    totalOnsite += d.onsiteMinutes;
  }
  const totalAll = totalWorkshop + totalTravel + totalOnsite;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Period Filter */}
      <View style={styles.filterRow}>
        {(["1day", "7days", "month"] as FilterPeriod[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterBtn, period === p && styles.filterBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.filterBtnText, period === p && styles.filterBtnTextActive]}>
              {p === "1day" ? "Today" : p === "7days" ? "7 Days" : "Month"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>
          {period === "1day" ? "Today" : period === "7days" ? "Last 7 Days" : "This Month"}
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>{formatMins(totalWorkshop)}</Text>
            <Text style={styles.statLabel}>Workshop</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#2563eb" }]}>{formatMins(totalTravel)}</Text>
            <Text style={styles.statLabel}>Travel</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#ea580c" }]}>{formatMins(totalOnsite)}</Text>
            <Text style={styles.statLabel}>On-Site</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: "#0f172a" }]}>{formatMins(totalAll)}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      )}

      {/* Empty State */}
      {!loading && daySummaries.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No history found for this period.</Text>
        </View>
      )}

      {/* Day-wise History */}
      {!loading &&
        daySummaries.map((day) => (
          <View key={day.date} style={styles.dayCard}>
            {/* Day Header — Tappable */}
            <TouchableOpacity style={styles.dayHeader} onPress={() => toggleExpand(day.date)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayDate}>{day.date}</Text>
                <Text style={styles.dayMeta}>
                  {formatTimeOnly(day.firstClockIn)} → {formatTimeOnly(day.lastClockOut)}
                </Text>
              </View>
              <View style={styles.dayStats}>
                <Text style={styles.dayTotal}>{formatMins(day.totalMinutes)}</Text>
                <Text style={styles.dayExpand}>
                  {expandedDate === day.date ? "▲" : "▼"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Day Mini Summary */}
            <View style={styles.dayMiniStats}>
              {day.workshopMinutes > 0 && (
                <View style={[styles.miniTag, { backgroundColor: "#dcfce7" }]}>
                  <Text style={[styles.miniTagText, { color: "#16a34a" }]}>
                    🏭 {formatMins(day.workshopMinutes)}
                  </Text>
                </View>
              )}
              {day.travelMinutes > 0 && (
                <View style={[styles.miniTag, { backgroundColor: "#dbeafe" }]}>
                  <Text style={[styles.miniTagText, { color: "#2563eb" }]}>
                    🚗 {formatMins(day.travelMinutes)}
                  </Text>
                </View>
              )}
              {day.onsiteMinutes > 0 && (
                <View style={[styles.miniTag, { backgroundColor: "#ffedd5" }]}>
                  <Text style={[styles.miniTagText, { color: "#ea580c" }]}>
                    📍 {formatMins(day.onsiteMinutes)}
                  </Text>
                </View>
              )}
            </View>

            {/* Expanded Sessions */}
            {expandedDate === day.date && (
              <View style={styles.sessionsContainer}>
                {day.sessions.map((s) => (
                  <SessionRow key={s.id} session={s} />
                ))}
              </View>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

function SessionRow({ session: s }: { session: HistorySession }) {
  const color = STATE_COLOR[s.state] ?? "#64748b";
  const label = STATE_LABEL[s.state] ?? s.state;
  const isLive = !s.end_time;

  return (
    <View style={styles.sessionRow}>
      <View style={[styles.stateIndicator, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionState, { color }]}>{label}</Text>
          {isLive && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>● LIVE</Text>
            </View>
          )}
        </View>
        {(s.workshop_name || s.job_title) && (
          <Text style={styles.sessionLocation}>{s.workshop_name || s.job_title}</Text>
        )}
        <Text style={styles.sessionTime}>
          {formatTimeOnly(s.start_time)} → {isLive ? "Now" : formatTimeOnly(s.end_time)}
          {s.duration_minutes != null && ` • ${formatMins(s.duration_minutes)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Filter
  filterRow: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  filterBtnTextActive: {
    color: "#0f172a",
  },

  // Stats
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "600",
  },

  // Empty
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },

  // Day Card
  dayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  dayMeta: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  dayStats: {
    alignItems: "flex-end",
  },
  dayTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  dayExpand: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },

  // Day Mini Stats
  dayMiniStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: "wrap",
  },
  miniTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Sessions
  sessionsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingVertical: 8,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  stateIndicator: {
    width: 4,
    height: "100%",
    minHeight: 40,
    borderRadius: 2,
    marginTop: 2,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sessionState: {
    fontSize: 14,
    fontWeight: "700",
  },
  liveBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveBadgeText: {
    color: "#16a34a",
    fontSize: 10,
    fontWeight: "700",
  },
  sessionLocation: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  sessionTime: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },
});
