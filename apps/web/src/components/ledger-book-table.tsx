"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { TablePagination } from "@punchless/ui/components/table-pagination";
import { useTablePagination } from "@punchless/ui/hooks/use-table-pagination";
import { cn } from "@punchless/ui/lib/utils";
import { deleteStaffPayment } from "@/lib/actions/staff-payment.actions";
import { deleteTransaction } from "@/lib/actions/transaction.actions";
import { useAction } from "@/hooks/use-action";
import type { DailyBookLine } from "@/lib/queries/daily-book.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

export type LedgerBookTotals = {
  totalIncome: number;
  totalExpense: number;
  totalTransfer: number;
  totalPurchase: number;
  balance: number;
};

type Props = {
  lines: DailyBookLine[];
  totals: LedgerBookTotals;
  hasDataLockPin: boolean;
  emptyMessage: string;
  resetKey: string;
  showDateColumn?: boolean;
};

function formatMode(mode: string | null) {
  if (!mode) return "—";
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function AmountCell({
  value,
  locked,
  className,
}: {
  value: number;
  locked: boolean;
  className?: string;
}) {
  if (value <= 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={cn("tabular-nums font-medium", className)}>
      {maskAmount(locked, formatCurrency(value))}
    </span>
  );
}

const thClass =
  "whitespace-nowrap border border-border bg-muted/60 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide";

export function LedgerBookTable({
  lines,
  totals,
  hasDataLockPin,
  emptyMessage,
  resetKey,
  showDateColumn = false,
}: Props) {
  const router = useRouter();
  const locked = useFinancialLocked(hasDataLockPin);
  const [deleteTarget, setDeleteTarget] = useState<DailyBookLine | null>(null);

  const { execute: execDeleteTx, loading: deletingTx } = useAction(deleteTransaction, {
    successMessage: "Entry deleted",
    onSuccess: () => {
      setDeleteTarget(null);
      router.refresh();
    },
  });

  const { execute: execDeleteStaff, loading: deletingStaff } = useAction(
    deleteStaffPayment,
    {
      successMessage: "Payment deleted",
      onSuccess: () => {
        setDeleteTarget(null);
        router.refresh();
      },
    }
  );

  const deleting = deletingTx || deletingStaff;

  const tablePagination = useTablePagination(lines, { resetKey });
  const visibleLines = tablePagination.items;

  async function confirmDelete() {
    if (!deleteTarget) return;
    const formData = new FormData();
    if (deleteTarget.sourceType === "transaction") {
      formData.set("transactionId", deleteTarget.sourceId);
      await execDeleteTx(formData);
    } else if (deleteTarget.sourceType === "staff_payment") {
      formData.set("paymentId", deleteTarget.sourceId);
      await execDeleteStaff(formData);
    }
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr>
              <th className={cn(thClass, "w-10 text-center")}>#</th>
              <th className={cn(thClass, "min-w-[120px]")}>Type</th>
              <th className={cn(thClass, "min-w-[140px]")}>Particular</th>
              <th className={cn(thClass, "text-success")}>Income</th>
              <th className={cn(thClass, "text-destructive")}>Expense</th>
              <th className={cn(thClass)}>Transfer</th>
              <th className={cn(thClass, "text-purchase")}>Purchase</th>
              <th className={cn(thClass, "w-20")}>Mode</th>
              {showDateColumn ? (
                <th className={cn(thClass, "w-28")}>Date</th>
              ) : null}
              <th className={cn(thClass, "min-w-[120px]")}>Remark</th>
              <th className={cn(thClass, "min-w-[100px]")}>User</th>
              <th className={cn(thClass, "w-16 text-center")}>Action</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={showDateColumn ? 12 : 11}
                  className="border border-border px-4 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleLines.map((row, index) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="border border-border px-2 py-2 text-center tabular-nums text-muted-foreground">
                    {tablePagination.startIndex + index + 1}
                  </td>
                  <td className="border border-border px-2 py-2 text-xs font-medium text-muted-foreground">
                    {row.category}
                  </td>
                  <td className="border border-border px-2 py-2 font-medium">
                    {row.particular}
                  </td>
                  <td className="border border-border px-2 py-2 text-right">
                    <AmountCell value={row.income} locked={locked} className="text-success" />
                  </td>
                  <td className="border border-border px-2 py-2 text-right">
                    <AmountCell value={row.expense} locked={locked} className="text-destructive" />
                  </td>
                  <td className="border border-border px-2 py-2 text-right">
                    <AmountCell value={row.transfer} locked={locked} />
                  </td>
                  <td className="border border-border px-2 py-2 text-right">
                    <AmountCell value={row.purchase} locked={locked} className="text-purchase" />
                  </td>
                  <td className="border border-border px-2 py-2">{formatMode(row.mode)}</td>
                  {showDateColumn ? (
                    <td className="border border-border px-2 py-2 whitespace-nowrap">
                      {formatDate(row.date)}
                    </td>
                  ) : null}
                  <td className="border border-border px-2 py-2 text-muted-foreground">
                    {row.remark ?? "—"}
                  </td>
                  <td className="border border-border px-2 py-2">{row.userName ?? "—"}</td>
                  <td className="border border-border px-2 py-2 text-center">
                    {row.canDelete ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${row.particular}`}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 ? (
            <tfoot>
              <tr className="statement-row-total font-semibold">
                <td
                  colSpan={3}
                  className="border border-border px-2 py-2 text-right uppercase tracking-wide"
                >
                  Total
                </td>
                <td className="border border-border px-2 py-2 text-right text-success">
                  <AmountCell
                    value={totals.totalIncome}
                    locked={locked}
                    className="text-success"
                  />
                </td>
                <td className="border border-border px-2 py-2 text-right text-destructive">
                  <AmountCell
                    value={totals.totalExpense}
                    locked={locked}
                    className="text-destructive"
                  />
                </td>
                <td className="border border-border px-2 py-2 text-right">
                  <AmountCell value={totals.totalTransfer} locked={locked} />
                </td>
                <td className="border border-border px-2 py-2 text-right text-purchase">
                  <AmountCell
                    value={totals.totalPurchase}
                    locked={locked}
                    className="text-purchase"
                  />
                </td>
                <td colSpan={showDateColumn ? 5 : 4} className="border border-border" />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {lines.length > 0 ? (
        <TablePagination
          page={tablePagination.page}
          totalPages={tablePagination.totalPages}
          totalItems={tablePagination.totalItems}
          pageSize={tablePagination.pageSize}
          onPageChange={tablePagination.setPage}
        />
      ) : null}

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium">
        <span className="text-foreground">Balance</span>
        <span className="mx-2 text-muted-foreground">—</span>
        <span className="text-foreground">Income − Expense =</span>{" "}
        <span
          className={cn(
            "tabular-nums text-base font-bold",
            totals.balance >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {maskAmount(locked, formatCurrency(totals.balance))}
        </span>
        {totals.totalTransfer > 0 ? (
          <span className="ml-4 text-muted-foreground">
            · Transfers {maskAmount(locked, formatCurrency(totals.totalTransfer))}
          </span>
        ) : null}
        {totals.totalPurchase > 0 ? (
          <span className="ml-2 text-muted-foreground">
            · Purchases {maskAmount(locked, formatCurrency(totals.totalPurchase))}
          </span>
        ) : null}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this entry?"
        description={
          deleteTarget
            ? `Remove "${deleteTarget.particular}" from this book. This cannot be undone.`
            : ""
        }
        variant="destructive"
        confirmText="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}