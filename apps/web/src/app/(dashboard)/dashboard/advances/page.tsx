import { getAdvances } from "@/lib/queries/advance.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { AdvanceManager } from "./advance-manager";

export default async function AdvancesPage() {
  const [advances, employees] = await Promise.all([
    getAdvances(),
    getEmployees(),
  ]);

  const activeEmployees = employees.filter((e) => e.is_active);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Salary Advances"
        description="Approve advance requests — approved amounts are deducted on the Salary report for that month."
      />
      <AdvanceManager advances={advances} employees={activeEmployees} />
    </div>
  );
}