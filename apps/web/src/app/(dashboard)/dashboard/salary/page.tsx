import { getSalaryReport } from "@/lib/queries/salary.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { PayrollFlowPanel } from "@/components/payroll-flow-panel";
import { SalaryManager } from "./salary-manager";

interface Props {
  searchParams: Promise<{ month?: string; page?: string }>;
}

export default async function SalaryPage({ searchParams }: Props) {
  const params = await searchParams;

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = params.month || defaultMonth;
  const page = Number(params.page || "1");

  const { reports, salaryMode } = await getSalaryReport(monthStr, page, 50);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Salary"
        description="Monthly payroll from attendance — review gross, advance deductions, and due amounts, then pay staff."
      />
      <PayrollFlowPanel />
      <SalaryManager
        report={reports}
        salaryMode={salaryMode}
        currentMonth={monthStr}
        page={page}
      />
    </div>
  );
}