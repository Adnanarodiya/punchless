import { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  getMyCorrectionRequests,
  submitBreakCorrection,
  submitSessionCorrection,
  type CorrectionRequest,
} from "@/lib/services/correction.service";
import {
  getAttendanceHistory,
  type HistorySession,
} from "@/lib/services/history.service";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#16a34a",
  rejected: "#dc2626",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "⏳ Pending",
  approved: "✅ Approved",
  rejected: "❌ Rejected",
};

const TYPE_LABEL: Record<string, string> = {
  break_correction: "Break Correction",
  session_correction: "Session Correction",
  missing_session: "Missing Session",
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RequestsScreen() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [todaySessions, setTodaySessions] = useState<HistorySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);
  const [requestedStartTime, setRequestedStartTime] = useState("");
  const [requestedEndTime, setRequestedEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getMyCorrectionRequests(user.id);
    setRequests(data);
    setLoading(false);
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function openForm() {
    if (!user) return;
    // Load today's sessions so user can select which one to correct
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const sessions = await getAttendanceHistory(user.id, start.toISOString(), end.toISOString());
    setTodaySessions(sessions);
    setSelectedSession(null);
    setRequestedStartTime("");
    setRequestedEndTime("");
    setReason("");
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!user) return;
    if (!reason.trim()) {
      Alert.alert("Error", "Please enter a reason for the correction.");
      return;
    }
    if (!requestedEndTime.trim()) {
      Alert.alert("Error", "Please enter the correct end time (HH:MM format, e.g. 13:30).");
      return;
    }

    setSubmitting(true);

    const today = new Date().toISOString().split("T")[0];

    // Parse requested times — use today's date with the entered time
    const startStr = requestedStartTime.trim()
      ? new Date(`${today}T${requestedStartTime.trim()}:00`).toISOString()
      : selectedSession?.start_time ?? new Date().toISOString();
    const endStr = new Date(`${today}T${requestedEndTime.trim()}:00`).toISOString();

    let result;
    if (selectedSession && selectedSession.state === "break") {
      result = await submitBreakCorrection({
        employeeId: user.id,
        companyId: user.company_id,
        sessionId: selectedSession.id,
        originalStart: selectedSession.start_time,
        originalEnd: selectedSession.end_time,
        requestedStart: startStr,
        requestedEnd: endStr,
        date: today,
        reason: reason.trim(),
      });
    } else {
      result = await submitSessionCorrection({
        employeeId: user.id,
        companyId: user.company_id,
        sessionId: selectedSession?.id,
        originalStart: selectedSession?.start_time,
        originalEnd: selectedSession?.end_time,
        originalState: selectedSession?.state,
        requestedStart: startStr,
        requestedEnd: endStr,
        requestedState: selectedSession?.state,
        date: today,
        reason: reason.trim(),
      });
    }

    setSubmitting(false);

    if (result.success) {
      Alert.alert("Success", "Correction request submitted! Your admin will review it.");
      setShowForm(false);
      await load();
    } else {
      Alert.alert("Error", result.error ?? "Failed to submit request.");
    }
  }

  const STATE_LABEL: Record<string, string> = {
    workshop: "🏭 Workshop",
    travel: "🚗 Travel",
    on_site_job: "📍 On-Site",
    break: "☕ Break",
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* New Request Button */}
      <TouchableOpacity style={styles.newRequestBtn} onPress={openForm}>
        <Text style={styles.newRequestText}>+ New Correction Request</Text>
      </TouchableOpacity>

      {/* Request Form Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Correction Request</Text>
            <Text style={styles.modalSubtitle}>Select a session to correct, or describe the issue</Text>

            {/* Session Picker */}
            {todaySessions.length > 0 && (
              <View style={styles.sessionPicker}>
                <Text style={styles.fieldLabel}>Select Session (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {todaySessions.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.sessionChip,
                          selectedSession?.id === s.id && styles.sessionChipSelected,
                        ]}
                        onPress={() => setSelectedSession(selectedSession?.id === s.id ? null : s)}
                      >
                        <Text style={[
                          styles.sessionChipText,
                          selectedSession?.id === s.id && styles.sessionChipTextSelected,
                        ]}>
                          {STATE_LABEL[s.state] ?? s.state}
                        </Text>
                        <Text style={[
                          styles.sessionChipTime,
                          selectedSession?.id === s.id && { color: "#fff" },
                        ]}>
                          {formatTime(s.start_time)} → {s.end_time ? formatTime(s.end_time) : "Live"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Time inputs */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Correct Start (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 13:00"
                  placeholderTextColor="#94a3b8"
                  value={requestedStartTime}
                  onChangeText={setRequestedStartTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Correct End (HH:MM)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 13:30"
                  placeholderTextColor="#94a3b8"
                  value={requestedEndTime}
                  onChangeText={setRequestedEndTime}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>

            {/* Reason */}
            <View>
              <Text style={styles.fieldLabel}>Reason</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                placeholder="e.g. Forgot to end break"
                placeholderTextColor="#94a3b8"
                value={reason}
                onChangeText={setReason}
                multiline
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowForm(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Existing Requests */}
      {loading ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No correction requests yet.</Text>
          <Text style={styles.emptyHint}>
            If you forgot to end a break or need to fix your hours, tap the button above.
          </Text>
        </View>
      ) : (
        requests.map((r) => (
          <View key={r.id} style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[r.status ?? "pending"] + "20" }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[r.status ?? "pending"] }]}>
                  {STATUS_LABEL[r.status ?? "pending"]}
                </Text>
              </View>
              <Text style={styles.requestDate}>{formatDate(r.created_at)}</Text>
            </View>

            <Text style={styles.requestType}>{TYPE_LABEL[r.request_type] ?? r.request_type}</Text>

            {/* Original vs Requested */}
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>Original</Text>
                <Text style={styles.comparisonValue}>
                  {formatTime(r.original_start_time)} → {formatTime(r.original_end_time)}
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
              <View style={styles.comparisonCol}>
                <Text style={styles.comparisonLabel}>Requested</Text>
                <Text style={[styles.comparisonValue, { color: "#2563eb" }]}>
                  {formatTime(r.requested_start_time)} → {formatTime(r.requested_end_time)}
                </Text>
              </View>
            </View>

            <Text style={styles.requestReason}>📝 {r.reason}</Text>

            {r.admin_notes && (
              <Text style={styles.adminNotes}>💬 Admin: {r.admin_notes}</Text>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  newRequestBtn: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  newRequestText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  emptyText: { color: "#64748b", fontSize: 15, fontWeight: "600" },
  emptyHint: { color: "#94a3b8", fontSize: 13, textAlign: "center" },

  // Request Card
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10,
  },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: "700" },
  requestDate: { fontSize: 12, color: "#94a3b8" },
  requestType: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  comparisonRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f8fafc", borderRadius: 10, padding: 12 },
  comparisonCol: { flex: 1 },
  comparisonLabel: { fontSize: 10, color: "#94a3b8", fontWeight: "600", marginBottom: 2 },
  comparisonValue: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  arrow: { fontSize: 16, color: "#94a3b8" },
  requestReason: { fontSize: 13, color: "#475569" },
  adminNotes: { fontSize: 13, color: "#2563eb", backgroundColor: "#eff6ff", padding: 8, borderRadius: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, maxHeight: "85%" },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  modalSubtitle: { fontSize: 13, color: "#64748b", marginTop: -8 },

  sessionPicker: {},
  sessionChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#f8fafc",
    minWidth: 120,
  },
  sessionChipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  sessionChipText: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  sessionChipTextSelected: { color: "#fff" },
  sessionChipTime: { fontSize: 11, color: "#64748b", marginTop: 2 },

  fieldLabel: { fontSize: 12, fontWeight: "600", color: "#64748b", marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#0f172a",
    backgroundColor: "#f8fafc",
  },
  timeRow: { flexDirection: "row", gap: 12 },

  modalActions: { gap: 8, marginTop: 8 },
  submitBtn: { backgroundColor: "#2563eb", borderRadius: 12, padding: 16, alignItems: "center" },
  submitBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cancelBtn: { padding: 12, alignItems: "center" },
  cancelBtnText: { color: "#64748b", fontSize: 14 },
});
