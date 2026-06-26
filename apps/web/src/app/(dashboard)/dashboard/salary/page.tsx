import { getSalaryReport } from "@/lib/queries/salary.queries";
import { DashboardPageTitle } from "@/components/dashboard-page-title";
import { SalaryManager } from "./salary-manager";

interface Props {
  searchParams: Promise<{ month?: string; page?: string }>;
}

export default async function SalaryPage({ searchParams }: Props) {
  const params = await searchParams;

  // Use month from URL search params, or default to current month
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = params.month || defaultMonth;
  const page = Number(params.page || "1");

  const { reports, salaryMode } = await getSalaryReport(monthStr, page, 50);

  return (
    <div className="space-y-6">
      <DashboardPageTitle title="Salary" />
      <SalaryManager
        report={reports}
        salaryMode={salaryMode}
        currentMonth={monthStr}
        page={page}
      />
    </div>
  );
}
