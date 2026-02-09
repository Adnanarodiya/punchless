import { getEmployees } from "@/lib/queries/employee.queries";
import { getWorkshops } from "@/lib/queries/workshop.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { EmployeeManager } from "./employee-manager";

export default async function EmployeesPage() {
  const [employees, workshops, settings] = await Promise.all([
    getEmployees(),
    getWorkshops(),
    getCompanySettings(),
  ]);

  // Only pass active workshops for assignment
  const activeWorkshops = workshops.filter((w) => w.is_active);

  const dailyWorkHours = settings?.daily_work_hours ?? 8;
  const workingDaysPerMonth = settings?.working_days_per_month ?? 26;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>
      <EmployeeManager
        employees={employees}
        workshops={activeWorkshops}
        dailyWorkHours={dailyWorkHours}
        workingDaysPerMonth={workingDaysPerMonth}
      />
    </div>
  );
}
