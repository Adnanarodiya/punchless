import { getBanks } from "@/lib/queries/bank.queries";
import { getEmployees } from "@/lib/queries/employee.queries";
import { getStaffPayments } from "@/lib/queries/staff-payment.queries";
import { StaffPaymentManager } from "./staff-payment-manager";

export default async function StaffPaymentsPage() {
  const [payments, employees, banks] = await Promise.all([
    getStaffPayments(),
    getEmployees(),
    getBanks(),
  ]);

  return (
    <StaffPaymentManager
      payments={payments}
      employees={employees}
      banks={banks}
    />
  );
}