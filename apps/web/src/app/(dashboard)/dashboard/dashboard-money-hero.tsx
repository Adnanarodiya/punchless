"use client";

import Link from "next/link";
import { ArrowDownLeft, Building2, Landmark } from "lucide-react";

import type { FinancialSummary } from "@/lib/queries/dashboard.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";
import { cn } from "@punchless/ui/lib/utils";
import { ownerLabel } from "@/lib/i18n/owner-labels";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";

interface Props {
  summary: FinancialSummary;
  hasDataLockPin: boolean;
}

export function DashboardMoneyHero({ summary, hasDataLockPin }: Props) {
  const locked = useFinancialLocked(hasDataLockPin);
  const language = useUiLanguageStore((s) => s.language);
  const cashPlusBank = summary.bankBalance + summary.cashNet;

  const cards = [
    {
      label: ownerLabel(language, "hero.customersOwe"),
      value: maskAmount(locked, formatCurrency(summary.clientCredit)),
      href: "/dashboard/customers",
      icon: Building2,
      accent: "text-warning",
      accentBg: "bg-warning/10",
      hint: "Total due from customers",
    },
    {
      label: ownerLabel(language, "hero.youOweSuppliers"),
      value: maskAmount(locked, formatCurrency(summary.supplierPayable)),
      href: "/dashboard/suppliers",
      icon: ArrowDownLeft,
      accent: "text-destructive",
      accentBg: "bg-destructive/10",
      hint: "Total payable to vendors",
    },
    {
      label: ownerLabel(language, "hero.cashBank"),
      value: maskAmount(locked, formatSigned(cashPlusBank)),
      href: "/dashboard/banks",
      icon: Landmark,
      accent: "text-primary",
      accentBg: "bg-primary/10",
      hint: `Bank ${maskAmount(locked, formatCurrency(summary.bankBalance))} · Cash (month) ${maskAmount(locked, formatSigned(summary.cashNet))}`,
    },
  ];

  return (
    <section aria-labelledby="money-hero-heading">
      <h2 id="money-hero-heading" className="sr-only">
        Money at a glance
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/30 hover:bg-accent/20"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="text-base font-medium text-muted-foreground">
                  {card.label}
                </p>
                <div className={cn("rounded-xl p-2.5", card.accentBg, card.accent)}>
                  <Icon className="size-5" />
                </div>
              </div>
              <p
                className={cn(
                  "text-3xl font-bold tracking-tight sm:text-4xl",
                  locked && "tracking-widest text-muted-foreground"
                )}
              >
                {card.value}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{card.hint}</p>
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