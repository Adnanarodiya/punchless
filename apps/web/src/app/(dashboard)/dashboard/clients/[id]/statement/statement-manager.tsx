"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { PageHeader } from "@punchless/ui/components/page-header";
import { DataTable } from "@punchless/ui/components/data-table";
import { Button } from "@punchless/ui/components/button";

import type { ClientWithDue } from "@/lib/queries/client.queries";
import type { StatementLine } from "@/lib/queries/client.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

interface Props {
  client: ClientWithDue;
  startDate: string;
  endDate: string;
  openingBalance: number;
  closingBalance: number;
  lines: StatementLine[];
}

function referenceLabel(referenceType: string | null) {
  switch (referenceType) {
    case "opening_balance":
      return "Opening balance";
    case "payment":
      return "Payment received";
    case "invoice":
      return "Invoice";
    default:
      return referenceType ?? "Entry";
  }
}

export function StatementManager({
  client,
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
      `/dashboard/clients/${client.id}/statement?start=${start}&end=${end}`
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
          { label: "Clients", href: "/dashboard/clients" },
          { label: client.name },
        ]}
      />

      <PageHeader
        title={`${client.name} — Statement`}
        description="Date-range ledger with opening balance, debits, credits, and running balance."
      >
        <Button variant="outline" onClick={() => window.print()}>
          Print
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Opening Balance" value={formatCurrency(openingBalance)} />
        <SummaryCard
          label="Closing Balance"
          value={formatDueAmount(closingBalance)}
        />
        <SummaryCard
          label="Current Due"
          value={formatDueAmount(client.due_amount)}
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
            defaultValue={startDate}
            required
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
            defaultValue={endDate}
            required
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">Apply</Button>
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
            cell: (row) => {
              const hasPending = row.reference_type === "invoice" && row.debit > 0.01;
              const hasReceived = row.credit > 0.01;
              const subtitle = hasPending && hasReceived
                ? `Received ${formatCurrency(row.credit)} · Pending ${formatCurrency(row.debit)} still owed`
                : hasPending
                  ? `Pending — ${formatCurrency(row.debit)} still owed`
                  : referenceLabel(row.reference_type);

              return (
                <div
                  className={
                    hasPending
                      ? "rounded-md border border-warning/30 bg-warning/10 px-2 py-1"
                      : undefined
                  }
                >
                  <p>{row.remark || referenceLabel(row.reference_type)}</p>
                  <p
                    className={
                      hasPending
                        ? "text-xs font-medium text-warning"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {subtitle}
                  </p>
                </div>
              );
            },
          },
          {
            key: "debit",
            header: "Debit",
            cell: (row) => {
              if (row.debit <= 0) return "—";

              const isPendingInvoice = row.reference_type === "invoice";

              return (
                <span
                  className={
                    isPendingInvoice ? "font-semibold text-warning" : undefined
                  }
                >
                  {formatCurrency(row.debit)}
                </span>
              );
            },
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
              <span className="font-medium">{formatDueAmount(row.balance)}</span>
            ),
          },
        ]}
      />
    </div>
  );
}

function formatDueAmount(amount: number) {
  if (amount < 0) {
    return `${formatCurrency(Math.abs(amount))} Cr`;
  }
  return formatCurrency(amount);
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}