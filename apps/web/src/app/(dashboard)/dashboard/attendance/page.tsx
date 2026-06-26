import { getTodayAttendance, getActiveSessions } from "@/lib/queries/attendance.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { getWorkshops } from "@/lib/queries/workshop.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { AttendanceManager } from "./attendance-manager";

export default async function AttendancePage() {
  const [todaySessions, activeSessions, employees, workshops] = await Promise.all([
    getTodayAttendance(),
    getActiveSessions(),
    getEmployees(),
    getWorkshops(),
  ]);

  const activeWorkshops = workshops.filter((w) => w.is_active);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Attendance"
        description="Who is working now, today's sessions, bulk mark-present, and printable daily sheet."
      />
      <AttendanceManager
        todaySessions={todaySessions}
        activeSessions={activeSessions}
        employees={employees}
        workshops={activeWorkshops}
      />
    </div>
  );
}