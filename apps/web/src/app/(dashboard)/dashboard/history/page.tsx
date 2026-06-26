import { getHistorySessions, getEmployeeSummaries } from "@/lib/queries/history.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { DashboardPageTitle } from "@/components/dashboard-page-title";
import { HistoryManager } from "./history-manager";

export default async function HistoryPage() {
  // Default: today's data
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [sessions, summaries, employees] = await Promise.all([
    getHistorySessions(todayStart.toISOString(), todayEnd.toISOString()),
    getEmployeeSummaries(todayStart.toISOString(), todayEnd.toISOString()),
    getEmployees(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageTitle title="History" />
      <HistoryManager
        initialSessions={sessions}
        initialSummaries={summaries}
        employees={employees}
      />
    </div>
  );
}
