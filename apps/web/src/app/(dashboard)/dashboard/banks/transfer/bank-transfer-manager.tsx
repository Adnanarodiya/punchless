"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { DataTable } from "@punchless/ui/components/data-table";
import { PageHeader } from "@punchless/ui/components/page-header";

import { recordBankTransfer } from "@/lib/actions/bank.actions";
import type {
  BankTransferWithDetails,
  BankWithBalance,
} from "@/lib/queries/bank.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { useAction } from "@/hooks/use-action";

interface Props {
  banks: BankWithBalance[];
  transfers: BankTransferWithDetails[];
}

const defaultDate = () => new Date().toISOString().slice(0, 10);

export function BankTransferManager({ banks, transfers }: Props) {
  const { execute, loading } = useAction(recordBankTransfer, {
    successMessage: "Bank transfer recorded!",
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
          { label: "Transfer" },
        ]}
      />

      <PageHeader
        title="Bank Transfer"
        description="Move funds between bank accounts."
      >
        <Button variant="outline" asChild>
          <Link href="/dashboard/banks">
            <ArrowLeft className="size-4" /> Back to Banks
          </Link>
        </Button>
      </PageHeader>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-lg font-semibold">New Transfer</h2>
        <form action={execute} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="fromBankId" className="mb-1 block text-sm font-medium">From Bank</label>
            <select id="fromBankId" name="fromBankId" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="" disabled>From bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name} — {formatCurrency(bank.current_balance)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="toBankId" className="mb-1 block text-sm font-medium">To Bank</label>
            <select id="toBankId" name="toBankId" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="" disabled>To bank</option>
              {banks.map((bank) => (
                <option key={bank.id} value={bank.id}>
                  {bank.bank_name} — {bank.account_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="mb-1 block text-sm font-medium">Amount (₹)</label>
            <input id="amount" name="amount" type="number" min="0.01" step="0.01" required className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div>
            <label htmlFor="transferDate" className="mb-1 block text-sm font-medium">Date</label>
            <input id="transferDate" name="transferDate" type="date" required defaultValue={defaultDate()} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="remark" className="mb-1 block text-sm font-medium">Remark</label>
            <input id="remark" name="remark" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading || banks.length < 2}>
              Transfer Funds
            </Button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <DataTable
          data={transfers}
          getRowKey={(row) => row.id}
          emptyMessage="No bank transfers yet."
          columns={[
            { key: "from", header: "From", cell: (row) => row.from_bank_name },
            { key: "to", header: "To", cell: (row) => row.to_bank_name },
            {
              key: "amount",
              header: "Amount",
              cell: (row) => formatCurrency(row.amount),
            },
            {
              key: "date",
              header: "Date",
              cell: (row) => formatDate(row.transfer_date),
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