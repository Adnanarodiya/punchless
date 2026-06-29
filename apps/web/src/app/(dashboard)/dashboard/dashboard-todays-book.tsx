import Link from "next/link";
import { FileText, Landmark, Wallet } from "lucide-react";

import type { getTodaysBookSummary } from "@/lib/queries/cash-book.queries";
import { formatCurrency, formatDate } from "@/lib/utils/formatting";

type BookSummary = Awaited<ReturnType<typeof getTodaysBookSummary>>;

type Props = {
  book: BookSummary;
};

export function DashboardTodaysBook({ book }: Props) {
  const todayLabel = formatDate(book.date);

  return (
    <section aria-labelledby="todays-book-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="todays-book-heading" className="text-lg font-semibold">
          Today&apos;s book — {todayLabel}
        </h2>
        <p className="text-sm text-muted-foreground">
          {book.entryCount} entr{book.entryCount === 1 ? "y" : "ies"} today
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/cash-book"
          className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/20"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-success/15 p-2 text-success">
              <Wallet className="size-4" />
            </div>
            <span className="font-medium">Cash book</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Receipts</p>
              <p className="font-semibold text-success">
                {formatCurrency(book.cash.totalReceipts)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payments</p>
              <p className="font-semibold text-destructive">
                {formatCurrency(book.cash.totalPayments)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Net</p>
              <p className="font-semibold">
                {formatCurrency(book.cash.netChange)}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/bank-book"
          className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/20"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-primary/15 p-2 text-primary">
              <Landmark className="size-4" />
            </div>
            <span className="font-medium">Bank book</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Receipts</p>
              <p className="font-semibold text-success">
                {formatCurrency(book.bank.totalReceipts)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payments</p>
              <p className="font-semibold text-destructive">
                {formatCurrency(book.bank.totalPayments)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Net</p>
              <p className="font-semibold">
                {formatCurrency(book.bank.netChange)}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {book.allLines.length > 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Latest entries today</span>
          </div>
          <ul className="divide-y divide-border">
            {book.allLines.slice(0, 8).map((line) => (
              <li
                key={line.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <div>
                  <p className="font-medium">{line.particular}</p>
                  <p className="text-xs text-muted-foreground">
                    {line.category}
                    {line.remark ? ` · ${line.remark}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  {line.income > 0 ? (
                    <span className="font-medium text-success">
                      +{formatCurrency(line.income)}
                    </span>
                  ) : line.expense > 0 || line.purchase > 0 ? (
                    <span className="font-medium text-destructive">
                      -{formatCurrency(line.expense || line.purchase)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                  {line.mode ? (
                    <p className="text-xs text-muted-foreground">{line.mode}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-4 py-2 text-center">
            <Link href="/dashboard/daily-report" className="text-sm text-primary hover:underline">
              View full daily report →
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}