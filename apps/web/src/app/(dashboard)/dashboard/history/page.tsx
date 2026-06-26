import { getHistorySessions, getEmployeeSummaries } from "@/lib/queries/history.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { HistoryManager } from "./history-manager";

export default async function HistoryPage() {
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
      <DashboardPageHeader
        title="History"
        description="Past attendance by employee or session — review and export CSV before running monthly salary."
      />
      <HistoryManager
        initialSessions={sessions}
        initialSummaries={summaries}
        employees={employees}
      />
    </div>
  );
}