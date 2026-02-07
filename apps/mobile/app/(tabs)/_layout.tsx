import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#0a0a0a", borderTopColor: "#222" },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarLabel: "Home" }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: "Jobs", tabBarLabel: "Jobs" }}
      />
      <Tabs.Screen
        name="salary"
        options={{ title: "Salary", tabBarLabel: "Salary" }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />
    </Tabs>
  );
}
