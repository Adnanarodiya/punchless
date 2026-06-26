"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";

import {
  createSalaryDeposit,
  deleteSalaryDeposit,
} from "@/lib/actions/staff-payment.actions";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { SalaryDepositWithDetails } from "@/lib/queries/staff-payment.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

interface Props {
  deposits: SalaryDepositWithDetails[];
  employees: EmployeeWithWorkshop[];
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

export function SalaryDepositManager({ deposits, employees }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const contractSalary = selectedEmployee?.monthly_salary ?? 0;

  const totalDeposited = useMemo(
    () =>
      Math.round(
        deposits.reduce((sum, row) => sum + Number(row.amount), 0) * 100
      ) / 100,
    [deposits]
  );

  const { execute: execCreate, loading: creating } = useAction(createSalaryDeposit, {
    successMessage: "Salary deposit recorded!",
    onSuccess: () => {
      setShowForm(false);
      setSelectedEmployeeId("");
      setDepositAmount("");
      router.refresh();
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteSalaryDeposit, {
    successMessage: "Deposit deleted",
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salary Deposits"
        description="Accrue salary owed to staff (no cash movement). Use Staff Payments when you actually pay out."
      >
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> New Deposit
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard label="Total deposited" value={formatCurrency(totalDeposited)} />
        <SummaryCard label="Entries" value={String(deposits.length)} />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground space-y-2">
        <p>
          <span className="font-medium text-foreground">Auto-sync:</span> when you create or
          edit an employee&apos;s monthly salary, this page updates the{" "}
          <span className="font-medium text-foreground">current month</span> deposit automatically
          (e.g. change Omer to ₹38,000 → June row becomes ₹38,000).
        </p>
        <p>
          Use <span className="font-medium text-foreground">New Deposit</span> only for extra
          months, bonuses, or adjustments.{" "}
          <span className="font-medium text-foreground">Payment</span> is when you pay cash/bank.
        </p>
      </div>

      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">New Salary Deposit</h2>
          <form action={execCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="employeeId" className="mb-1 block text-sm font-medium">
                Employee
              </label>
              <select
                id="employeeId"
                name="employeeId"
                required
                value={selectedEmployeeId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedEmployeeId(id);
                  const emp = employees.find((row) => row.id === id);
                  setDepositAmount(
                    emp?.monthly_salary && emp.monthly_salary > 0
                      ? String(emp.monthly_salary)
                      : ""
                  );
                }}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select employee
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                    {emp.monthly_salary
                      ? ` — ${formatCurrency(emp.monthly_salary)}/mo`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="amount" className="mb-1 block text-sm font-medium">
                Amount (₹)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder={selectedEmployeeId ? "From contract salary" : "Select employee first"}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
              {selectedEmployeeId && contractSalary > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Prefilled from contract salary {formatCurrency(contractSalary)}/month — edit if this month differs.
                </p>
              ) : selectedEmployeeId ? (
                <p className="mt-1 text-xs text-warning">
                  No monthly salary on file — set it on Employees or enter amount manually.
                </p>
              ) : null}
            </div>
            <Field label="Date" name="depositDate" type="date" required defaultValue={defaultDate()} />
            <Field label="Remark" name="remark" className="md:col-span-2" />
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" loading={creating} disabled={creating}>Save</Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={deposits}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search deposits…"
          searchFilter={(row, query) =>
            [row.employee_name, row.remark]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          }
          emptyMessage="No salary deposits yet."
          columns={[
            {
              key: "employee",
              header: "Employee",
              cell: (row) => <span className="font-medium">{row.employee_name}</span>,
            },
            {
              key: "amount",
              header: "Amount",
              cell: (row) => formatCurrency(row.amount),
            },
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.deposit_date),
            },
            {
              key: "remark",
              header: "Remark",
              cell: (row) => row.remark ?? "—",
            },
            {
              key: "actions",
              header: "",
              cell: (row) => (
                <DeleteConfirmButton
                  entityName={`${row.employee_name} — ${formatCurrency(row.amount)}`}
                  entityType="deposit"
                  loading={deleting}
                  onConfirm={async () => {
                    const fd = new FormData();
                    fd.set("depositId", row.id);
                    await execDelete(fd);
                  }}
                />
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

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  min,
  step,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: string;
  step?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        min={min}
        step={step}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
      />
    </div>
  );
}