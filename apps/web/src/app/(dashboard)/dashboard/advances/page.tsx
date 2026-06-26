import { getAdvances } from "@/lib/queries/advance.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { DashboardPageTitle } from "@/components/dashboard-page-title";
import { AdvanceManager } from "./advance-manager";

export default async function AdvancesPage() {
  const [advances, employees] = await Promise.all([
    getAdvances(),
    getEmployees(),
  ]);

  // Only active employees for the "create advance" form
  const activeEmployees = employees.filter((e) => e.is_active);

  return (
    <div className="space-y-6">
      <DashboardPageTitle title="Salary Advances" />
      <AdvanceManager advances={advances} employees={activeEmployees} />
    </div>
  );
}
