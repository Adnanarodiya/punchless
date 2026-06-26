import { getTodayAttendance, getActiveSessions } from "@/lib/queries/attendance.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { getWorkshops } from "@/lib/queries/workshop.queries";
import { DashboardPageTitle } from "@/components/dashboard-page-title";
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
      <DashboardPageTitle title="Attendance" />
      <AttendanceManager
        todaySessions={todaySessions}
        activeSessions={activeSessions}
        employees={employees}
        workshops={activeWorkshops}
      />
    </div>
  );
}
