"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, Plus } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";

import {
  createStaffPayment,
  deleteStaffPayment,
  fetchEmployeeSalaryPayable,
} from "@/lib/actions/staff-payment.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { EmployeeWithWorkshop } from "@/lib/queries/employee.queries";
import type { EmployeeSalaryPayable } from "@/lib/queries/salary.queries";
import type { StaffPaymentWithDetails } from "@/lib/queries/staff-payment.queries";
import { MaskedAmount } from "@/components/masked-amount";
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";
import type { ActionResult } from "@/lib/utils/action-result";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { cn } from "@punchless/ui/lib/utils";
import { CLIENT_PAYMENT_CONFIRM_THRESHOLD } from "@/lib/constants/payment-confirm";
import { toast } from "sonner";

type StaffPaymentVariant = "page" | "hub-embedded" | "hub-history" | "modal";

type CreateStaffPaymentResult = {
  paymentId: string;
  slipUrl: string | null;
};

interface Props {
  payments: StaffPaymentWithDetails[];
  employees: EmployeeWithWorkshop[];
  banks: BankWithBalance[];
  initialEmployeeId?: string;
  initialMonth?: string;
  initialOpenForm?: boolean;
  initialPayable?: EmployeeSalaryPayable | null;
  initialAmount?: number;
  lockEmployee?: boolean;
  variant?: StaffPaymentVariant;
  showHistory?: boolean;
  returnPath?: string;
  showAllLinkHref?: string;
  onFormClose?: () => void;
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

const typeLabels: Record<string, string> = {
  advance: "Advance",
  salary_paid: "Salary paid",
  deduction: "Deduction",
};

function currentMonthStr() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
}

