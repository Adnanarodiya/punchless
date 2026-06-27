"use client";

import Link from "next/link";
import { HandCoins, Banknote } from "lucide-react";

import { Button } from "@punchless/ui/components/button";
import { useDashboardHomeModalsOptional } from "@/components/dashboard-home-modals";
import { ownerLabel } from "@/lib/i18n/owner-labels";
import type { PendingDueRow } from "@/lib/queries/dashboard.queries";
import { useUiLanguageStore } from "@/lib/stores/ui-language.store";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

interface Props {
  dues: PendingDueRow[];
  hasDataLockPin: boolean;
}

export function DashboardPendingDues({ dues, hasDataLockPin }: Props) {
  const locked = useFinancialLocked(hasDataLockPin);
  const homeModals = useDashboardHomeModalsOptional();
  const language = useUiLanguageStore((s) => s.language);

  return (
    <section
      aria-labelledby="pending-dues-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="pending-dues-heading" className="text-lg font-semibold">
          {ownerLabel(language, "pending.whoOwesWhat")}
        </h2>
        <Link
          href="/dashboard/customers"
          className="text-sm text-primary hover:underline"
        >
          All customers
        </Link>
      </div>

      {dues.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No outstanding customer or supplier dues.
        </p>
      ) : (
        <ul className="space-y-3">
          {dues.map((due) => (
            <li
              key={`${due.type}-${due.id}`}
              className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link
                href={
                  due.type === "client"
                    ? `/dashboard/customers?customer=${due.id}`
                    : `/dashboard/suppliers?supplier=${due.id}`
                }
                className="min-w-0 flex-1 transition hover:opacity-80"
              >
                <p className="font-medium">{due.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {due.type === "client" ? "Customer due" : "Supplier payable"}
                </p>
              </Link>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span
                  className={
                    locked
                      ? "font-semibold tracking-widest text-muted-foreground"
                      : "font-semibold text-warning"
                  }
                >
                  {maskAmount(locked, formatCurrency(due.amount))}
                </span>
                {due.type === "client" && homeModals ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => homeModals.openCollectPayment(due.id)}
                  >
                    <HandCoins className="size-3.5" />
                    Collect
                  </Button>
                ) : due.type === "client" ? (
                  <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                    <Link href={`/dashboard/customers?customer=${due.id}&open=pay`}>
                      <HandCoins className="size-3.5" />
                      Collect
                    </Link>
                  </Button>
                ) : homeModals ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => homeModals.openPaySupplier(due.id)}
                  >
                    <Banknote className="size-3.5" />
                    Pay
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                    <Link href={`/dashboard/suppliers?supplier=${due.id}&open=pay`}>
                      <Banknote className="size-3.5" />
                      Pay
                    </Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}