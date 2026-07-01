"use client";

import type { ReactNode } from "react";

import { useTablePagination } from "../hooks/use-table-pagination";
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/paginate";
import { BalanceBadge, type BalanceMeta } from "./balance-badge";
import { cn } from "../lib/utils";
import { TablePagination } from "./table-pagination";
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
  /** INCOME / EXPENSE system ledger — particular first, no bill/vehicle columns */
  layout?: "party" | "system-income" | "system-expense";
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
  pageSize?: number;
  enablePagination?: boolean;
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

function RunningBalanceCell({
  balance,
  layout,
}: {
  balance: StatementTableRow["balance_meta"];
  layout: StatementTableLabels["layout"];
}) {
  if (layout === "system-expense") {
    return (
      <BalanceBadge
        balance={balance}
        showLabel={false}
        className="text-destructive"
      />
    );
  }

  if (layout === "system-income") {
    return (
      <BalanceBadge
        balance={balance}
        showLabel={false}
        className="text-success"
      />
    );
  }

  return <BalanceBadge balance={balance} />;
}

export function StatementTable({
  totals,
  lines,
  labels,
  className,
  renderActions,
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
  enablePagination = true,
}: StatementTableProps) {
  const layout = labels.layout ?? "party";
  const isSystemIncome = layout === "system-income";
  const isSystemExpense = layout === "system-expense";
  const isSystemLedger = isSystemIncome || isSystemExpense;
  const colSpanMeta = isSystemLedger
    ? 2
    : labels.showVehicleColumn
      ? 3
      : 2;
  const emptyColSpan = isSystemLedger ? 7 : labels.showVehicleColumn ? 11 : 10;
  const closingBalance = lines[0]?.balance_meta;
  const cellPad = isSystemLedger ? "px-4 py-2.5" : "px-2 py-2";
  const systemColWidth = `${(100 / 7).toFixed(4)}%`;
  const pagination = useTablePagination(lines, {
    pageSize: enablePagination ? pageSize : lines.length || 1,
  });
  const visibleLines = enablePagination ? pagination.items : lines;

  return (
    <div data-slot="statement-table" className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table
          className={cn(
            "statement-table w-full border-collapse text-sm",
            isSystemLedger ? "table-fixed" : "min-w-[720px]"
          )}
        >
          {isSystemLedger ? (
            <colgroup>
              {Array.from({ length: 7 }).map((_, index) => (
                <col key={index} style={{ width: systemColWidth }} />
              ))}
            </colgroup>
          ) : null}
          <thead>
            <tr className="border-b border-border bg-muted/60 text-left">
              <th
                className={cn(
                  cellPad,
                  "font-semibold",
                  isSystemLedger && "text-center"
                )}
              >
                #
              </th>
              {isSystemLedger ? (
                <th className={cn(cellPad, "font-semibold")}>Particular</th>
              ) : (
                <>
                  <th className={cn(cellPad, "font-semibold")}>{labels.invoiceColumn}</th>
                  {labels.showVehicleColumn ? (
                    <th className={cn(cellPad, "font-semibold")}>Vehicle No.</th>
                  ) : null}
                </>
              )}
              {!isSystemIncome ? (
                <th className={cn(cellPad, "font-semibold text-right")}>
                  {labels.debitColumn}
                </th>
              ) : null}
              {!isSystemExpense ? (
                <th className={cn(cellPad, "font-semibold text-right")}>
                  {labels.creditColumn}
                </th>
              ) : null}
              <th
                className={cn(
                  cellPad,
                  "font-semibold",
                  isSystemLedger && "text-center"
                )}
              >
                Date
              </th>
              {!isSystemLedger ? (
                <th className={cn(cellPad, "font-semibold")}>Remark</th>
              ) : null}
              <th className={cn(cellPad, "font-semibold text-right")}>
                Running Balance
              </th>
              <th
                className={cn(
                  cellPad,
                  "font-semibold print:hidden",
                  isSystemLedger && "text-center"
                )}
              >
                User
              </th>
              <th
                className={cn(
                  cellPad,
                  "font-semibold print:hidden",
                  isSystemLedger && "text-center"
                )}
              >
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleLines.length === 0 ? (
              <tr>
                <td
                  colSpan={emptyColSpan}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No statement entries in this period.
                </td>
              </tr>
            ) : (
              visibleLines.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <td
                    className={cn(
                      cellPad,
                      "tabular-nums text-muted-foreground",
                      isSystemLedger && "text-center"
                    )}
                  >
                    {row.index}
                  </td>
                  {isSystemLedger ? (
                    <td className={cellPad}>{row.remark ?? "—"}</td>
                  ) : (
                    <>
                      <td className={cellPad}>{row.invoice_number ?? "—"}</td>
                      {labels.showVehicleColumn ? (
                        <td className={cellPad}>{row.vehicle_number ?? "—"}</td>
                      ) : null}
                    </>
                  )}
                  {!isSystemIncome ? (
                    <td className={cn(cellPad, "text-right")}>
                      <AmountCell amount={row.debit} variant="debit" />
                    </td>
                  ) : null}
                  {!isSystemExpense ? (
                    <td className={cn(cellPad, "text-right")}>
                      <AmountCell amount={row.credit} variant="credit" />
                    </td>
                  ) : null}
                  <td
                    className={cn(
                      cellPad,
                      "whitespace-nowrap text-muted-foreground",
                      isSystemLedger && "text-center"
                    )}
                  >
                    {formatStatementDate(row.entry_date)}
                  </td>
                  {!isSystemLedger ? (
                    <td className={cellPad}>{row.remark ?? "—"}</td>
                  ) : null}
                  <td className={cn(cellPad, "text-right")}>
                    <RunningBalanceCell
                      balance={row.balance_meta}
                      layout={layout}
                    />
                  </td>
                  <td
                    className={cn(
                      cellPad,
                      "print:hidden text-muted-foreground",
                      isSystemLedger && "text-center"
                    )}
                  >
                    {row.user_name ?? "—"}
                  </td>
                  <td className={cn(cellPad, "print:hidden")}>
                    {renderActions ? (
                      <div
                        className={cn(
                          "flex items-center gap-1",
                          isSystemLedger ? "justify-center" : "justify-end"
                        )}
                      >
                        {renderActions(row)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}

            <tr className="statement-row-total border-b border-border font-bold">
              <td colSpan={colSpanMeta} className={cn(cellPad, "text-right")}>
                Period Total
              </td>
              {!isSystemIncome ? (
                <td className={cn(cellPad, "text-right text-destructive")}>
                  {formatStatementAmount(totals.debit)}
                </td>
              ) : null}
              {!isSystemExpense ? (
                <td className={cn(cellPad, "text-right text-success")}>
                  {formatStatementAmount(totals.credit)}
                </td>
              ) : null}
              {isSystemLedger ? (
                <>
                  <td className={cellPad} />
                  <td className={cn(cellPad, "text-right")}>
                    {closingBalance ? (
                      <RunningBalanceCell
                        balance={closingBalance}
                        layout={layout}
                      />
                    ) : null}
                  </td>
                  <td colSpan={2} className="print:hidden" />
                </>
              ) : (
                <td colSpan={5} />
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {enablePagination ? (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
        />
      ) : null}
    </div>
  );
}