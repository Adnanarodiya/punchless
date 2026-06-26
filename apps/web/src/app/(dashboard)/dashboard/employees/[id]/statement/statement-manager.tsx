"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { Button } from "@punchless/ui/components/button";

import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { StaffStatementLine } from "@/lib/queries/staff-payment.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

interface Props {
  employee: EmployeeWithWorkshop;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  salaryBalance: number;
  lines: StaffStatementLine[];
}

function referenceLabel(referenceType: string | null) {
  switch (referenceType) {
    case "salary_deposit":
      return "Salary deposit";
    case "staff_payment":
      return "Staff payment";
    case "advance":
      return "Advance (approved)";
    case "salary":
      return "Salary";
    default:
      return referenceType ?? "Entry";
  }
}

export function EmployeeStatementManager({
  employee,
  startDate,
  endDate,
  openingBalance,
  closingBalance,
  salaryBalance,
  lines,
}: Props) {
  const router = useRouter();

  function handleFilter(formData: FormData) {
    const start = String(formData.get("startDate") || "");
    const end = String(formData.get("endDate") || "");
    router.push(
      `/dashboard/employees/${employee.id}/statement?start=${start}&end=${end}`
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <Breadcrumbs
        linkComponent={({ href, children, className }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Employees", href: "/dashboard/employees" },
          { label: employee.full_name },
        ]}
      />

      <PageHeader
        title={`${employee.full_name} — Staff Statement`}
        description="Deposits, payments, advances, and deductions with running balance."
      >
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Opening Balance" value={formatBalance(openingBalance)} />
        <SummaryCard label="Closing Balance" value={formatBalance(closingBalance)} />
        <SummaryCard label="Current Balance" value={formatBalance(salaryBalance)} />
      </div>

      <form
        action={handleFilter}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 print:hidden"
      >
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
            Start Date
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={startDate}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-sm font-medium">
            End Date
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            defaultValue={endDate}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={lines}
          getRowKey={(row) => row.id}
          emptyMessage="No entries in this date range."
          columns={[
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.entry_date),
            },
            {
              key: "type",
              header: "Type",
              cell: (row) => referenceLabel(row.reference_type),
            },
            {
              key: "remark",
              header: "Remark",
              cell: (row) => row.remark ?? "—",
            },
            {
              key: "debit",
              header: "Debit",
              cell: (row) =>
                row.debit > 0 ? formatCurrency(row.debit) : "—",
            },
            {
              key: "credit",
              header: "Credit",
              cell: (row) =>
                row.credit > 0 ? formatCurrency(row.credit) : "—",
            },
            {
              key: "balance",
              header: "Balance",
              cell: (row) => (
                <span className="font-medium">{formatBalance(row.balance)}</span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatBalance(amount: number) {
  if (amount > 0) return `Cr ${formatCurrency(amount)}`;
  if (amount < 0) return `Dr ${formatCurrency(Math.abs(amount))}`;
  return formatCurrency(0);
}