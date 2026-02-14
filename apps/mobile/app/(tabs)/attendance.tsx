import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  getMonthlyAttendance,
  type MonthlyAttendanceData,
} from "@/lib/services/calendar.service";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { formatMinutes } from "@/lib/utils/formatting";

export default function AttendanceScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [data, setData] = useState<MonthlyAttendanceData | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getMonthlyAttendance(
        user.id,
        user.company_id,
        year,
        month
      );
      setData(result);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    }
    setLoading(false);
  }, [user?.id, user?.company_id, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function onMonthChange(newYear: number, newMonth: number) {
    setYear(newYear);
    setMonth(newMonth);
    setData(null);
  }

  // Calculate total working minutes for the month
  const totalWorkedMinutes = data
    ? Object.values(data.days).reduce((sum, d) => sum + d.totalMinutes, 0)
    : 0;

  const totalDaysTracked = data
    ? data.totalPresent + data.totalIncomplete + data.totalAbsent
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Calendar */}
      <View style={styles.calendarCard}>
        <AttendanceCalendar
          year={year}
          month={month}
          data={data}
          loading={loading}
          onMonthChange={onMonthChange}
        />
      </View>

      {/* Monthly Summary Stats */}
      {data && !loading && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Monthly Overview</Text>
          <View style={styles.statsGrid}>
            <StatBox
              label="Total Hours"
              value={formatMinutes(totalWorkedMinutes)}
              color="#0f172a"
            />
            <StatBox
              label="Days Tracked"
              value={`${totalDaysTracked}`}
              color="#0f172a"
            />
            <StatBox
              label="Full Days"
              value={`${data.totalPresent}`}
              color="#16a34a"
            />
            <StatBox
              label="Incomplete"
              value={`${data.totalIncomplete}`}
              color="#ea580c"
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
  },
});
