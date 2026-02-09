import { View, Text, StyleSheet } from "react-native";

export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>No jobs assigned yet.</Text>
      <Text style={styles.sub}>Job sync will be added in the next mobile step.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  empty: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "600",
  },
  sub: {
    marginTop: 8,
    color: "#64748b",
  },
});
