import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth.store";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    const result = await login(email.trim(), password);
    if (!result.success) {
      setError(result.error || "Login failed");
      return;
    }
    router.replace("/(tabs)/home");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⚡ Punchless</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#94a3b8"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 16,
  },
  error: {
    color: "#dc2626",
    marginBottom: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    minHeight: 52,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
