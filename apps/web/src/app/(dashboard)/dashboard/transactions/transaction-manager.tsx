"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";

import { createTransaction, deleteTransaction } from "@/lib/actions/transaction.actions";
import type { BankWithBalance } from "@/lib/queries/bank.queries";
import type { TransactionWithDetails } from "@/lib/queries/transaction.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";
import { DeleteConfirmButton } from "@/components/delete-confirm-button";

interface Props {
  transactions: TransactionWithDetails[];
  banks: BankWithBalance[];
}

function parseAmount(value: unknown): number {
  const parsed = typeof value === "string" ? parseFloat(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

export function TransactionManager({
  transactions,
  banks,
}: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [paymentMode, setPaymentMode] = useState<"cash" | "bank">("cash");

  const summary = useMemo(() => {
    const sumByTypeAndMode = (
      type: "income" | "expense",
      mode: "cash" | "bank"
    ) =>
      transactions
        .filter(
          (row) =>
            row.transaction_type === type && row.payment_mode === mode
        )
        .reduce((sum, row) => sum + parseAmount(row.amount), 0);

    const cashIncome = sumByTypeAndMode("income", "cash");
    const bankIncome = sumByTypeAndMode("income", "bank");
    const cashExpense = sumByTypeAndMode("expense", "cash");
    const bankExpense = sumByTypeAndMode("expense", "bank");
    const totalIncome = cashIncome + bankIncome;
    const totalExpense = cashExpense + bankExpense;

    return {
      cashIncome: Math.round(cashIncome * 100) / 100,
      bankIncome: Math.round(bankIncome * 100) / 100,
      cashExpense: Math.round(cashExpense * 100) / 100,
      bankExpense: Math.round(bankExpense * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
    };
  }, [transactions]);

  const { execute: execCreate, loading: creating } = useAction(createTransaction, {
    successMessage: "Transaction recorded!",
    onSuccess: () => {
      setShowForm(false);
      setPaymentMode("cash");
      router.refresh();
    },
  });

  const { execute: execDelete, loading: deleting } = useAction(deleteTransaction, {
    successMessage: "Entry deleted",
    onSuccess: () => router.refresh(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income & Expense"
        description="Business income vs expense (Rojmel-style). Not the same as bank balance — see Finance → Banks for Kotak/HDFC."
      >
        <Button onClick={() => setShowForm(true)}>
          <Plus className="size-4" /> New Entry
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Total Income"
          value={formatCurrency(summary.totalIncome)}
          hint={`Cash ${formatCurrency(summary.cashIncome)} · Bank ${formatCurrency(summary.bankIncome)}`}
        />
        <SummaryCard
          label="Total Expense"
          value={formatCurrency(summary.totalExpense)}
          hint={`Cash ${formatCurrency(summary.cashExpense)} · Bank ${formatCurrency(summary.bankExpense)}`}
        />
        <SummaryCard
          label="Net (Income − Expense)"
          value={formatNetAmount(summary.netBalance)}
          hint="Business result only — bank balance is on Banks page"
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">How to read this page:</span>{" "}
          Every row counts as income or expense for your business, whether paid by{" "}
          <span className="font-medium text-foreground">cash</span> or{" "}
          <span className="font-medium text-foreground">bank</span>.
          Bank expenses also reduce the bank account on{" "}
          <span className="font-medium text-foreground">Finance → Banks</span> — that is a
          separate view, not double charging.
        </p>
        <p className="mt-2">
          Example: only ₹3,500 cash expense → Net ={" "}
          <span className="font-medium text-foreground">−₹3,500</span>. Add ₹12,000 bank
          expense → Net ={" "}
          <span className="font-medium text-foreground">−₹15,500</span> here, and Kotak
          balance drops ₹12,000 on Banks.
        </p>
      </div>

      {showForm ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 text-lg font-semibold">New Income / Expense</h2>
          <form action={execCreate} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Particular" name="particular" required />
            <Field label="Amount (₹)" name="amount" type="number" min="0.01" step="0.01" required />
            <div>
              <label htmlFor="transactionType" className="mb-1 block text-sm font-medium">Type</label>
              <select id="transactionType" name="transactionType" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label htmlFor="paymentMode" className="mb-1 block text-sm font-medium">Payment Mode</label>
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
            {paymentMode === "bank" ? (
              <div>
                <label htmlFor="bankId" className="mb-1 block text-sm font-medium">Bank</label>
                <select id="bankId" name="bankId" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                  <option value="" disabled>Select bank</option>
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
            <Field label="Date" name="transactionDate" type="date" required defaultValue={defaultDate()} />
            <Field label="Remark" name="remark" className="md:col-span-2" />
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" loading={creating} disabled={creating}>Save Entry</Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={transactions}
          getRowKey={(row) => row.id}
          enableSearch
          searchPlaceholder="Search transactions…"
          searchFilter={(row, query) =>
            [row.particular, row.remark, row.transaction_type, row.payment_mode]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(query)
          }
          emptyMessage="No income or expense entries yet."
          columns={[
            {
              key: "particular",
              header: "Particular",
              cell: (row) => <span className="font-medium">{row.particular}</span>,
            },
            {
              key: "type",
              header: "Type",
              cell: (row) => (
                <span className="capitalize">{row.transaction_type}</span>
              ),
            },
            {
              key: "amount",
              header: "Amount",
              cell: (row) => formatCurrency(row.amount),
            },
            {
              key: "mode",
              header: "Mode",
              cell: (row) => (
                <span className="capitalize">
                  {row.payment_mode}
                  {row.bank_name ? ` · ${row.bank_name}` : ""}
                </span>
              ),
            },
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.transaction_date),
            },
            { key: "remark", header: "Remark", cell: (row) => row.remark || "—" },
            {
              key: "actions",
              header: "Actions",
              cell: (row) => (
                <DeleteConfirmButton
                  entityName={row.particular}
                  entityType="entry"
                  size="sm"
                  loading={deleting}
                  onConfirm={async () => {
                    const fd = new FormData();
                    fd.set("transactionId", row.id);
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
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
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

function formatNetAmount(amount: number) {
  if (amount < 0) {
    return `−${formatCurrency(Math.abs(amount))}`;
  }
  return formatCurrency(amount);
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
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}