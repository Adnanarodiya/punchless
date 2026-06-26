import { getEmployees } from "@/lib/queries/employee.queries";
import { getPosts } from "@/lib/queries/post.queries";
import { getWorkshops } from "@/lib/queries/workshop.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { EmployeeManager } from "./employee-manager";

export default async function EmployeesPage() {
  const [employees, workshops, settings, posts] = await Promise.all([
    getEmployees(),
    getWorkshops(),
    getCompanySettings(),
    getPosts(),
  ]);

  const activeWorkshops = workshops.filter((w) => w.is_active);

  return (
    <EmployeeManager
      employees={employees}
      workshops={activeWorkshops}
      posts={posts}
      dailyWorkHours={settings?.daily_work_hours ?? 8}
      workingDaysPerMonth={settings?.working_days_per_month ?? 26}
    />
  );
}