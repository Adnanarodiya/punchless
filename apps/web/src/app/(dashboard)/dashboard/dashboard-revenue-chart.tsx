"use client";

import type { RevenueChartPoint } from "@/lib/queries/dashboard.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";

interface Props {
  points: RevenueChartPoint[];
  hasDataLockPin: boolean;
}

export function DashboardRevenueChart({ points, hasDataLockPin }: Props) {
  const locked = useFinancialLocked(hasDataLockPin);

  const maxValue = Math.max(
    1,
    ...points.flatMap((p) => [p.income, p.expense])
  );

  return (
    <section
      aria-labelledby="revenue-chart-heading"
      className="relative rounded-xl border border-border bg-card p-5"
    >
      <h2 id="revenue-chart-heading" className="mb-1 text-lg font-semibold">
        Last 7 days — income vs expense
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        From Income &amp; Expense entries only
      </p>

      <div
        className={
          locked
            ? "pointer-events-none flex items-end justify-between gap-2 blur-sm select-none sm:gap-4"
            : "flex items-end justify-between gap-2 sm:gap-4"
        }
      >
        {points.map((point) => (
          <div
            key={point.date}
            className="flex flex-1 flex-col items-center gap-2"
          >
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-success/80 sm:w-4"
                style={{
                  height: `${Math.max(4, (point.income / maxValue) * 100)}%`,
                }}
                title={locked ? undefined : `Income ${formatCurrency(point.income)}`}
              />
              <div
                className="w-3 rounded-t bg-destructive/70 sm:w-4"
                style={{
                  height: `${Math.max(4, (point.expense / maxValue) * 100)}%`,
                }}
                title={
                  locked ? undefined : `Expense ${formatCurrency(point.expense)}`
                }
              />
            </div>
            <span className="text-[10px] text-muted-foreground sm:text-xs">
              {formatShortDate(point.date)}
            </span>
          </div>
        ))}
      </div>

      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/40">
          <p className="text-sm font-medium text-muted-foreground">
            Unlock to view chart values
          </p>
        </div>
      ) : null}
    </section>
  );
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}