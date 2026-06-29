"use client";

import Link from "next/link";

import { DataTable } from "@punchless/ui/components/data-table";

import type { TodayPaymentRow } from "@/lib/queries/dashboard.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

interface Props {
  payments: TodayPaymentRow[];
  hasDataLockPin: boolean;
}

export function DashboardTodaysPayments({ payments, hasDataLockPin }: Props) {
  const locked = useFinancialLocked(hasDataLockPin);
  return (
    <section
      aria-labelledby="todays-payments-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="todays-payments-heading" className="text-lg font-semibold">
          Today&apos;s money movement
        </h2>
        <Link
          href="/dashboard/daily-report"
          className="text-sm text-primary hover:underline"
        >
          Daily report
        </Link>
      </div>

      <DataTable
        data={payments}
        getRowKey={(row) => row.id}
        emptyMessage="No payments or entries recorded today."
        columns={[
          {
            key: "label",
            header: "Particular",
            cell: (row) => (
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.source}</p>
              </div>
            ),
          },
          {
            key: "direction",
            header: "Flow",
            cell: (row) => (
              <span
                className={
                  row.direction === "in"
                    ? "text-success"
                    : "text-destructive"
                }
              >
                {row.direction === "in" ? "Received" : "Paid"}
              </span>
            ),
          },
          {
            key: "mode",
            header: "Mode",
            cell: (row) => (
              <span className="capitalize">{row.paymentMode}</span>
            ),
          },
          {
            key: "amount",
            header: "Amount",
            cell: (row) => (
              <span
                className={
                  locked
                    ? "font-medium tracking-widest text-muted-foreground"
                    : "font-medium"
                }
              >
                {maskAmount(locked, formatCurrency(row.amount))}
              </span>
            ),
          },
        ]}
      />
    </section>
  );
}