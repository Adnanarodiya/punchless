import { getBanks } from "@/lib/queries/bank.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { getEmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import { getStaffPayments } from "@/lib/queries/staff-payment.queries";
import { StaffPaymentManager } from "./staff-payment-manager";

interface Props {
  searchParams: Promise<{
    employee?: string;
    month?: string;
    openForm?: string;
  }>;
}

function currentMonthStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export default async function StaffPaymentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialEmployeeId = params.employee?.trim() || undefined;
  const initialMonth = params.month?.trim() || currentMonthStr();
  const initialOpenForm = params.openForm === "1" || !!initialEmployeeId;

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
      lockEmployee={!!initialEmployeeId}
    />
  );
}