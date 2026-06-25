"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { DataTable } from "@punchless/ui/components/data-table";
import { PageHeader } from "@punchless/ui/components/page-header";

import { recordBankTransaction } from "@/lib/actions/bank.actions";
import type {
  BankTransactionWithDetails,
  BankWithBalance,
} from "@/lib/queries/bank.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";

interface Props {
  banks: BankWithBalance[];
  transactions: BankTransactionWithDetails[];
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

export function BankTransactionsManager({ banks, transactions }: Props) {
  const { execute, loading } = useAction(recordBankTransaction, {
    successMessage: "Bank transaction recorded!",
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs
        linkComponent={({ href, children, className }) => (
          <Link href={href} className={className}>{children}</Link>
        )}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Banks", href: "/dashboard/banks" },
          { label: "Transactions" },
        ]}
      />

      <PageHeader
        title="Bank Transactions"
        description="Record deposits and withdrawals against bank accounts."
      >
        <Button variant="outline" asChild>
          <Link href="/dashboard/banks">
            <ArrowLeft className="size-4" /> Back to Banks
          </Link>
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">New Transaction</h2>
        <form action={execute} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div>
            <label htmlFor="transactionType" className="mb-1 block text-sm font-medium">Type</label>
            <select id="transactionType" name="transactionType" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="mb-1 block text-sm font-medium">Amount (₹)</label>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="transactionDate" className="mb-1 block text-sm font-medium">Date</label>
            <input id="transactionDate" name="transactionDate" type="date" required defaultValue={defaultDate()} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="remark" className="mb-1 block text-sm font-medium">Remark</label>
            <input id="remark" name="remark" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading || banks.length === 0}>
              Save Transaction
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={transactions}
          getRowKey={(row) => row.id}
          emptyMessage="No bank transactions yet."
          columns={[
            { key: "bank", header: "Bank", cell: (row) => row.bank_name },
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
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.transaction_date),
            },
            { key: "remark", header: "Remark", cell: (row) => row.remark || "—" },
            {
              key: "user",
              header: "User",
              cell: (row) => row.created_by_name || "—",
            },
          ]}
        />
      </div>
    </div>
  );
}