import { notFound } from "next/navigation";

import { getEmployeeById } from "@/lib/queries/employee.queries";
import {
  getEmployeeSalaryBalance,
  getEmployeeStatement,
} from "@/lib/queries/staff-payment.queries";

import { EmployeeStatementManager } from "./statement-manager";

function defaultDateRange() {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: today.toISOString().slice(0, 10),
  };
}

export default async function EmployeeStatementPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const defaults = defaultDateRange();
  const startDate = query.start || defaults.start;
  const endDate = query.end || defaults.end;

  const employee = await getEmployeeById(id);
  if (!employee) notFound();

  const [statement, salaryBalance] = await Promise.all([
    getEmployeeStatement(id, startDate, endDate),
    getEmployeeSalaryBalance(id),
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
    />
  );
}