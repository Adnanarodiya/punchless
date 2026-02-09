import { Tabs } from "expo-router";
import { Briefcase, CircleUserRound, House, IndianRupee } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#ffffff" },
        headerTintColor: "#0f172a",
        headerTitleStyle: { fontWeight: "600" },
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e2e8f0" },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          tabBarLabel: "Jobs",
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="salary"
        options={{
          title: "Salary",
          tabBarLabel: "Salary",
          tabBarIcon: ({ color, size }) => <IndianRupee size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <CircleUserRound size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
