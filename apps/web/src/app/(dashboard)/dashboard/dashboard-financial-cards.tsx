"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Landmark,
  TrendingUp,
} from "lucide-react";

import type { FinancialSummary } from "@/lib/queries/dashboard.queries";
import { formatCurrency } from "@/lib/utils/formatting";

interface Props {
  summary: FinancialSummary;
}

export function DashboardFinancialCards({ summary }: Props) {
  const cards = [
    {
      label: "Income",
      sublabel: summary.periodLabel,
      value: formatCurrency(summary.income),
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success/10",
      href: "/dashboard/daily-report",
    },
    {
      label: "Expense",
      sublabel: summary.periodLabel,
      value: formatCurrency(summary.expense),
      icon: ArrowUpRight,
      color: "text-destructive",
      bg: "bg-destructive/10",
      href: "/dashboard/daily-report",
    },
    {
      label: "Cash (net)",
      sublabel: "Income − expense via cash",
      value: formatSigned(summary.cashNet),
      icon: Banknote,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/cash-book",
    },
    {
      label: "Bank balance",
      sublabel: "All active accounts",
      value: formatCurrency(summary.bankBalance),
      icon: Landmark,
      color: "text-state-travel",
      bg: "bg-state-travel/10",
      href: "/dashboard/banks",
    },
    {
      label: "Customer credit",
      sublabel: "Total due from customers",
      value: formatCurrency(summary.clientCredit),
      icon: ArrowDownLeft,
      color: "text-success",
      bg: "bg-success/10",
      href: "/dashboard/customers",
    },
    {
      label: "Supplier payable",
      sublabel: "Total owed to vendors",
      value: formatCurrency(summary.supplierPayable),
      icon: ArrowUpRight,
      color: "text-destructive",
      bg: "bg-destructive/10",
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
              <p className="text-xl font-bold">{card.value}</p>
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