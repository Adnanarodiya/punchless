"use client";

import type { ReactNode } from "react";

import { cn } from "@punchless/ui/lib/utils";

import { useFinancialLocked } from "@/lib/stores/data-lock.store";
import { formatCurrency } from "@/lib/utils/formatting";
import { maskAmount } from "@/lib/utils/mask-financial";

interface MaskedAmountProps {
  amount: number;
  className?: string;
  /** Prefix for ledger lines — safe to pass from Server Components. */
  sign?: "plus" | "minus";
  /** Custom formatter (client components only — do not pass from RSC). */
  format?: (amount: number) => string;
  children?: (formatted: string, locked: boolean) => ReactNode;
}

function applySign(value: string, sign?: "plus" | "minus") {
  if (sign === "plus") return `+${value}`;
  if (sign === "minus") return `-${value}`;
  return value;
}

export function MaskedAmount({
  amount,
  className,
  sign,
  format = formatCurrency,
  children,
}: MaskedAmountProps) {
  const locked = useFinancialLocked();
  const formatted = applySign(format(amount), sign);
  const display = maskAmount(locked, formatted);

  if (children) {
    return <>{children(display, locked)}</>;
  }

  return (
    <span
      className={cn(locked && "tracking-widest text-muted-foreground", className)}
    >
      {display}
    </span>
  );
}

export function MaskedAmountText({
  amount,
  format = formatCurrency,
}: {
  amount: number;
  format?: (amount: number) => string;
}) {
  const locked = useFinancialLocked();
  return maskAmount(locked, format(amount));
}