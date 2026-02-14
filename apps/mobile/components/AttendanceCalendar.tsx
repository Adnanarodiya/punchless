import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import type { DayAttendance, MonthlyAttendanceData } from "@/lib/services/calendar.service";
import { formatMinutes } from "@/lib/utils/formatting";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CALENDAR_PADDING = 16;
const CELL_GAP = 4;
const CELL_SIZE = Math.floor((SCREEN_WIDTH - CALENDAR_PADDING * 2 - CELL_GAP * 6) / 7);

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS = {
  present: "#22c55e",     // Green
  incomplete: "#fdba74",  // Light orange
  absent: "#d1d5db",      // Gray
  future: "transparent",
  today_present: "#16a34a",
  today_incomplete: "#f97316",
  today_absent: "#9ca3af",
};

type Props = {
  year: number;
  month: number; // 1-indexed
  data: MonthlyAttendanceData | null;
  loading: boolean;
  onMonthChange: (year: number, month: number) => void;
};

export default function AttendanceCalendar({ year, month, data, loading, onMonthChange }: Props) {
  const [selectedDay, setSelectedDay] = useState<DayAttendance | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sunday

    const grid: (number | null)[] = [];
    // Fill blanks for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
      grid.push(null);
    }
    // Fill actual days
    for (let d = 1; d <= daysInMonth; d++) {
      grid.push(d);
    }
    return grid;
  }, [year, month]);

  function goToPrevMonth() {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
    setSelectedDay(null);
  }

  function goToNextMonth() {
    const now = new Date();
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    // Don't allow going to future months
    if (nextYear > now.getFullYear() || (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1)) {
      return;
    }
    onMonthChange(nextYear, nextMonth);
    setSelectedDay(null);
  }

  function getDayInfo(day: number): DayAttendance | undefined {
    if (!data) return undefined;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return data.days[dateStr];
  }

  function getDayColor(day: number): string {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayDate = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    // Future date
    if (dayDate > now) return STATUS_COLORS.future;

    const info = data?.days[dateStr];
    if (!info) return STATUS_COLORS.absent;

    return STATUS_COLORS[info.status];
  }

  function isToday(day: number): boolean {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr === today;
  }

  function isFuture(day: number): boolean {
    const dayDate = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return dayDate > now;
  }

  const canGoNext = (() => {
    const now = new Date();
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    return !(nextYear > now.getFullYear() || (nextYear === now.getFullYear() && nextMonth > now.getMonth() + 1));
  })();

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <Text style={styles.navText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[month - 1]} {year}
        </Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.navButton, !canGoNext && { opacity: 0.3 }]}
          disabled={!canGoNext}
        >
          <Text style={styles.navText}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* Day of week headers */}
      <View style={styles.weekRow}>
        {DAY_NAMES.map((d) => (
          <View key={d} style={styles.weekCell}>
            <Text style={styles.weekText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {calendarGrid.map((day, idx) => {
            if (day === null) {
              return <View key={`blank-${idx}`} style={styles.cell} />;
            }

            const bgColor = getDayColor(day);
            const future = isFuture(day);
            const todayFlag = isToday(day);
            const dayInfo = getDayInfo(day);

            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.cell,
                  { backgroundColor: future ? "transparent" : bgColor },
                  todayFlag && styles.todayCell,
                ]}
                onPress={() => {
                  if (!future && dayInfo) setSelectedDay(dayInfo);
                }}
                disabled={future || !dayInfo}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    future && styles.futureText,
                    todayFlag && styles.todayText,
                    !future && dayInfo?.status === "present" && styles.presentText,
                    !future && dayInfo?.status === "incomplete" && styles.incompleteText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Selected day detail */}
      {selectedDay && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>
              {formatDateNice(selectedDay.date)}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    selectedDay.status === "present"
                      ? "#dcfce7"
                      : selectedDay.status === "incomplete"
                      ? "#fff7ed"
                      : "#f3f4f6",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      selectedDay.status === "present"
                        ? "#16a34a"
                        : selectedDay.status === "incomplete"
                        ? "#ea580c"
                        : "#6b7280",
                  },
                ]}
              >
                {selectedDay.status === "present"
                  ? "✓ Full Day"
                  : selectedDay.status === "incomplete"
                  ? "⚠ Incomplete"
                  : "✗ Absent"}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hours Worked</Text>
            <Text style={styles.detailValue}>
              {formatMinutes(selectedDay.totalMinutes)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Required Hours</Text>
            <Text style={styles.detailValue}>
              {formatMinutes(selectedDay.requiredMinutes)}
            </Text>
          </View>
          {selectedDay.status === "incomplete" && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: "#ea580c" }]}>Shortfall</Text>
              <Text style={[styles.detailValue, { color: "#ea580c" }]}>
                {formatMinutes(selectedDay.requiredMinutes - selectedDay.totalMinutes)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Legend & Summary */}
      {data && (
        <View style={styles.legendCard}>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.present }]} />
              <Text style={styles.legendText}>Present ({data.totalPresent})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.incomplete }]} />
              <Text style={styles.legendText}>Incomplete ({data.totalIncomplete})</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS.absent }]} />
              <Text style={styles.legendText}>Absent ({data.totalAbsent})</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    fontSize: 16,
    color: "#334155",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },

  // Week header
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  weekCell: {
    width: CELL_SIZE,
    alignItems: "center",
    paddingVertical: 4,
  },
  weekText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: CELL_GAP,
    paddingHorizontal: 2,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  futureText: {
    color: "#cbd5e1",
  },
  todayCell: {
    borderWidth: 2.5,
    borderColor: "#2563eb",
  },
  todayText: {
    fontWeight: "800",
  },
  presentText: {
    color: "#14532d",
  },
  incompleteText: {
    color: "#7c2d12",
  },

  // Loading
  loadingContainer: {
    height: CELL_SIZE * 6,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
  },

  // Detail card
  detailCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  detailDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  detailLabel: {
    color: "#64748b",
    fontSize: 14,
  },
  detailValue: {
    color: "#0f172a",
    fontWeight: "700",
    fontSize: 14,
  },

  // Legend
  legendCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
  },
});
