import { View, Text, StyleSheet } from "react-native";

export default function SalaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>Salary data will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  empty: {
    color: "#666",
    fontSize: 16,
  },
});
