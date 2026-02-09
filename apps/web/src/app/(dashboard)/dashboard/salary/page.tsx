import { getSalaryReport } from "@/lib/queries/salary.queries";
import { SalaryManager } from "./salary-manager";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function SalaryPage({ searchParams }: Props) {
  const params = await searchParams;

  // Use month from URL search params, or default to current month
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = params.month || defaultMonth;

  const report = await getSalaryReport(monthStr);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Salary</h1>
      <SalaryManager report={report} currentMonth={monthStr} />
    </div>
  );
}
