import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuthStore } from "@/lib/stores/auth.store";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.full_name ?? "Employee"}</Text>
        <Text style={styles.role}>{user?.role ?? "employee"}</Text>
        <Text style={styles.meta}>{user?.email}</Text>
        <Text style={styles.meta}>Monthly Salary: ₹{(user?.monthly_salary ?? 0).toLocaleString("en-IN")}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => void logout()}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  name: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "700",
  },
  role: {
    color: "#2563eb",
    fontSize: 14,
    textTransform: "capitalize",
  },
  meta: {
    color: "#64748b",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#dc2626",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
