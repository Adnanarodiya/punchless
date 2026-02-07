import { Users, Clock, Briefcase, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get counts
  const { count: employeeCount } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)
    .eq("role", "employee");

  const { count: activeSessionCount } = await supabase
    .from("attendance_sessions")
    .select("*", { count: "exact", head: true })
    .is("end_time", null);

  const { count: activeJobCount } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "assigned", "in_progress"]);

  const { count: pendingAdvanceCount } = await supabase
    .from("salary_advances")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const stats = [
    {
      label: "Active Employees",
      value: employeeCount ?? 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Currently Working",
      value: activeSessionCount ?? 0,
      icon: Clock,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Active Jobs",
      value: activeJobCount ?? 0,
      icon: Briefcase,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: "Pending Advances",
      value: pendingAdvanceCount ?? 0,
      icon: Wallet,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className={`${stat.bgColor} ${stat.color} p-2 rounded-lg`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Placeholder sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Attendance</h2>
          <p className="text-sm text-muted-foreground">
            Attendance data will appear here once employees start tracking.
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Job activity will appear here once jobs are created.
          </p>
        </div>
      </div>
    </div>
  );
}
