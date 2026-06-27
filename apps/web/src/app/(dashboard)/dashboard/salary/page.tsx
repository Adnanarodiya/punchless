import { getActiveEmployeesForMapping, getFingerprintSalaryReport } from "@/lib/queries/attendance-import.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { FingerprintSalarySection } from "@/components/fingerprint-salary-section";
import { PayrollFlowPanel } from "@/components/payroll-flow-panel";

// GPS / mobile attendance salary report — paused (fingerprint upload is the only payroll path for now)
// import { getSalaryReport } from "@/lib/queries/salary.queries";
// import { SalaryManager } from "./salary-manager";

interface Props {
  searchParams: Promise<{ month?: string; page?: string }>;
}

export default async function SalaryPage({ searchParams }: Props) {
  const params = await searchParams;

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const monthStr = params.month || defaultMonth;

  const [fingerprintReport, employeesForMapping] = await Promise.all([
    getFingerprintSalaryReport(monthStr),
    getActiveEmployeesForMapping(),
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Salary"
        description="Upload your monthly fingerprint sheet, review working days and OT, then pay staff — same columns as your Shahin salary report."
      />
      <PayrollFlowPanel />
      <FingerprintSalarySection
        currentMonth={monthStr}
        report={fingerprintReport}
        employeesForMapping={employeesForMapping}
      />
      {/*
        GPS-based SalaryManager — disabled until mobile/GPS attendance returns.
        <SalaryManager report={reports} salaryMode={salaryMode} currentMonth={monthStr} page={page} />
      */}
    </div>
  );
}