export function StaffPaymentManager({
  payments,
  employees,
  banks,
  initialEmployeeId = "",
  initialMonth = currentMonthStr(),
  initialOpenForm = false,
  initialPayable = null,
  initialAmount,
  lockEmployee = false,
  variant = "page",
  showHistory = true,
  returnPath,
  showAllLinkHref = "/dashboard/salary/payments",
  onFormClose,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(initialOpenForm);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId);
  const [salaryMonth, setSalaryMonth] = useState(initialMonth);
  const [paymentType, setPaymentType] = useState<
    "advance" | "salary_paid" | "deduction"
  >(initialEmployeeId ? "salary_paid" : "salary_paid");
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");
  const [amount, setAmount] = useState(() => {
    if (initialAmount != null && initialAmount > 0) return String(initialAmount);
    if (initialPayable && initialPayable.suggestedAmount > 0) {
      return String(initialPayable.suggestedAmount);
    }
    return "";
  });
  const [remark, setRemark] = useState("");
  const [payable, setPayable] = useState<EmployeeSalaryPayable | null>(initialPayable);
  const [loadingPayable, setLoadingPayable] = useState(false);
  const [amountTouched, setAmountTouched] = useState(false);
  const [confirmPayOpen, setConfirmPayOpen] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const [historyEmployeeFilter, setHistoryEmployeeFilter] = useState(
    variant === "hub-history" ? initialEmployeeId : ""
  );

  useEffect(() => {
    if (variant === "hub-history") {
      setHistoryEmployeeFilter(initialEmployeeId);
    }
  }, [initialEmployeeId, variant]);

  const filterEmployeeId =
    variant === "hub-history"
      ? historyEmployeeFilter || undefined
      : initialEmployeeId || undefined;
  const filterEmployeeName = employees.find((e) => e.id === filterEmployeeId)?.full_name;

  const visiblePayments = useMemo(() => {
    if (!filterEmployeeId) return payments;
    return payments.filter((p) => p.employee_id === filterEmployeeId);
  }, [payments, filterEmployeeId]);

  const summary = useMemo(() => {
    const paid = visiblePayments
      .filter((p) => p.payment_type !== "deduction")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const deductions = visiblePayments
      .filter((p) => p.payment_type === "deduction")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      totalPaid: Math.round(paid * 100) / 100,
      totalDeductions: Math.round(deductions * 100) / 100,
      count: visiblePayments.length,
    };
  }, [visiblePayments]);

  const loadPayable = useCallback(async (employeeId: string, month: string) => {
    setLoadingPayable(true);
    const result = await fetchEmployeeSalaryPayable(employeeId, month);
    setLoadingPayable(false);

    if (!result.success) {
      setPayable(null);
      return;
    }

    setPayable(result.data);
    if (!amountTouched) {
      setAmount(
        result.data.suggestedAmount > 0 ? String(result.data.suggestedAmount) : ""
      );
    }
  }, [amountTouched]);

  useEffect(() => {
    if (paymentType !== "salary_paid" || !selectedEmployeeId) {
      setPayable(null);
      return;
    }

    void loadPayable(selectedEmployeeId, salaryMonth);
  }, [selectedEmployeeId, salaryMonth, paymentType, loadPayable]);

  const enteredAmount = Number(amount) || 0;
  const overpayAmount =
    paymentType === "salary_paid" &&
    payable &&
    payable.suggestedAmount > 0 &&
    enteredAmount > payable.suggestedAmount + 0.009
      ? Math.round((enteredAmount - payable.suggestedAmount) * 100) / 100
      : 0;

  const salaryNothingDue =
    paymentType === "salary_paid" && payable != null && payable.suggestedAmount <= 0;

  const { execute: execCreate, loading: creating } = useAction<
    FormData,
    CreateStaffPaymentResult
  >(
    createStaffPayment as (
      input: FormData
    ) => Promise<ActionResult<CreateStaffPaymentResult>>,
    {
    successMessage: "Staff payment recorded!",
    onSuccess: (data) => {
      setShowForm(false);
      setSelectedEmployeeId("");
      setSalaryMonth(currentMonthStr());
      setPaymentType("salary_paid");
      setPaymentMode("cash");
      setAmount("");
      setRemark("");
      setPayable(null);
      setAmountTouched(false);
      onFormClose?.();
      if (data?.slipUrl) {
        window.open(data.slipUrl, "_blank", "noopener,noreferrer");
      }
      if (returnPath) {
        router.replace(returnPath);
      }
      router.refresh();
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteStaffPayment, {
    successMessage: "Payment deleted",
    onSuccess: () => router.refresh(),
  });

  const needsPaymentMode = paymentType !== "deduction";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    if (salaryNothingDue) {
      toast.error(
        payable?.overAdvanced
          ? "Nothing due — employee is over-advanced this month."
          : "Nothing due — salary already paid or no earnings this month."
      );
      return;
    }

    if (overpayAmount > 0 && !remark.trim()) {
      toast.error("Add a remark explaining the extra amount.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.set("employeeId", selectedEmployeeId);
    formData.set("paymentType", paymentType);
    formData.set("amount", amount);
    formData.set("remark", remark);
    if (paymentType === "salary_paid" && salaryMonth) {
      formData.set("salaryMonth", salaryMonth);
    }
    if (needsPaymentMode) {
      formData.set("paymentMode", paymentMode);
    }

    const amountNum = parseFloat(amount) || 0;
    const needsConfirm =
      paymentType === "salary_paid" || amountNum >= CLIENT_PAYMENT_CONFIRM_THRESHOLD;

    if (needsConfirm) {
      setPendingFormData(formData);
      setConfirmPayOpen(true);
      return;
    }

    await execCreate(formData);
  }

  async function confirmPayment() {
    if (!pendingFormData) return;
    await execCreate(pendingFormData);
    setConfirmPayOpen(false);
    setPendingFormData(null);
  }

  function handleEmployeeChange(employeeId: string) {
    setSelectedEmployeeId(employeeId);
    setAmountTouched(false);
  }

  function handlePaymentTypeChange(type: "advance" | "salary_paid" | "deduction") {
    setPaymentType(type);
    setAmountTouched(false);
    if (type !== "salary_paid") {
      setAmount("");
      setPayable(null);
    }
  }

  function handleSalaryMonthChange(month: string) {
    setSalaryMonth(month);
    setAmountTouched(false);
  }

  const selectedEmployeeName =
    employees.find((e) => e.id === selectedEmployeeId)?.full_name ??
    payable?.employeeName;

  const showPageHeader = variant === "page";
  const showSummaryCards = variant !== "hub-embedded" && variant !== "modal";
  const isModal = variant === "modal";

  return (
    <div className="space-y-6">
      {showPageHeader ? (
        <PageHeader
          title={filterEmployeeName ? `Payments — ${filterEmployeeName}` : "Staff Payments"}
          description={
            filterEmployeeName
              ? `Payment history and new entries for ${filterEmployeeName}. Cash/bank payouts also appear in Income & Expense.`
              : "Record advances, salary paid, and deductions. Cash/bank payouts also appear in Income & Expense."
          }
        >
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" /> New Payment
          </Button>
        </PageHeader>
      ) : variant === "hub-history" ? (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-[200px] flex-1 space-y-3 sm:max-w-xs">
            <div>
              <h2 className="text-lg font-semibold">Payment history</h2>
              <p className="text-sm text-muted-foreground">
                All payouts — filter by employee or re-print salary slips.
              </p>
            </div>
            <div>
              <label htmlFor="historyEmployee" className="mb-1 block text-sm font-medium">
                Employee
              </label>
              <select
                id="historyEmployee"
                value={historyEmployeeFilter}
                onChange={(e) => setHistoryEmployeeFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">All employees</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="size-4" /> New payment
          </Button>
        </div>
      ) : null}

      {showSummaryCards ? (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total paid out"
          value={<MaskedAmount amount={summary.totalPaid} />}
        />
        <SummaryCard
          label="Total deductions"
          value={<MaskedAmount amount={summary.totalDeductions} />}
        />
        <SummaryCard label="Entries" value={String(summary.count)} />
      </div>
      ) : null}

      {showForm ? (
        <div className={isModal ? "space-y-4" : "rounded-xl border border-border bg-card p-5"}>
          {variant !== "hub-embedded" && !isModal ? (
            <h2 className="mb-4 text-lg font-semibold">
              {lockEmployee && selectedEmployeeName
                ? `Pay ${selectedEmployeeName}`
                : "New Staff Payment"}
            </h2>
          ) : null}
          <form
            onSubmit={handleSubmit}
            className={cn(
              "grid grid-cols-1 gap-4",
              isModal ? "sm:grid-cols-2" : "md:grid-cols-2"
            )}
          >
            <fieldset disabled={creating} className="contents">
              <div>
                <label htmlFor="employeeId" className="mb-1 block text-sm font-medium">
                  Employee
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  required
                  disabled={lockEmployee}
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeChange(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
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
                    handlePaymentTypeChange(
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

              {paymentType === "salary_paid" ? (
                <div>
                  <label htmlFor="salaryMonth" className="mb-1 block text-sm font-medium">
                    Salary month
                  </label>
                  <input
                    id="salaryMonth"
                    type="month"
                    value={salaryMonth}
                    onChange={(e) => handleSalaryMonthChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  />
                </div>
              ) : null}

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
                  value={amount}
                  onChange={(e) => {
                    setAmountTouched(true);
                    setAmount(e.target.value);
                  }}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                />
                {loadingPayable ? (
                  <p className="mt-1 text-xs text-muted-foreground">Calculating due amount…</p>
                ) : null}
              </div>

              <Field label="Payment date" name="paymentDate" type="date" required defaultValue={defaultDate()} />

              {paymentType === "salary_paid" && payable ? (
                <div className="md:col-span-2 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
                  <p className="font-medium">
                    {formatMonthYear(salaryMonth)} salary — {payable.employeeName}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      ({payable.salaryMode === "fixed" ? "Fixed" : "Hourly"})
                    </span>
                  </p>
                  {payable.overAdvanced > 0 ? (
                    <p className="mt-2 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>
                        Over-advanced by {formatCurrency(payable.overAdvanced)} this month —
                        advances exceed earned salary. No payment is due.
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-muted-foreground">
                      {payable.salaryMode === "fixed" ? (
                        <>
                          {payable.fullDays} full · {payable.halfDays} half · {payable.absentDays}{" "}
                          absent · Earned {formatCurrency(payable.grossSalary)}
                        </>
                      ) : (
                        <>Earned {formatCurrency(payable.grossSalary)}</>
                      )}
                      {" "}− Advances {formatCurrency(payable.advanceDeduction)} − Already paid{" "}
                      {formatCurrency(payable.alreadyPaid)} ={" "}
                      <span className="font-medium text-foreground">
                        Pay this month {formatCurrency(payable.suggestedAmount)}
                      </span>
                    </p>
                  )}
                </div>
              ) : null}

              {overpayAmount > 0 ? (
                <div className="md:col-span-2 flex gap-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>
                    Paying {formatCurrency(enteredAmount)} — {formatCurrency(overpayAmount)} more
                    than calculated. Please add a remark explaining the extra.
                  </p>
                </div>
              ) : null}

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

              <div className="md:col-span-2">
                <label htmlFor="remark" className="mb-1 block text-sm font-medium">
                  Remark{overpayAmount > 0 ? " (required)" : ""}
                </label>
                <textarea
                  id="remark"
                  name="remark"
                  rows={2}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  placeholder={
                    overpayAmount > 0
                      ? "Explain why you are paying more than the calculated amount"
                      : "Optional note"
                  }
                />
              </div>

              <div className="flex justify-end gap-2 md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    onFormClose?.();
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={creating}
                  disabled={creating || salaryNothingDue}
                  title={
                    salaryNothingDue
                      ? payable?.overAdvanced
                        ? "Over-advanced — no salary payment due"
                        : "Nothing due to pay this month"
                      : undefined
                  }
                >
                  {isModal ? "Pay & print slip" : "Save"}
                </Button>
              </div>
            </fieldset>
          </form>
        </div>
      ) : null}

      {showHistory ? (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">
            {filterEmployeeName
              ? `Payments for ${filterEmployeeName}`
              : "All employee payments"}
          </h3>
          {filterEmployeeId ? (
            <Button variant="link" size="sm" className="h-auto px-0" asChild>
              <Link href={showAllLinkHref}>Show all employees</Link>
            </Button>
          ) : null}
        </div>
        <DataTable
          data={visiblePayments}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder={
            filterEmployeeName
              ? `Search ${filterEmployeeName}'s payments…`
              : "Search payments…"
          }
          searchFilter={(row, query) =>
            [row.employee_name, row.remark, row.payment_type, row.payment_mode]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          }
          emptyMessage={
            filterEmployeeName
              ? `No payments recorded for ${filterEmployeeName} yet.`
              : "No staff payments yet."
          }
          columns={[
            ...(!filterEmployeeId
              ? [
                  {
                    key: "employee",
                    header: "Employee",
                    cell: (row: StaffPaymentWithDetails) => (
                      <span className="font-medium">{row.employee_name}</span>
                    ),
                  },
                ]
              : []),
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
              key: "month",
              header: "Salary month",
              cell: (row) =>
                row.salary_month ? formatMonthYear(row.salary_month) : "—",
            },
            {
              key: "remark",
              header: "Remark",
              cell: (row) => row.remark ?? "—",
            },
            {
              key: "slip",
              header: "Slip",
              cell: (row) =>
                row.slip_snapshot ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/salary/payments/${row.id}/slip`} target="_blank">
                      <FileText className="size-4" />
                      Print
                    </Link>
                  </Button>
                ) : (
                  "—"
                ),
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
      ) : null}

      <ConfirmModal
        open={confirmPayOpen}
        onOpenChange={setConfirmPayOpen}
        title="Confirm staff payment"
        description={
          selectedEmployeeName
            ? `Pay ${formatCurrency(parseFloat(amount) || 0)} to ${selectedEmployeeName} (${typeLabels[paymentType] ?? paymentType})?`
            : undefined
        }
        confirmText="Confirm payment"
        onConfirm={() => void confirmPayment()}
        loading={creating}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
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