"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { Button } from "@punchless/ui/components/button";

import type {
  BankStatementLine,
  BankWithBalance,
} from "@/lib/queries/bank.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { defaultStatementDateRange } from "@/lib/utils/statement-date-range";

interface Props {
  bank: BankWithBalance;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  lines: BankStatementLine[];
}

function referenceLabel(referenceType: string | null) {
  switch (referenceType) {
    case "opening_balance":
      return "Opening balance";
    case "bank_transaction":
      return "Bank transaction";
    case "transfer":
      return "Transfer";
    case "expense":
      return "Income / expense";
    case "payment":
      return "Payment";
    default:
      return referenceType ?? "Entry";
  }
}

export function BankStatementManager({
  bank,
  startDate,
  endDate,
  openingBalance,
  closingBalance,
  lines,
}: Props) {
  const router = useRouter();

  function handleFilter(formData: FormData) {
    const start = String(formData.get("startDate") || "");
    const end = String(formData.get("endDate") || "");
    router.push(
      `/dashboard/banks/${bank.id}/statement?start=${start}&end=${end}`
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <Breadcrumbs
        linkComponent={({ href, children, className }) => (
          <Link href={href} className={className}>{children}</Link>
        )}
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Banks", href: "/dashboard/banks" },
          { label: bank.bank_name },
        ]}
      />

      <PageHeader
        title={`${bank.bank_name} — Statement`}
        description={`${bank.account_name} · Date-range ledger with deposits, withdrawals, and running balance.`}
      >
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Opening Balance" value={formatCurrency(openingBalance)} />
        <SummaryCard label="Closing Balance" value={formatCurrency(closingBalance)} />
        <SummaryCard label="Current Balance" value={formatCurrency(bank.current_balance)} />
      </div>

      <form
        action={handleFilter}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 print:hidden"
      >
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium">Start Date</label>
          <input id="startDate" name="startDate" type="date" defaultValue={startDate} required className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
        </div>
        <div>
          <label htmlFor="endDate" className="mb-1 block text-sm font-medium">End Date</label>
          <input id="endDate" name="endDate" type="date" defaultValue={endDate} required className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
        </div>
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const { start, end } = defaultStatementDateRange();
            router.push(
              `/dashboard/banks/${bank.id}/statement?start=${start}&end=${end}`
            );
          }}
        >
          Last 12 months
        </Button>
      </form>

      <DataTable
        data={lines}
        getRowKey={(row) => row.id}
        emptyMessage="No ledger entries in this period."
        columns={[
          {
            key: "date",
            header: "Date",
            cell: (row) => formatDate(row.entry_date),
          },
          {
            key: "particulars",
            header: "Particulars",
            cell: (row) => (
              <div>
                <p>{row.remark || referenceLabel(row.reference_type)}</p>
                <p className="text-xs text-muted-foreground">
                  {referenceLabel(row.reference_type)}
                </p>
              </div>
            ),
          },
          {
            key: "deposit",
            header: "Deposit",
            cell: (row) => (row.deposit > 0 ? formatCurrency(row.deposit) : "—"),
          },
          {
            key: "withdraw",
            header: "Withdraw",
            cell: (row) => (row.withdraw > 0 ? formatCurrency(row.withdraw) : "—"),
          },
          {
            key: "balance",
            header: "Balance",
            cell: (row) => (
              <span className="font-medium">{formatCurrency(row.balance)}</span>
            ),
          },
        ]}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}