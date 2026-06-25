import { getEmployees } from "@/lib/queries/employee.queries";
import { getSalaryDeposits } from "@/lib/queries/staff-payment.queries";
import { SalaryDepositManager } from "./salary-deposit-manager";

export default async function SalaryDepositsPage() {
  const [deposits, employees] = await Promise.all([
    getSalaryDeposits(),
    getEmployees(),
  ]);

  return <SalaryDepositManager deposits={deposits} employees={employees} />;
}