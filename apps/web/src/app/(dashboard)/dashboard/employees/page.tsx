import { getEmployees } from "@/lib/queries/employee.queries";
import { getWorkshops } from "@/lib/queries/workshop.queries";
import { EmployeeManager } from "./employee-manager";

export default async function EmployeesPage() {
  const [employees, workshops] = await Promise.all([
    getEmployees(),
    getWorkshops(),
  ]);

  // Only pass active workshops for assignment
  const activeWorkshops = workshops.filter((w) => w.is_active);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Employees</h1>
      <EmployeeManager employees={employees} workshops={activeWorkshops} />
    </div>
  );
}
