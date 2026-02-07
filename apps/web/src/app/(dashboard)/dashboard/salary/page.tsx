import { getSalaryReport } from "@/lib/queries/salary.queries";
import { SalaryManager } from "./salary-manager";

export default async function SalaryPage() {
  // Default to current month
  const today = new Date();
  const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const report = await getSalaryReport(monthStr);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Salary</h1>
      <SalaryManager report={report} />
    </div>
  );
}
