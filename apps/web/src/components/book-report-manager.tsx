"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CalendarDays } from "lucide-react";

import { Breadcrumbs } from "@punchless/ui/components/breadcrumbs";
import { Button } from "@punchless/ui/components/button";
import { LedgerBookTable } from "@/components/ledger-book-table";
import { MaskedAmount } from "@/components/masked-amount";
import { PageHeader } from "@/components/page-header";
import type { BookReport } from "@/lib/queries/cash-book.queries";
import { formatDate } from "@/lib/utils/formatting";

type Props = {
  title: string;
  description: string;
  breadcrumbLabel: string;
  basePath: "/dashboard/cash-book" | "/dashboard/bank-book";
  report: BookReport;
  hasDataLockPin: boolean;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function buildBookUrl(basePath: string, start: string, end: string) {
  const today = todayIso();
  const params = new URLSearchParams();
  if (start !== today || end !== today) {
    params.set("start", start);
    if (end !== start) params.set("end", end);
  }
  const q = params.toString();
  return q ? `${basePath}?${q}` : basePath;
}

function formatPeriodLabel(start: string, end: string) {
  if (start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function BookReportManager({
  title,
  description,
  breadcrumbLabel,
  basePath,
  report,
  hasDataLockPin,
}: Props) {
  const router = useRouter();
  const isRange = report.periodStart !== report.periodEnd;

  function handleRangeSubmit(formData: FormData) {
    let start = String(formData.get("startDate") || todayIso());
    let end = String(formData.get("endDate") || start);
    if (end < start) {
      const swap = start;
      start = end;
      end = swap;
    }
    router.push(buildBookUrl(basePath, start, end));
  }

  function jumpToToday() {
    router.push(basePath);
  }

  const periodLabel = formatPeriodLabel(report.periodStart, report.periodEnd);

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
          { label: breadcrumbLabel },
        ]}
      />

      <PageHeader title={title} description={description} />

      <form
        action={handleRangeSubmit}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-4"
      >
        <div>
          <label htmlFor="bookStartDate" className="mb-1 block text-sm font-medium">
            From
          </label>
          <input
            id="bookStartDate"
            name="startDate"
            type="date"
            required
            defaultValue={report.periodStart}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="bookEndDate" className="mb-1 block text-sm font-medium">
            To
          </label>
          <input
            id="bookEndDate"
            name="endDate"
            type="date"
            required
            defaultValue={report.periodEnd}
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
          />
        </div>
        <Button type="submit">Show</Button>
        <Button type="button" variant="outline" onClick={jumpToToday}>
          Today
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        <CalendarDays className="mr-1 inline size-4" aria-hidden />
        {periodLabel}
        {report.lines.length === 0
          ? " — no entries"
          : ` — ${report.lines.length} entries`}
      </p>

      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4 text-sm">
        <span className="inline-flex items-center gap-1 text-success">
          <ArrowDownLeft className="size-4" />
          Receipts <MaskedAmount amount={report.totalReceipts} />
        </span>
        <span className="inline-flex items-center gap-1 text-destructive">
          <ArrowUpRight className="size-4" />
          Payments <MaskedAmount amount={report.totalPayments} />
        </span>
        <span className="font-medium">
          Net <MaskedAmount amount={report.netChange} />
        </span>
      </div>

      <LedgerBookTable
        lines={report.lines}
        totals={{
          totalIncome: report.totalIncome,
          totalExpense: report.totalExpense,
          totalTransfer: report.totalTransfer,
          totalPurchase: report.totalPurchase,
          balance: report.balance,
        }}
        hasDataLockPin={hasDataLockPin}
        emptyMessage={
          isRange
            ? "No entries in this date range."
            : "No entries on this date."
        }
        resetKey={`${report.periodStart}-${report.periodEnd}`}
        showDateColumn={isRange}
      />
    </div>
  );
}