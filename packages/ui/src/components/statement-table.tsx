import type { ReactNode } from "react";

import { BalanceBadge, type BalanceMeta } from "./balance-badge";
import { cn } from "../lib/utils";
import {
  formatStatementAmount,
  formatStatementDate,
} from "./statement-format";

export type StatementTableLabels = {
  invoiceColumn: string;
  debitColumn: string;
  creditColumn: string;
  showVehicleColumn: boolean;
  dueBadgePrefix: string;
};

export type StatementTableRow = {
  id: string;
  index: number;
  entry_date: string;
  remark: string | null;
  debit: number;
  credit: number;
  balance_meta: BalanceMeta;
  invoice_number: string | null;
  vehicle_number: string | null;
  user_name: string | null;
};

export interface StatementTableProps {
  totals: { debit: number; credit: number };
  lines: StatementTableRow[];
  labels: StatementTableLabels;
  className?: string;
  renderActions?: (row: StatementTableRow) => ReactNode;
}

function AmountCell({
  amount,
  variant,
}: {
  amount: number;
  variant: "debit" | "credit";
}) {
  if (amount <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        variant === "debit" ? "text-destructive" : "text-success"
      )}
    >
      {formatStatementAmount(amount)}
    </span>
  );
}

export function StatementTable({
  totals,
  lines,
  labels,
  className,
  renderActions,
}: StatementTableProps) {
  const colSpanMeta = labels.showVehicleColumn ? 3 : 2;

  return (
    <div
      data-slot="statement-table"
      className={cn("overflow-x-auto rounded-lg border border-border", className)}
    >
      <table className="statement-table w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/60 text-left">
            <th className="px-2 py-2 font-semibold">#</th>
            <th className="px-2 py-2 font-semibold">{labels.invoiceColumn}</th>
            {labels.showVehicleColumn ? (
              <th className="px-2 py-2 font-semibold">Vehicle No.</th>
            ) : null}
            <th className="px-2 py-2 font-semibold text-right">
              {labels.debitColumn}
            </th>
            <th className="px-2 py-2 font-semibold text-right">
              {labels.creditColumn}
            </th>
            <th className="px-2 py-2 font-semibold">Date</th>
            <th className="px-2 py-2 font-semibold">Remark</th>
            <th className="px-2 py-2 font-semibold text-right">
              Running Balance
            </th>
            <th className="px-2 py-2 font-semibold print:hidden">User</th>
            <th className="px-2 py-2 font-semibold print:hidden">Action</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((row) => (
            <tr key={row.id} className="border-b border-border">
              <td className="px-2 py-2 tabular-nums">{row.index}</td>
              <td className="px-2 py-2">{row.invoice_number ?? "—"}</td>
              {labels.showVehicleColumn ? (
                <td className="px-2 py-2">{row.vehicle_number ?? "—"}</td>
              ) : null}
              <td className="px-2 py-2 text-right">
                <AmountCell amount={row.debit} variant="debit" />
              </td>
              <td className="px-2 py-2 text-right">
                <AmountCell amount={row.credit} variant="credit" />
              </td>
              <td className="px-2 py-2 whitespace-nowrap">
                {formatStatementDate(row.entry_date)}
              </td>
              <td className="px-2 py-2">{row.remark ?? "—"}</td>
              <td className="px-2 py-2 text-right">
                <BalanceBadge balance={row.balance_meta} />
              </td>
              <td className="px-2 py-2 print:hidden text-muted-foreground">
                {row.user_name ?? "—"}
              </td>
              <td className="px-2 py-2 print:hidden">
                {renderActions ? (
                  <div className="flex items-center justify-end gap-1">
                    {renderActions(row)}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}

          <tr className="statement-row-total border-b border-border font-bold">
            <td
              colSpan={colSpanMeta}
              className="px-2 py-2 text-right"
            >
              Period Total
            </td>
            <td className="px-2 py-2 text-right text-destructive">
              {formatStatementAmount(totals.debit)}
            </td>
            <td className="px-2 py-2 text-right text-success">
              {formatStatementAmount(totals.credit)}
            </td>
            <td colSpan={5} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}