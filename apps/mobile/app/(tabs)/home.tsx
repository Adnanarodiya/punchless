import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>
        <Text style={styles.statusValue}>OFF DUTY</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Today&apos;s Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Workshop</Text>
          <Text style={styles.summaryValue}>0h 0m</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Travel</Text>
          <Text style={styles.summaryValue}>0h 0m</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>On-Site</Text>
          <Text style={styles.summaryValue}>0h 0m</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 16,
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  statusLabel: {
    color: "#666",
    fontSize: 14,
    marginBottom: 8,
  },
  statusValue: {
    color: "#ef4444",
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  summaryLabel: {
    color: "#999",
    fontSize: 15,
  },
  summaryValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
});
