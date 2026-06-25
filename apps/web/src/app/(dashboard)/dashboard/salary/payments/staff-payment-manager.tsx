"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@punchless/ui/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";

import {
  createStaffPayment,
  deleteStaffPayment,
} from "@/lib/actions/staff-payment.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { StaffPaymentWithDetails } from "@/lib/queries/staff-payment.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

interface Props {
  payments: StaffPaymentWithDetails[];
  employees: EmployeeWithWorkshop[];
  banks: BankWithBalance[];
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

const typeLabels: Record<string, string> = {
  advance: "Advance",
  salary_paid: "Salary paid",
  deduction: "Deduction",
};

export function StaffPaymentManager({ payments, employees, banks }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [paymentType, setPaymentType] = useState<
    "advance" | "salary_paid" | "deduction"
  >("salary_paid");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");

  const summary = useMemo(() => {
    const paid = payments
      .filter((p) => p.payment_type !== "deduction")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const deductions = payments
      .filter((p) => p.payment_type === "deduction")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalPaid: Math.round(paid * 100) / 100,
      totalDeductions: Math.round(deductions * 100) / 100,
      count: payments.length,
    };
  }, [payments]);

  const { execute: execCreate, loading: creating } = useAction(createStaffPayment, {
    successMessage: "Staff payment recorded!",
    onSuccess: () => {
      setShowForm(false);
      setPaymentType("salary_paid");
      setPaymentMode("cash");
      router.refresh();
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteStaffPayment, {
    successMessage: "Payment deleted",
    onSuccess: () => router.refresh(),
  });

  const needsPaymentMode = paymentType !== "deduction";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Payments"
        description="Record advances, salary paid, and deductions. Cash/bank payouts also appear in Income & Expense."
      >
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> New Payment
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total paid out" value={formatCurrency(summary.totalPaid)} />
        <SummaryCard label="Total deductions" value={formatCurrency(summary.totalDeductions)} />
        <SummaryCard label="Entries" value={String(summary.count)} />
      </div>

      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">New Staff Payment</h2>
          <form action={execCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="employeeId" className="mb-1 block text-sm font-medium">
                Employee
              </label>
              <select
                id="employeeId"
                name="employeeId"
                required
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="" disabled>
                  Select employee
                </option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="paymentType" className="mb-1 block text-sm font-medium">
                Type
              </label>
              <select
                id="paymentType"
                name="paymentType"
                required
                value={paymentType}
                onChange={(e) =>
                  setPaymentType(
                    e.target.value as "advance" | "salary_paid" | "deduction"
                  )
                }
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="advance">Advance</option>
                <option value="salary_paid">Salary paid</option>
                <option value="deduction">Deduction</option>
              </select>
            </div>
            <Field label="Amount (₹)" name="amount" type="number" min="0.01" step="0.01" required />
            <Field label="Date" name="paymentDate" type="date" required defaultValue={defaultDate()} />
            {needsPaymentMode ? (
              <div>
                <label htmlFor="paymentMode" className="mb-1 block text-sm font-medium">
                  Payment mode
                </label>
                <select
                  id="paymentMode"
                  name="paymentMode"
                  required
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as "cash" | "bank")}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
            ) : (
              <input type="hidden" name="paymentMode" value="" />
            )}
            {needsPaymentMode && paymentMode === "bank" ? (
              <div>
                <label htmlFor="bankId" className="mb-1 block text-sm font-medium">
                  Bank
                </label>
                <select
                  id="bankId"
                  name="bankId"
                  required
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="" disabled>
                    Select bank
                  </option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bank_name} — {bank.account_name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input type="hidden" name="bankId" value="" />
            )}
            <Field label="Remark" name="remark" className="md:col-span-2" />
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" loading={creating} disabled={creating}>Save</Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={payments}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search payments…"
          searchFilter={(row, query) =>
            [row.employee_name, row.remark, row.payment_type, row.payment_mode]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          }
          emptyMessage="No staff payments yet."
          columns={[
            {
              key: "employee",
              header: "Employee",
              cell: (row) => <span className="font-medium">{row.employee_name}</span>,
            },
            {
              key: "type",
              header: "Type",
              cell: (row) => typeLabels[row.payment_type] ?? row.payment_type,
            },
            {
              key: "amount",
              header: "Amount",
              cell: (row) => formatCurrency(row.amount),
            },
            {
              key: "mode",
              header: "Mode",
              cell: (row) =>
                row.payment_mode ? (
                  <span className="capitalize">{row.payment_mode}</span>
                ) : (
                  "—"
                ),
            },
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.payment_date),
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
                  entityType="payment"
                  loading={deleting}
                  onConfirm={async () => {
                    const fd = new FormData();
                    fd.set("paymentId", row.id);
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