import { notFound } from "next/navigation";

import { StaffStatementPrintDocument } from "@/components/staff-statement-print-document";
import { getEmployeeById } from "@/lib/queries/employee.queries";
import {
  getEmployeeSalarySlips,
  getEmployeeStatement,
} from "@/lib/queries/staff-payment.queries";
import { getCompanyProfile } from "@/lib/queries/settings.queries";

import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";

import { PrintActions } from "./print-actions";

export default async function EmployeeStatementPrintPage({
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

  const [employee, company, statement, salarySlips] = await Promise.all([
    getEmployeeById(id),
    getCompanyProfile(),
    getEmployeeStatement(id, startDate, endDate),
    getEmployeeSalarySlips(id, startDate, endDate),
  ]);

  if (!employee || !company) notFound();

  return (
    <div className="pb-8">
      <PrintActions
        backHref={`/dashboard/employees/${employee.id}/statement?start=${startDate}&end=${endDate}`}
      />
      <StaffStatementPrintDocument
        company={company}
        employeeName={employee.full_name}
        workshopName={employee.workshop_name}
        startDate={startDate}
        endDate={endDate}
        openingBalance={statement.openingBalance}
        closingBalance={statement.closingBalance}
        lines={statement.lines}
        salarySlips={salarySlips}
      />
    </div>
  );
}