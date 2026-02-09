import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";
import { getMySalaryReport, type MySalaryReport } from "@/lib/services/salary.service";
import { getMyAdvances, requestAdvance, type MyAdvance } from "@/lib/services/advance.service";
import { formatCurrency, getCurrentMonthString } from "@/lib/utils/formatting";

export default function SalaryScreen() {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [month] = useState(getCurrentMonthString());
  const [report, setReport] = useState<MySalaryReport | null>(null);
  const [advances, setAdvances] = useState<MyAdvance[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    const [salaryData, myAdvances] = await Promise.all([
      getMySalaryReport(user.id, month),
      getMyAdvances(user.id),
    ]);
    setReport(salaryData);
    setAdvances(myAdvances);
  }

  useEffect(() => {
    void load();
  }, [user?.id, month]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function onRequestAdvance() {
    if (!user) return;
    setMsg(null);

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setMsg("Enter a valid amount");
      return;
    }

    const { error } = await requestAdvance({
      companyId: user.company_id,
      employeeId: user.id,
      amount: amt,
      reason,
      salaryMonth: month,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setAmount("");
    setReason("");
    setMsg("Advance request submitted");
    await load();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Salary ({month})</Text>
        <Item label="Gross" value={formatCurrency(report?.grossSalary ?? 0)} />
        <Item label="Advances" value={`- ${formatCurrency(report?.advanceDeduction ?? 0)}`} danger />
        <Item label="Net" value={formatCurrency(report?.netSalary ?? 0)} success />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Request Advance</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          style={styles.input}
          placeholder="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.button} onPress={onRequestAdvance}>
          <Text style={styles.buttonText}>Submit Request</Text>
        </TouchableOpacity>
        {msg ? <Text style={styles.info}>{msg}</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Advance History</Text>
        {advances.length === 0 ? (
          <Text style={styles.muted}>No advance requests yet.</Text>
        ) : (
          advances.slice(0, 10).map((a) => (
            <View key={a.id} style={styles.row}>
              <View>
                <Text style={styles.rowMain}>{formatCurrency(a.amount)}</Text>
                <Text style={styles.rowSub}>{a.reason || "No reason"}</Text>
              </View>
              <Text
                style={[
                  styles.status,
                  a.status === "approved"
                    ? { color: "#16a34a" }
                    : a.status === "rejected"
                    ? { color: "#dc2626" }
                    : { color: "#d97706" },
                ]}
              >
                {a.status?.toUpperCase()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Item({ label, value, success, danger }: { label: string; value: string; success?: boolean; danger?: boolean }) {
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={[styles.itemValue, success && { color: "#16a34a" }, danger && { color: "#dc2626" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  itemLabel: { color: "#64748b" },
  itemValue: { color: "#0f172a", fontWeight: "700" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#0f172a",
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  info: { color: "#2563eb", marginTop: 4 },
  muted: { color: "#64748b" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  rowMain: { color: "#0f172a", fontWeight: "700" },
  rowSub: { color: "#64748b", fontSize: 12, marginTop: 2 },
  status: { fontWeight: "700", fontSize: 12 },
});
