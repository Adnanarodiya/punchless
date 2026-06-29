"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@punchless/ui/lib/utils";

import type { RevenueChartPoint } from "@/lib/queries/dashboard.queries";
import { formatCurrency } from "@/lib/utils/formatting";

export type ChartRange = "7d" | "6m";

interface Props {
  points: RevenueChartPoint[];
  chartRange: ChartRange;
}

export function DashboardRevenueChart({ points, chartRange }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const maxValue = Math.max(
    1,
    ...points.flatMap((p) => [p.income, p.expense])
  );

  function setChartRange(range: ChartRange) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("chart", range);
    router.push(`/dashboard?${params.toString()}`);
  }

  const title =
    chartRange === "6m"
      ? "Last 6 months — income vs expense"
      : "Last 7 days — income vs expense";

  return (
    <section
      aria-labelledby="revenue-chart-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="revenue-chart-heading" className="mb-1 text-lg font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">
            From Income &amp; Expense entries only
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(
            [
              { id: "7d" as const, label: "7 days" },
              { id: "6m" as const, label: "6 months" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setChartRange(opt.id)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm",
                chartRange === opt.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 sm:gap-4">
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
                title={`Income ${formatCurrency(point.income)}`}
              />
              <div
                className="w-3 rounded-t bg-destructive/70 sm:w-4"
                style={{
                  height: `${Math.max(4, (point.expense / maxValue) * 100)}%`,
                }}
                title={`Expense ${formatCurrency(point.expense)}`}
              />
            </div>
            <span className="text-center text-[10px] text-muted-foreground sm:text-xs">
              {point.label ?? formatShortDate(point.date)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}