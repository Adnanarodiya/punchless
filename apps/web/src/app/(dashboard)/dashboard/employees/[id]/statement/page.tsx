import { notFound } from "next/navigation";

import { getEmployeeById } from "@/lib/queries/employee.queries";
import {
  getEmployeeSalaryBalance,
  getEmployeeSalarySlips,
  getEmployeeStatement,
} from "@/lib/queries/staff-payment.queries";

import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";

import { EmployeeStatementManager } from "./statement-manager";

export default async function EmployeeStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const defaults = defaultStatementDateRange();
  const startDate = query.start || defaults.start;
  const endDate = query.end || defaults.end;

  const employee = await getEmployeeById(id);
  if (!employee) notFound();

  const [statement, salaryBalance, salarySlips] = await Promise.all([
    getEmployeeStatement(id, startDate, endDate),
    getEmployeeSalaryBalance(id),
    getEmployeeSalarySlips(id, startDate, endDate),
  ]);

  return (
    <EmployeeStatementManager
      employee={employee}
      startDate={startDate}
      endDate={endDate}
      openingBalance={statement.openingBalance}
      closingBalance={statement.closingBalance}
      salaryBalance={salaryBalance}
      lines={statement.lines}
      salarySlips={salarySlips}
    />
  );
}