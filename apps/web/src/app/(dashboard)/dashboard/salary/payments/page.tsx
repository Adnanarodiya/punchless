import { redirect } from "next/navigation";
import { getBanks } from "@/lib/queries/bank.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { getEmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import { getCompanySettings } from "@/lib/queries/settings.queries";
import { getStaffPayments } from "@/lib/queries/staff-payment.queries";
import { StaffPaymentManager } from "./staff-payment-manager";

interface Props {
  searchParams: Promise<{
    employee?: string;
    month?: string;
    openForm?: string;
    amount?: string;
  }>;
}

function currentMonthStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export default async function StaffPaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const settings = await getCompanySettings();
  const isSimple = settings?.dashboard_experience !== "full";

  const initialEmployeeId = params.employee?.trim() || undefined;
  const initialMonth = params.month?.trim() || currentMonthStr();
  const initialOpenForm = params.openForm === "1" || !!initialEmployeeId;
  const initialAmount = params.amount ? Number(params.amount) : undefined;
  const parsedInitialAmount =
    initialAmount != null && Number.isFinite(initialAmount) && initialAmount > 0
      ? Math.round(initialAmount)
      : undefined;

  if (isSimple) {
    const q = new URLSearchParams();
    q.set("month", initialMonth);
    if (initialOpenForm && initialEmployeeId) {
      q.set("employee", initialEmployeeId);
      q.set("openPay", "1");
    } else {
      q.set("tab", "history");
      if (initialEmployeeId) q.set("employee", initialEmployeeId);
    }
    if (parsedInitialAmount) q.set("amount", String(parsedInitialAmount));
    redirect(`/dashboard/salary?${q.toString()}`);
  }

  const [payments, employees, banks, initialPayable] = await Promise.all([
    getStaffPayments(),
    getEmployees(),
    getBanks(),
    initialEmployeeId
      ? getEmployeeSalaryPayable(initialEmployeeId, initialMonth)
      : Promise.resolve(null),
  ]);

  return (
    <StaffPaymentManager
      payments={payments}
      employees={employees}
      banks={banks}
      initialEmployeeId={initialEmployeeId}
      initialMonth={initialMonth}
      initialOpenForm={initialOpenForm}
      initialPayable={initialPayable}
      initialAmount={parsedInitialAmount}
      lockEmployee={!!initialEmployeeId}
    />
  );
}