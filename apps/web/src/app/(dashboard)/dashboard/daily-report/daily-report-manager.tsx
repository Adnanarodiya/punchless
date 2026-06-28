"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { ConfirmModal } from "@punchless/ui/components/confirm-modal";
import { cn } from "@punchless/ui/lib/utils";
import { DailyReportSummaryCards } from "@/components/daily-report-summary-cards";
import { PageHeader } from "@/components/page-header";

import { deleteStaffPayment } from "@/lib/actions/staff-payment.actions";
import { deleteTransaction } from "@/lib/actions/transaction.actions";
import { useAction } from "@/hooks/use-action";
import type { DailyBookLine, DailyBookReport } from "@/lib/queries/daily-book.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

type Props = {
  report: DailyBookReport;
  bookDate: string;
  hasDataLockPin: boolean;
  showFullReportLink?: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function buildDailyReportUrl(bookDate: string) {
  const params = new URLSearchParams();
  if (bookDate !== todayIso()) params.set("date", bookDate);
  const q = params.toString();
  return q ? `/dashboard/daily-report?${q}` : "/dashboard/daily-report";
}

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

export function DailyReportManager({
  report,
  bookDate,
  hasDataLockPin,
  showFullReportLink = false,
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

  function handleDateChange(formData: FormData) {
    const date = String(formData.get("bookDate") || todayIso());
    router.push(buildDailyReportUrl(date));
  }

  function jumpToDate(date: string) {
    router.push(buildDailyReportUrl(date));
  }

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

  const thClass =
    "whitespace-nowrap border border-border bg-muted/60 px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide";

  return (
    <div className="space-y-6">
      <Breadcrumbs
        linkComponent={({ href, children, className }) => (
          <Link href={href} className={className}>
            {children}
          </Link>
        )}
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Daily report" },
        ]}
      />

      <PageHeader
        title="Daily report"
        description="Full day book — every bill, payment, salary, expense, and transfer with today vs yesterday summary."
      >
        {showFullReportLink ? (
          <Button variant="outline" asChild>
            <Link
              href={`/dashboard/reports/rojmel?period=custom&start=${bookDate}&end=${bookDate}`}
            >
              Full ledger
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <form
        action={handleDateChange}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4"
      >
        <div>
          <label htmlFor="bookDate" className="mb-1 block text-sm font-medium">
            Date
          </label>
          <input
            id="bookDate"
            name="bookDate"
            type="date"
            required
            defaultValue={bookDate}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">Show</Button>
        <Button type="button" variant="outline" onClick={() => jumpToDate(todayIso())}>
          Today
        </Button>
        <Button type="button" variant="outline" onClick={() => jumpToDate(yesterdayIso())}>
          Yesterday
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        <CalendarDays className="mr-1 inline size-4" aria-hidden />
        {formatDate(bookDate)}
        {report.lines.length === 0
          ? " — no entries"
          : ` — ${report.lines.length} entries`}
      </p>

      <DailyReportSummaryCards
        summary={report.summary}
        yesterdaySummary={report.yesterdaySummary}
        hasDataLockPin={hasDataLockPin}
      />

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
              <th className={cn(thClass, "w-28")}>Date</th>
              <th className={cn(thClass, "min-w-[120px]")}>Remark</th>
              <th className={cn(thClass, "min-w-[100px]")}>User</th>
              <th className={cn(thClass, "w-16 text-center")}>Action</th>
            </tr>
          </thead>
          <tbody>
            {report.lines.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="border border-border px-4 py-10 text-center text-muted-foreground"
                >
                  No bills, payments, salary, expenses, or transfers on this date.
                </td>
              </tr>
            ) : (
              report.lines.map((row, index) => (
                <tr key={row.id} className="hover:bg-muted/30">
                  <td className="border border-border px-2 py-2 text-center tabular-nums text-muted-foreground">
                    {index + 1}
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
                  <td className="border border-border px-2 py-2 whitespace-nowrap">
                    {formatDate(row.date)}
                  </td>
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
          {report.lines.length > 0 ? (
            <tfoot>
              <tr className="statement-row-total font-semibold">
                <td
                  colSpan={3}
                  className="border border-border px-2 py-2 text-right uppercase tracking-wide"
                >
                  Total
                </td>
                <td className="border border-border px-2 py-2 text-right text-success">
                  <AmountCell value={report.totalIncome} locked={locked} className="text-success" />
                </td>
                <td className="border border-border px-2 py-2 text-right text-destructive">
                  <AmountCell
                    value={report.totalExpense}
                    locked={locked}
                    className="text-destructive"
                  />
                </td>
                <td className="border border-border px-2 py-2 text-right">
                  <AmountCell value={report.totalTransfer} locked={locked} />
                </td>
                <td className="border border-border px-2 py-2 text-right text-purchase">
                  <AmountCell
                    value={report.totalPurchase}
                    locked={locked}
                    className="text-purchase"
                  />
                </td>
                <td colSpan={5} className="border border-border" />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      <div className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium">
        <span className="text-foreground">Balance</span>
        <span className="mx-2 text-muted-foreground">—</span>
        <span className="text-foreground">Income − Expense =</span>{" "}
        <span
          className={cn(
            "tabular-nums text-base font-bold",
            report.balance >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {maskAmount(locked, formatCurrency(report.balance))}
        </span>
        {report.totalTransfer > 0 ? (
          <span className="ml-4 text-muted-foreground">
            · Transfers {maskAmount(locked, formatCurrency(report.totalTransfer))}
          </span>
        ) : null}
        {report.totalPurchase > 0 ? (
          <span className="ml-2 text-muted-foreground">
            · Purchases {maskAmount(locked, formatCurrency(report.totalPurchase))}
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
            ? `Remove "${deleteTarget.particular}" from the daily report. This cannot be undone.`
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