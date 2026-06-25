"use client";

import Link from "next/link";

import type { PendingDueRow } from "@/lib/queries/dashboard.queries";
import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

interface Props {
  dues: PendingDueRow[];
  hasDataLockPin: boolean;
}

export function DashboardPendingDues({ dues, hasDataLockPin }: Props) {
  const locked = useFinancialLocked(hasDataLockPin);

  return (
    <section
      aria-labelledby="pending-dues-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 id="pending-dues-heading" className="text-lg font-semibold">
          Top pending dues
        </h2>
        <Link
          href="/dashboard/clients"
          className="text-sm text-primary hover:underline"
        >
          All clients
        </Link>
      </div>

      {dues.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No outstanding client or supplier dues.
        </p>
      ) : (
        <ul className="space-y-3">
          {dues.map((due) => (
            <li key={`${due.type}-${due.id}`}>
              <Link
                href={
                  due.type === "client"
                    ? `/dashboard/clients`
                    : `/dashboard/suppliers`
                }
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 transition hover:bg-accent/50"
              >
                <div>
                  <p className="font-medium">{due.name}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {due.type === "client" ? "Client due" : "Supplier payable"}
                  </p>
                </div>
                <span
                  className={
                    locked
                      ? "font-semibold tracking-widest text-muted-foreground"
                      : "font-semibold text-warning"
                  }
                >
                  {maskAmount(locked, formatCurrency(due.amount))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}