import { View, Text, StyleSheet } from "react-native";

export default function JobsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.empty}>No jobs assigned yet.</Text>
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
