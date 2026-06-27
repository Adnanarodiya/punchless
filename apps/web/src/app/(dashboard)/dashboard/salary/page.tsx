import { redirect } from "next/navigation";
import { getActiveEmployeesForMapping, getFingerprintSalaryReport } from "@/lib/queries/attendance-import.queries";
import { getBanks } from "@/lib/queries/bank.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { getEmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { getStaffPayments } from "@/lib/queries/staff-payment.queries";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { FingerprintSalarySection } from "@/components/fingerprint-salary-section";
import { PayStaffHub } from "@/components/pay-staff-hub";
import { PayrollFlowPanel } from "@/components/payroll-flow-panel";
import { PageFirstVisitTip } from "@/components/page-first-visit-tip";

// GPS / mobile attendance salary report — paused (fingerprint upload is the only payroll path for now)
// import { getSalaryReport } from "@/lib/queries/salary.queries";
// import { SalaryManager } from "./salary-manager";

interface Props {
  searchParams: Promise<{
    month?: string;
    page?: string;
    tab?: string;
    employee?: string;
    openPay?: string;
    amount?: string;
  }>;
}

function currentMonthStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export default async function SalaryPage({ searchParams }: Props) {
  const params = await searchParams;
  const monthStr = params.month || currentMonthStr();
  const settings = await getCompanySettings();
  const isSimple = settings?.dashboard_experience !== "full";

  const initialEmployeeId = params.employee?.trim() || undefined;
  const initialOpenPay = params.openPay === "1";
  const initialTab = params.tab === "history" ? ("history" as const) : ("this-month" as const);
  const parsedAmount = params.amount ? Number(params.amount) : undefined;
  const initialAmount =
    parsedAmount != null && Number.isFinite(parsedAmount) && parsedAmount > 0
      ? Math.round(parsedAmount)
      : undefined;

  const [fingerprintReport, employeesForMapping] = await Promise.all([
    getFingerprintSalaryReport(monthStr),
    getActiveEmployeesForMapping(),
  ]);

  if (isSimple) {
    const [payments, employees, banks, initialPayable] = await Promise.all([
      getStaffPayments(),
      getEmployees(),
      getBanks(),
      initialEmployeeId
        ? getEmployeeSalaryPayable(initialEmployeeId, monthStr)
        : Promise.resolve(null),
    ]);

    return (
      <PayStaffHub
        currentMonth={monthStr}
        fingerprintReport={fingerprintReport}
        employeesForMapping={employeesForMapping}
        payments={payments}
        employees={employees}
        banks={banks}
        initialEmployeeId={initialEmployeeId}
        initialOpenPay={initialOpenPay}
        initialAmount={initialAmount}
        initialPayable={initialPayable}
        initialTab={initialTab}
      />
    );
  }

  if (params.openPay || params.tab || params.employee) {
    const q = new URLSearchParams();
    if (monthStr) q.set("month", monthStr);
    if (initialEmployeeId) q.set("employee", initialEmployeeId);
    if (initialOpenPay) q.set("openForm", "1");
    if (initialAmount) q.set("amount", String(initialAmount));
    redirect(`/dashboard/salary/payments?${q.toString()}`);
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Staff salary"
        description="Upload your monthly fingerprint sheet, review working days and OT, then pay staff — same columns as your Shahin salary report."
      />
      <PageFirstVisitTip pageId="salary" />
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