"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { Button } from "@punchless/ui/components/button";

import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type {
  EmployeeSalarySlipRecord,
  StaffStatementLine,
} from "@/lib/queries/staff-payment.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";
import {
  formatStaffLedgerTotal,
  staffLedgerSummaryHint,
  staffPaymentInPeriod,
  staffStatementTypeLabel,
} from "@/lib/utils/staff-statement-display";

interface Props {
  employee: EmployeeWithWorkshop;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  salaryBalance: number;
  lines: StaffStatementLine[];
  salarySlips: EmployeeSalarySlipRecord[];
}

export function EmployeeStatementManager({
  employee,
  startDate,
  endDate,
  openingBalance,
  closingBalance,
  salaryBalance,
  lines,
  salarySlips,
}: Props) {
  const router = useRouter();
  const paidInPeriod = staffPaymentInPeriod(openingBalance, closingBalance);

  function handleFilter(formData: FormData) {
    const start = String(formData.get("startDate") || "");
    const end = String(formData.get("endDate") || "");
    router.push(
      `/dashboard/employees/${employee.id}/statement?start=${start}&end=${end}`
    );
  }

  const slipByPaymentId = new Map(
    salarySlips.map((slip) => [slip.paymentId, slip])
  );

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
        description="Money you paid this staff — salary, advance (Upad), and deposits. Click View proof for month-wise breakdown."
      >
        <Button variant="outline" asChild>
          <Link
            href={`/dashboard/employees/${employee.id}/statement/print?start=${startDate}&end=${endDate}`}
            target="_blank"
          >
            Print full proof PDF
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Paid before this period"
          value={formatStaffLedgerTotal(openingBalance)}
          hint={
            openingBalance === 0
              ? "Nothing recorded before start date"
              : staffLedgerSummaryHint(openingBalance)
          }
        />
        <SummaryCard
          label="Paid in this period"
          value={formatCurrency(paidInPeriod)}
          hint="Salary + advance in selected dates"
        />
        <SummaryCard
          label="Total paid (all time)"
          value={formatStaffLedgerTotal(salaryBalance)}
          hint={staffLedgerSummaryHint(salaryBalance)}
        />
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
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const { start, end } = defaultStatementDateRange();
            router.push(
              `/dashboard/employees/${employee.id}/statement?start=${start}&end=${end}`
            );
          }}
        >
          Last 6 months
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-lg font-semibold">Payment history</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Each row is money you paid or advance you gave. Running total shows cumulative paid
          to staff.
        </p>
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
              cell: (row) => staffStatementTypeLabel(row.reference_type),
            },
            {
              key: "remark",
              header: "Remark",
              cell: (row) => row.remark ?? "—",
            },
            {
              key: "paid",
              header: "You paid",
              cell: (row) =>
                row.debit > 0 ? formatCurrency(row.debit) : "—",
            },
            {
              key: "deposit",
              header: "Salary owed",
              cell: (row) =>
                row.credit > 0 ? formatCurrency(row.credit) : "—",
            },
            {
              key: "balance",
              header: "Total paid so far",
              cell: (row) => (
                <span className="font-medium">
                  {formatStaffLedgerTotal(row.balance)}
                </span>
              ),
            },
            {
              key: "proof",
              header: "Proof",
              cell: (row) => {
                if (
                  row.reference_type !== "staff_payment" ||
                  !row.reference_id
                ) {
                  return "—";
                }
                const slip = slipByPaymentId.get(row.reference_id);
                if (!slip) {
                  return (
                    <span className="text-xs text-muted-foreground">No slip saved</span>
                  );
                }
                return (
                  <Link
                    href={`/dashboard/salary/payments/${row.reference_id}/slip`}
                    target="_blank"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View proof
                  </Link>
                );
              },
            },
          ]}
        />
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}