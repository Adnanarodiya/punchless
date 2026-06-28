"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  FileText,
  Landmark,
  TrendingDown,
  User,
} from "lucide-react";

import { cn } from "@punchless/ui/lib/utils";
import type { DailyBookDaySummary } from "@/lib/queries/daily-book.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

type Props = {
  summary: DailyBookDaySummary;
  yesterdaySummary: DailyBookDaySummary;
  hasDataLockPin: boolean;
};

type CardConfig = {
  key: keyof DailyBookDaySummary;
  label: string;
  icon: typeof FileText;
  color: string;
  bg: string;
  invertTrend?: boolean;
};

const CARDS: CardConfig[] = [
  {
    key: "totalBilling",
    label: "Total billing",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "cashReceived",
    label: "Cash received",
    icon: Banknote,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    key: "bankReceived",
    label: "Bank received",
    icon: Landmark,
    color: "text-state-travel",
    bg: "bg-state-travel/10",
  },
  {
    key: "creditUdhar",
    label: "Credit / Udhar",
    icon: User,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "totalExpenses",
    label: "Total expenses",
    icon: TrendingDown,
    color: "text-destructive",
    bg: "bg-destructive/10",
    invertTrend: true,
  },
];

function percentChange(today: number, yesterday: number): number | null {
  if (yesterday === 0) {
    if (today === 0) return 0;
    return 100;
  }
  return round2(((today - yesterday) / yesterday) * 100);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function TrendBadge({
  today,
  yesterday,
  invert,
}: {
  today: number;
  yesterday: number;
  invert?: boolean;
}) {
  const change = percentChange(today, yesterday);
  if (change === null) return null;

  const isUp = change > 0;
  const isDown = change < 0;
  const isFlat = change === 0;

  const positive = invert ? isDown : isUp;
  const negative = invert ? isUp : isDown;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <span>Yesterday: {formatCurrency(yesterday)}</span>
      {!isFlat ? (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 font-medium",
            positive && "text-success",
            negative && "text-destructive"
          )}
        >
          {isUp ? (
            <ArrowUpRight className="size-3.5" aria-hidden />
          ) : (
            <ArrowDownRight className="size-3.5" aria-hidden />
          )}
          {isUp ? "+" : ""}
          {change.toFixed(2)}%
        </span>
      ) : (
        <span className="text-muted-foreground">0.00%</span>
      )}
    </p>
  );
}

export function DailyReportSummaryCards({
  summary,
  yesterdaySummary,
  hasDataLockPin,
}: Props) {
  const locked = useFinancialLocked(hasDataLockPin);

  return (
    <section aria-labelledby="daily-summary-heading">
      <h2 id="daily-summary-heading" className="sr-only">
        Daily summary
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {CARDS.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];
          const yesterdayValue = yesterdaySummary[card.key];

          return (
            <div
              key={card.key}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className={cn("rounded-lg p-2", card.bg, card.color)}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  locked && "tracking-widest text-muted-foreground"
                )}
              >
                {maskAmount(locked, formatCurrency(value))}
              </p>
              {!locked ? (
                <TrendBadge
                  today={value}
                  yesterday={yesterdayValue}
                  invert={card.invertTrend}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}