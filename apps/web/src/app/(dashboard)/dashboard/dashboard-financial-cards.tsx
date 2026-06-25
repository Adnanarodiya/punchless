"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Landmark,
  TrendingUp,
} from "lucide-react";

import type { FinancialSummary } from "@/lib/queries/dashboard.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

interface Props {
  summary: FinancialSummary;
  hasDataLockPin: boolean;
}

export function DashboardFinancialCards({ summary, hasDataLockPin }: Props) {
  const locked = useFinancialLocked(hasDataLockPin);

  const cards = [
    {
      label: "Income",
      sublabel: summary.periodLabel,
      value: maskAmount(locked, formatCurrency(summary.income)),
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
      href: "/dashboard/transactions",
    },
    {
      label: "Expense",
      sublabel: summary.periodLabel,
      value: maskAmount(locked, formatCurrency(summary.expense)),
      icon: ArrowUpRight,
      color: "text-destructive",
      bg: "bg-destructive/10",
      href: "/dashboard/transactions",
    },
    {
      label: "Cash (net)",
      sublabel: "Income − expense via cash",
      value: maskAmount(locked, formatSigned(summary.cashNet)),
      icon: Banknote,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/transactions",
    },
    {
      label: "Bank balance",
      sublabel: "All active accounts",
      value: maskAmount(locked, formatCurrency(summary.bankBalance)),
      icon: Landmark,
      color: "text-state-travel",
      bg: "bg-state-travel/10",
      href: "/dashboard/banks",
    },
    {
      label: "Client credit",
      sublabel: "Total due from clients",
      value: maskAmount(locked, formatCurrency(summary.clientCredit)),
      icon: Building2,
      color: "text-warning",
      bg: "bg-warning/10",
      href: "/dashboard/clients",
    },
    {
      label: "Supplier payable",
      sublabel: "Total owed to vendors",
      value: maskAmount(locked, formatCurrency(summary.supplierPayable)),
      icon: ArrowDownLeft,
      color: "text-muted-foreground",
      bg: "bg-muted",
      href: "/dashboard/suppliers",
    },
  ];

  return (
    <section aria-labelledby="financial-heading">
      <h2 id="financial-heading" className="mb-4 text-lg font-semibold">
        Financial overview
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-border bg-card p-4 transition hover:border-primary/30 hover:bg-accent/30"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{card.label}</p>
                  <p className="text-xs text-muted-foreground">{card.sublabel}</p>
                </div>
                <div className={`rounded-lg p-2 ${card.bg} ${card.color}`}>
                  <Icon className="size-4" />
                </div>
              </div>
              <p
                className={
                  locked
                    ? "text-xl font-bold tracking-widest text-muted-foreground"
                    : "text-xl font-bold"
                }
              >
                {card.value}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function formatSigned(amount: number) {
  if (amount < 0) return `−${formatCurrency(Math.abs(amount))}`;
  return formatCurrency(amount);
}